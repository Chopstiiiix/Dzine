import { findFont, nearestWeight } from "@/lib/fonts";
import type { Ratio } from "@/lib/ratios";
import {
  BLENDS,
  SHAPES,
  MASKS,
  type Blend,
  type Border,
  type Design,
  type ImageFilter,
  type Layer,
  type Mask,
  type PatchOp,
} from "./types";

// Everything the agent sends passes through here. The goal is to be forgiving
// (clamp, default, drop the one bad layer) rather than reject a whole design.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function num(v: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function optNum(v: unknown, min: number, max: number): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = num(v, NaN, min, max);
  return Number.isNaN(n) ? undefined : n;
}

/** A CSS value for a paint, shadow or position. Blocks anything that could load a resource or escape the property. */
export function cssValue(v: unknown, maxLen = 600): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s || s.length > maxLen) return undefined;
  if (/url\s*\(|expression\s*\(|javascript:|@import|[;{}<>\\]/i.test(s)) return undefined;
  return s;
}

function border(v: unknown): Border | undefined {
  if (!isObj(v)) return undefined;
  const width = optNum(v.width, 0, 400);
  const color = cssValue(v.color, 120);
  if (!width || !color) return undefined;
  return { width, color };
}

function oneOf<T extends string>(v: unknown, list: readonly T[]): T | undefined {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : undefined;
}

function filter(v: unknown): ImageFilter | undefined {
  if (!isObj(v)) return undefined;
  const f: ImageFilter = {
    brightness: optNum(v.brightness, 0, 4),
    contrast: optNum(v.contrast, 0, 4),
    saturate: optNum(v.saturate, 0, 4),
    grayscale: optNum(v.grayscale, 0, 1),
    sepia: optNum(v.sepia, 0, 1),
    blur: optNum(v.blur, 0, 400),
    hueRotate: optNum(v.hueRotate, -360, 360),
  };
  for (const k of Object.keys(f) as (keyof ImageFilter)[]) if (f[k] === undefined) delete f[k];
  return Object.keys(f).length ? f : undefined;
}

export function sanitizeSvgSource(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!/^<svg[\s>]/i.test(s) || s.length > 30000) return undefined;
  if (/<script|<foreignObject|<iframe|<image|<use[^>]+href\s*=\s*["']?https?:|\son\w+\s*=|javascript:|@import|url\s*\(\s*["']?https?:/i.test(s)) {
    return undefined;
  }
  return s;
}

function clean<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

/**
 * Text that spills off the canvas is never intended. The usual cause is a model treating x/y as the
 * box centre, so try that reading first, then clamp. Images and shapes may bleed on purpose.
 */
function keepTextOnCanvas<T extends { x: number; y: number; w: number; h: number; rotate?: number }>(
  box: T, W: number, H: number, id: string, warnings: string[],
): T {
  // Rotated text and boxes bigger than the canvas (giant cropped type) bleed on purpose.
  if (box.rotate || box.w > W || box.h > H) return box;
  const fix = (pos: number, size: number, max: number) => {
    if (pos >= 0 && pos + size <= max) return pos;
    if (pos - size / 2 >= 0 && pos + size / 2 <= max) return pos - size / 2;
    return Math.min(Math.max(0, pos), Math.max(0, max - size));
  };
  const x = fix(box.x, box.w, W);
  const y = fix(box.y, box.h, H);
  if (x === box.x && y === box.y) return box;
  warnings.push(`Layer "${id}" ran off the canvas, moved to ${Math.round(x)},${Math.round(y)}. x and y are the TOP-LEFT corner of the box, not its centre.`);
  return { ...box, x, y };
}

export function normalizeLayer(
  raw: unknown,
  ratio: Ratio,
  assetIds: Set<string>,
  warnings: string[],
  fallbackId: string,
): Layer | null {
  if (!isObj(raw)) return null;
  const type = raw.type;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 48) : fallbackId;
  const W = ratio.w;
  const H = ratio.h;

  const base = {
    id,
    name: typeof raw.name === "string" ? raw.name.slice(0, 80) : undefined,
    x: num(raw.x, 0, -3 * W, 4 * W),
    y: num(raw.y, 0, -3 * H, 4 * H),
    w: num(raw.w, W, 1, 6 * W),
    h: num(raw.h, H, 1, 6 * H),
    rotate: optNum(raw.rotate, -360, 360),
    opacity: optNum(raw.opacity, 0, 1),
    blend: oneOf<Blend>(raw.blend, BLENDS),
  };

  if (type === "image") {
    const asset = typeof raw.asset === "string" ? raw.asset.trim() : "";
    if (!assetIds.has(asset)) {
      warnings.push(`Layer "${id}": unknown asset "${asset}". Layer skipped. Use an id from the asset library.`);
      return null;
    }
    return clean({
      ...base,
      type: "image" as const,
      asset,
      fit: oneOf(raw.fit, ["cover", "contain"] as const),
      focus: cssValue(raw.focus, 40),
      radius: optNum(raw.radius, 0, 5000),
      filter: filter(raw.filter),
      mask: oneOf<Mask>(raw.mask, MASKS),
      shadow: cssValue(raw.shadow),
      border: border(raw.border),
      flipX: raw.flipX === true ? true : undefined,
    });
  }

  if (type === "text") {
    if (typeof raw.text !== "string" || !raw.text.length) return null;
    const font = findFont(raw.font as string);
    if (typeof raw.font === "string" && font.family.toLowerCase() !== raw.font.trim().toLowerCase()) {
      warnings.push(`Layer "${id}": font "${raw.font}" is not in the catalogue, used ${font.family}.`);
    }
    const bg = isObj(raw.bg) && cssValue(raw.bg.color)
      ? clean({
          color: cssValue(raw.bg.color)!,
          padX: optNum(raw.bg.padX, 0, 1000),
          padY: optNum(raw.bg.padY, 0, 1000),
          radius: optNum(raw.bg.radius, 0, 5000),
        })
      : undefined;
    return clean({
      ...keepTextOnCanvas(base, W, H, id, warnings),
      type: "text" as const,
      // Weaker models double-escape line breaks and send a literal backslash-n.
      text: raw.text.replace(/\\n/g, "\n").slice(0, 3000),
      font: font.family,
      size: num(raw.size, 48, 4, 3000),
      sizing: oneOf(raw.sizing, ["fit", "fill", "fixed"] as const),
      weight: nearestWeight(font, optNum(raw.weight, 100, 900)),
      color: cssValue(raw.color, 120),
      gradient: cssValue(raw.gradient),
      align: oneOf(raw.align, ["left", "center", "right"] as const),
      valign: oneOf(raw.valign, ["top", "middle", "bottom"] as const),
      lineHeight: optNum(raw.lineHeight, 0.5, 4),
      tracking: optNum(raw.tracking, -0.2, 2),
      case: oneOf(raw.case, ["none", "upper", "lower"] as const),
      italic: raw.italic === true ? true : undefined,
      wrap: raw.wrap === false ? false : undefined,
      stroke: border(raw.stroke),
      shadow: cssValue(raw.shadow),
      bg,
    });
  }

  if (type === "shape") {
    return clean({
      ...base,
      type: "shape" as const,
      shape: oneOf(raw.shape, SHAPES) ?? "rect",
      fill: cssValue(raw.fill),
      radius: optNum(raw.radius, 0, 5000),
      border: border(raw.border),
      shadow: cssValue(raw.shadow),
      blur: optNum(raw.blur, 0, 600),
    });
  }

  if (type === "svg") {
    const svg = sanitizeSvgSource(raw.svg);
    if (!svg) {
      if (typeof raw.svg === "string") warnings.push(`Layer "${id}": svg rejected (must be one self-contained <svg> element with no scripts or external references).`);
      return null;
    }
    return clean({ ...base, type: "svg" as const, svg });
  }

  return null;
}

export function normalizeDesign(
  input: unknown,
  ratio: Ratio,
  assetIds: Set<string>,
  opts: { partial?: boolean } = {},
): { design: Design; warnings: string[] } {
  const warnings: string[] = [];
  const raw = isObj(input) ? input : {};
  let rawLayers = Array.isArray(raw.layers) ? raw.layers : [];
  // While the agent is still streaming, the last layer is the one being written.
  if (opts.partial && rawLayers.length) rawLayers = rawLayers.slice(0, -1);

  const seen = new Set<string>();
  const layers: Layer[] = [];
  rawLayers.slice(0, 80).forEach((l, i) => {
    const layer = normalizeLayer(l, ratio, assetIds, opts.partial ? [] : warnings, `layer-${i + 1}`);
    if (!layer) {
      if (!opts.partial && isObj(l) && !warnings.some((w) => w.includes(`"${String(l.id ?? `layer-${i + 1}`)}"`))) {
        warnings.push(`Layer ${i + 1} (${String(l.type)}) was invalid and skipped.`);
      }
      return;
    }
    while (seen.has(layer.id)) layer.id = `${layer.id}-2`;
    seen.add(layer.id);
    layers.push(layer);
  });

  return {
    design: {
      ratio: ratio.id,
      width: ratio.w,
      height: ratio.h,
      background: cssValue(raw.background) ?? "#111111",
      grain: optNum(raw.grain, 0, 1),
      layers,
    },
    warnings,
  };
}

export function applyPatch(
  design: Design,
  patch: { background?: unknown; grain?: unknown; ops?: unknown },
  ratio: Ratio,
  assetIds: Set<string>,
): { design: Design; warnings: string[] } {
  const warnings: string[] = [];
  let layers = [...design.layers];
  const ops = (Array.isArray(patch.ops) ? patch.ops : []) as PatchOp[];

  const insert = (layer: Layer, before?: string) => {
    const at = before ? layers.findIndex((l) => l.id === before) : -1;
    if (at >= 0) layers.splice(at, 0, layer);
    else layers.push(layer);
  };

  ops.forEach((op, i) => {
    if (!isObj(op)) return;
    if (op.op === "update") {
      const at = layers.findIndex((l) => l.id === op.id);
      if (at < 0) return void warnings.push(`update: no layer with id "${op.id}".`);
      const merged = { ...layers[at], ...(isObj(op.props) ? op.props : {}), id: layers[at].id, type: layers[at].type };
      // null means "remove this property"
      for (const k of Object.keys(merged)) if ((merged as Obj)[k] === null) delete (merged as Obj)[k];
      const next = normalizeLayer(merged, ratio, assetIds, warnings, layers[at].id);
      if (next) layers[at] = next;
      else warnings.push(`update: layer "${op.id}" became invalid, change ignored.`);
    } else if (op.op === "remove") {
      const before = layers.length;
      layers = layers.filter((l) => l.id !== op.id);
      if (layers.length === before) warnings.push(`remove: no layer with id "${op.id}".`);
    } else if (op.op === "add") {
      const layer = normalizeLayer(op.layer, ratio, assetIds, warnings, `layer-new-${i + 1}`);
      if (!layer) return void warnings.push(`add: layer ${i + 1} was invalid and skipped.`);
      while (layers.some((l) => l.id === layer.id)) layer.id = `${layer.id}-2`;
      insert(layer, op.before);
    } else if (op.op === "reorder") {
      const at = layers.findIndex((l) => l.id === op.id);
      if (at < 0) return void warnings.push(`reorder: no layer with id "${op.id}".`);
      const [layer] = layers.splice(at, 1);
      insert(layer, op.before);
    }
  });

  return {
    design: {
      ...design,
      background: cssValue(patch.background) ?? design.background,
      grain: patch.grain === undefined ? design.grain : optNum(patch.grain, 0, 1),
      layers,
    },
    warnings,
  };
}

/** Re-validates a design coming from the browser (manual edits). */
export function revalidateDesign(input: unknown, ratio: Ratio, assetIds: Set<string>): Design {
  return normalizeDesign(input, ratio, assetIds).design;
}

export function designFonts(design: Design | null | undefined): string[] {
  if (!design) return [];
  return [...new Set(design.layers.filter((l) => l.type === "text").map((l) => (l as { font: string }).font))];
}
