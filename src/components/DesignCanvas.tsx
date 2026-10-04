"use client";

import DOMPurify from "dompurify";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFonts } from "@/lib/client/fonts";
import { designFonts } from "@/lib/design/normalize";
import type { Asset, Design, ImageLayer, Layer, Mask, ShapeLayer, SvgLayer, TextLayer } from "@/lib/design/types";

// Renders a design as real DOM at design-space size, then scales it to fit with a transform.
// The same node is what gets exported, so what you see is exactly what you download.

const MASK_CSS: Record<Mask, string | undefined> = {
  none: undefined,
  circle: undefined,
  "fade-bottom": "linear-gradient(to bottom, #000 55%, transparent 100%)",
  "fade-top": "linear-gradient(to top, #000 55%, transparent 100%)",
  "fade-left": "linear-gradient(to left, #000 55%, transparent 100%)",
  "fade-right": "linear-gradient(to right, #000 55%, transparent 100%)",
  "fade-edges": "radial-gradient(ellipse closest-side, #000 55%, transparent 100%)",
};

function frame(l: Layer): CSSProperties {
  return {
    position: "absolute",
    left: l.x,
    top: l.y,
    width: l.w,
    height: l.h,
    transform: l.rotate ? `rotate(${l.rotate}deg)` : undefined,
    opacity: l.opacity,
    mixBlendMode: l.blend && l.blend !== "normal" ? l.blend : undefined,
  };
}

function ImageView({ layer, asset }: { layer: ImageLayer; asset: Asset | undefined }) {
  if (!asset) return null;
  const f = layer.filter;
  const filter = f
    ? [
        f.brightness !== undefined && `brightness(${f.brightness})`,
        f.contrast !== undefined && `contrast(${f.contrast})`,
        f.saturate !== undefined && `saturate(${f.saturate})`,
        f.grayscale !== undefined && `grayscale(${f.grayscale})`,
        f.sepia !== undefined && `sepia(${f.sepia})`,
        f.hueRotate !== undefined && `hue-rotate(${f.hueRotate}deg)`,
        f.blur !== undefined && `blur(${f.blur}px)`,
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;
  const mask = layer.mask ? MASK_CSS[layer.mask] : undefined;
  return (
    <div style={{ width: "100%", height: "100%", filter: layer.shadow ? `drop-shadow(${layer.shadow})` : undefined }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          borderRadius: layer.mask === "circle" ? "50%" : layer.radius,
          border: layer.border ? `${layer.border.width}px solid ${layer.border.color}` : undefined,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt=""
          crossOrigin="anonymous"
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: layer.fit ?? "cover",
            objectPosition: layer.focus ?? "50% 50%",
            filter: filter || undefined,
            transform: layer.flipX ? "scaleX(-1)" : undefined,
          }}
        />
      </div>
    </div>
  );
}

function TextView({ layer, fontTick }: { layer: TextLayer; fontTick: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sizing = layer.sizing ?? "fit";
  const [fitted, setFitted] = useState<number | null>(null);

  // "fit" shrinks and "fill" grows the type until it exactly suits the box. The agent
  // cannot measure fonts, so this is what guarantees nothing overflows.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner || sizing === "fixed") {
      setFitted(null);
      return;
    }
    const fits = (px: number) => {
      inner.style.fontSize = `${px}px`;
      return inner.scrollWidth <= box.clientWidth + 1 && inner.offsetHeight <= box.clientHeight + 1;
    };
    const max = sizing === "fill" ? Math.min(3000, Math.max(layer.h * 2, layer.size)) : layer.size;
    let best = 4;
    if (fits(max)) best = max;
    else {
      let lo = 4;
      let hi = max;
      for (let i = 0; i < 14 && hi - lo > 0.5; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      best = lo;
    }
    best = Math.floor(best * 10) / 10;
    inner.style.fontSize = `${best}px`;
    setFitted(best);
  }, [
    sizing, layer.text, layer.font, layer.size, layer.weight, layer.w, layer.h, layer.lineHeight,
    layer.tracking, layer.case, layer.italic, layer.wrap, layer.bg?.padX, layer.bg?.padY, layer.stroke?.width, fontTick,
  ]);

  const gradient = layer.gradient;
  const justify = layer.valign === "middle" ? "center" : layer.valign === "bottom" ? "flex-end" : "flex-start";
  const alignItems = layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start";

  return (
    <div
      ref={boxRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: justify,
        alignItems: layer.bg ? alignItems : "stretch",
        filter: gradient && layer.shadow ? `drop-shadow(${layer.shadow})` : undefined,
      }}
    >
      <div
        ref={innerRef}
        style={{
          fontFamily: `"${layer.font}", system-ui, sans-serif`,
          fontSize: fitted ?? layer.size,
          fontWeight: layer.weight ?? 400,
          fontStyle: layer.italic ? "italic" : undefined,
          lineHeight: layer.lineHeight ?? 1.1,
          letterSpacing: layer.tracking ? `${layer.tracking}em` : undefined,
          textAlign: layer.align ?? "left",
          textTransform: layer.case === "upper" ? "uppercase" : layer.case === "lower" ? "lowercase" : undefined,
          whiteSpace: layer.wrap === false ? "pre" : "pre-wrap",
          color: gradient ? "transparent" : (layer.color ?? "#ffffff"),
          backgroundImage: gradient,
          backgroundClip: gradient ? "text" : undefined,
          WebkitBackgroundClip: gradient ? "text" : undefined,
          WebkitTextStroke: layer.stroke ? `${layer.stroke.width}px ${layer.stroke.color}` : undefined,
          paintOrder: layer.stroke ? "stroke fill" : undefined,
          textShadow: !gradient ? layer.shadow : undefined,
          ...(layer.bg
            ? {
                background: layer.bg.color,
                padding: `${layer.bg.padY ?? 0}px ${layer.bg.padX ?? 0}px`,
                borderRadius: layer.bg.radius,
                maxWidth: "100%",
                boxSizing: "border-box" as const,
              }
            : null),
        }}
      >
        {layer.text}
      </div>
    </div>
  );
}

// Polygon shapes are clipped boxes, so their shadow has to be a drop-shadow on a wrapper.
const POLYGONS: Partial<Record<ShapeLayer["shape"], string>> = {
  triangle: "polygon(50% 0, 100% 100%, 0 100%)",
  diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
  hexagon: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
  star: "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
};

function ShapeView({ layer }: { layer: ShapeLayer }) {
  const poly = POLYGONS[layer.shape];
  if (poly) {
    const filter = [layer.shadow && `drop-shadow(${layer.shadow})`, layer.blur && `blur(${layer.blur}px)`].filter(Boolean).join(" ");
    return (
      <div style={{ width: "100%", height: "100%", filter: filter || undefined }}>
        <div style={{ width: "100%", height: "100%", background: layer.fill, clipPath: poly }} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: layer.fill,
        borderRadius: layer.shape === "ellipse" ? "50%" : layer.radius,
        border: layer.border ? `${layer.border.width}px solid ${layer.border.color}` : undefined,
        boxShadow: layer.shadow,
        filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
      }}
    />
  );
}

function SvgView({ layer }: { layer: SvgLayer }) {
  const html = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : DOMPurify.sanitize(layer.svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ["image", "foreignObject", "a"] }),
    [layer.svg],
  );
  return <div className="dz-svg" style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

const HANDLES: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

/**
 * select  = click to pick (Shift adds), drag moves; full-bleed backdrops stay put.
 * move    = drag moves whatever is under the pointer, backdrops included.
 * marquee = drag a box; layers fully inside it get selected.
 */
export type CanvasTool = "select" | "move" | "marquee";

type Box = { x: number; y: number; w: number; h: number };

export type CanvasProps = {
  design: Design | null;
  /** Canvas size to show while there is no design yet. */
  blank: { w: number; h: number };
  assets: Asset[];
  nodeRef: RefObject<HTMLDivElement | null>;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  tool?: CanvasTool;
  /** Manual edit. `commit` is false while dragging and true when the change should be saved. */
  onChange?: (design: Design, commit: boolean) => void;
  locked?: boolean;
  working?: boolean;
  empty?: ReactNode;
};

type Gesture =
  | { kind: "drag"; px: number; py: number; start: Map<string, { x: number; y: number }>; moved: boolean; collapseTo: string | null }
  | { kind: "resize"; id: string; dx: number; dy: number; px: number; py: number; x: number; y: number; w: number; h: number; keep: boolean }
  | { kind: "rotate"; id: string; cx: number; cy: number }
  | { kind: "marquee"; x: number; y: number; additive: boolean };

export function DesignCanvas({ design, blank, assets, nodeRef, selectedIds = [], onSelect, tool = "select", onChange, locked, working, empty }: CanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const W = design?.width ?? blank.w;
  const H = design?.height ?? blank.h;
  const fontTick = useFonts(designFonts(design));
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const pad = el.clientWidth < 520 ? 16 : 40;
      const padX = el.clientWidth < 520 ? 16 : 72; // room for the tool rail on the left
      setScale(Math.max(0.02, Math.min((el.clientWidth - padX * 2) / W, (el.clientHeight - pad * 2) / H, 1.5)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  const gesture = useRef<Gesture | null>(null);
  const latest = useRef(design);
  useLayoutEffect(() => {
    latest.current = design;
  }, [design]);

  const editable = !locked && !!onSelect;
  /** Pointer position in design space. */
  const toDesign = (e: { clientX: number; clientY: number }) => {
    const r = nodeRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  const capture = (e: ReactPointerEvent) => (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  const commitLayers = (map: (l: Layer) => Layer, commit: boolean) => {
    const current = latest.current;
    if (current && onChange) onChange({ ...current, layers: current.layers.map(map) }, commit);
  };

  // ---------------------------------------------------------------- pointer down

  const onLayerDown = (e: ReactPointerEvent, layer: Layer) => {
    if (!editable || tool === "marquee") return; // the marquee starts on the wrapper
    e.stopPropagation();
    let ids = selectedIds;
    if (e.shiftKey) ids = ids.includes(layer.id) ? ids.filter((x) => x !== layer.id) : [...ids, layer.id];
    else if (!ids.includes(layer.id)) ids = [layer.id];
    onSelect!(ids);
    if (!onChange || !ids.includes(layer.id)) return;
    const isBackdrop = layer.w >= W * 0.9 && layer.h >= H * 0.9;
    if (tool === "select" && isBackdrop) return;
    capture(e);
    const layers = latest.current?.layers ?? [];
    const start = new Map(layers.filter((l) => ids.includes(l.id)).map((l) => [l.id, { x: l.x, y: l.y }]));
    // A plain click inside a group narrows the selection to that layer, unless it turns into a drag.
    const collapseTo = !e.shiftKey && ids.length > 1 ? layer.id : null;
    gesture.current = { kind: "drag", px: e.clientX, py: e.clientY, start, moved: false, collapseTo };
  };

  const onWrapDown = (e: ReactPointerEvent) => {
    if (!editable) return;
    if (tool !== "marquee" || !nodeRef.current) {
      onSelect!([]);
      return;
    }
    capture(e);
    const p = toDesign(e);
    gesture.current = { kind: "marquee", x: p.x, y: p.y, additive: e.shiftKey };
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onHandleDown = (e: ReactPointerEvent, layer: Layer, dx: number, dy: number) => {
    if (!editable || !onChange) return;
    e.stopPropagation();
    capture(e);
    // Images keep their proportions from a corner; Shift does the same for anything else.
    const keep = dx !== 0 && dy !== 0 && (layer.type === "image" || e.shiftKey);
    gesture.current = { kind: "resize", id: layer.id, dx, dy, px: e.clientX, py: e.clientY, x: layer.x, y: layer.y, w: layer.w, h: layer.h, keep };
  };

  const onRotateDown = (e: ReactPointerEvent, layer: Layer) => {
    if (!editable || !onChange) return;
    e.stopPropagation();
    capture(e);
    gesture.current = { kind: "rotate", id: layer.id, cx: layer.x + layer.w / 2, cy: layer.y + layer.h / 2 };
  };

  // ---------------------------------------------------------------- move / up

  const onMove = (e: ReactPointerEvent, commit: boolean) => {
    const g = gesture.current;
    if (!g) return;
    if (commit) gesture.current = null;

    if (g.kind === "marquee") {
      const p = toDesign(e);
      const r = { x: Math.min(g.x, p.x), y: Math.min(g.y, p.y), w: Math.abs(p.x - g.x), h: Math.abs(p.y - g.y) };
      if (!commit) return setBox(r);
      setBox(null);
      const inside = (latest.current?.layers ?? [])
        .filter((l) => l.x >= r.x && l.y >= r.y && l.x + l.w <= r.x + r.w && l.y + l.h <= r.y + r.h)
        .map((l) => l.id);
      if (r.w * scale < 4 && r.h * scale < 4) return onSelect!(g.additive ? selectedIds : []);
      onSelect!(g.additive ? [...new Set([...selectedIds, ...inside])] : inside);
      return;
    }

    if (g.kind === "drag") {
      const dx = (e.clientX - g.px) / scale;
      const dy = (e.clientY - g.py) / scale;
      if (!g.moved && Math.hypot(dx, dy) < 3) {
        if (commit && g.collapseTo) onSelect!([g.collapseTo]);
        return;
      }
      g.moved = true;
      commitLayers((l) => {
        const s = g.start.get(l.id);
        return s ? { ...l, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : l;
      }, commit);
      return;
    }

    if (g.kind === "resize") {
      // ponytail: handles work in the unrotated frame, so resizing a rotated layer drifts a little.
      const mx = (e.clientX - g.px) / scale;
      const my = (e.clientY - g.py) / scale;
      let w = Math.max(8, g.w + mx * g.dx);
      let h = Math.max(8, g.h + my * g.dy);
      if (g.keep) {
        const k = Math.abs(mx) > Math.abs(my) ? w / g.w : h / g.h;
        w = Math.max(8, g.w * k);
        h = Math.max(8, g.h * k);
      }
      const x = g.dx === -1 ? g.x + g.w - w : g.x;
      const y = g.dy === -1 ? g.y + g.h - h : g.y;
      commitLayers((l) => (l.id === g.id ? { ...l, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } : l), commit);
      return;
    }

    // rotate: angle from the layer's centre to the pointer, 0 = handle straight up.
    const p = toDesign(e);
    let deg = (Math.atan2(p.y - g.cy, p.x - g.cx) * 180) / Math.PI + 90;
    if (e.shiftKey) deg = Math.round(deg / 15) * 15;
    else if (Math.abs(deg - Math.round(deg / 90) * 90) < 4) deg = Math.round(deg / 90) * 90; // snap to square
    deg = ((((Math.round(deg) + 180) % 360) + 360) % 360) - 180;
    commitLayers((l) => (l.id === g.id ? { ...l, rotate: deg || undefined } : l), commit);
  };

  const selection = (design?.layers ?? []).filter((l) => selectedIds.includes(l.id));
  const single = selection.length === 1 ? selection[0] : null;
  const layerCursor = locked ? "default" : tool === "move" ? "move" : tool === "marquee" ? "crosshair" : "pointer";

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full select-none overflow-hidden"
      style={{ cursor: tool === "marquee" && !locked ? "crosshair" : undefined, touchAction: tool === "marquee" ? "none" : undefined }}
      onPointerDown={onWrapDown}
      // Captured pointers on layers and handles bubble up here, so one pair of handlers covers every gesture.
      onPointerMove={(e) => onMove(e, false)}
      onPointerUp={(e) => onMove(e, true)}
      onPointerCancel={(e) => onMove(e, true)}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: W * scale, height: H * scale, transform: "translate(-50%, -50%)", visibility: scale ? "visible" : "hidden" }}
      >
        <div
          className={`dz-artboard ${working ? "dz-working" : ""}`}
          style={{ width: W * scale, height: H * scale }}
        >
          <div
            ref={nodeRef}
            style={{
              position: "relative",
              width: W,
              height: H,
              overflow: "hidden",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: design?.background ?? "#ffffff",
              isolation: "isolate",
            }}
          >
            {design?.layers.map((layer) => (
              <div
                key={layer.id}
                data-layer={layer.id}
                style={{ ...frame(layer), cursor: layerCursor, touchAction: "none" }}
                onPointerDown={(e) => onLayerDown(e, layer)}
              >
                {layer.type === "image" && <ImageView layer={layer} asset={assetById.get(layer.asset)} />}
                {layer.type === "text" && <TextView layer={layer} fontTick={fontTick} />}
                {layer.type === "shape" && <ShapeView layer={layer} />}
                {layer.type === "svg" && <SvgView layer={layer} />}
              </div>
            ))}
            {design?.grain ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage: "url(/grain.png)",
                  backgroundSize: "256px 256px",
                  mixBlendMode: "overlay",
                  opacity: Math.min(1, design.grain),
                }}
              />
            ) : null}
          </div>
        </div>

        {!design && empty ? <div className="absolute inset-0 flex items-center justify-center">{empty}</div> : null}

        {!locked
          ? selection.map((l) => (
              <div
                key={l.id}
                className="pointer-events-none absolute rounded-[2px] outline outline-[1.5px] outline-[var(--accent)]"
                style={{
                  left: l.x * scale,
                  top: l.y * scale,
                  width: l.w * scale,
                  height: l.h * scale,
                  transform: l.rotate ? `rotate(${l.rotate}deg)` : undefined,
                }}
              >
                {single && onChange && tool !== "marquee" ? (
                  <>
                    <div aria-hidden className="absolute left-1/2 top-[-22px] h-[22px] w-px -translate-x-1/2 bg-[var(--accent)]" />
                    <div
                      aria-hidden
                      title="Drag to rotate (Shift snaps to 15°)"
                      className="pointer-events-auto absolute left-1/2 top-[-36px] flex h-7 w-7 -translate-x-1/2 cursor-grab items-center justify-center"
                      style={{ touchAction: "none" }}
                      onPointerDown={(e) => onRotateDown(e, l)}
                    >
                      <span className="h-3 w-3 rounded-full border-[1.5px] border-[var(--accent)] bg-white" />
                    </div>
                    {HANDLES.map(([dx, dy]) => (
                      <div
                        key={`${dx}${dy}`}
                        aria-hidden
                        className="pointer-events-auto absolute h-2.5 w-2.5 rounded-[2px] border-[1.5px] border-[var(--accent)] bg-white"
                        style={{
                          left: `${(dx + 1) * 50}%`,
                          top: `${(dy + 1) * 50}%`,
                          transform: "translate(-50%, -50%)",
                          cursor: dx === 0 ? "ns-resize" : dy === 0 ? "ew-resize" : dx === dy ? "nwse-resize" : "nesw-resize",
                          touchAction: "none",
                        }}
                        onPointerDown={(e) => onHandleDown(e, l, dx, dy)}
                      />
                    ))}
                  </>
                ) : null}
              </div>
            ))
          : null}

        {box ? (
          <div
            className="pointer-events-none absolute border border-dashed border-[var(--accent)] bg-[var(--accent)]/10"
            style={{ left: box.x * scale, top: box.y * scale, width: box.w * scale, height: box.h * scale }}
          />
        ) : null}
      </div>
    </div>
  );
}
