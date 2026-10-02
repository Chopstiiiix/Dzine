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

function ShapeView({ layer }: { layer: ShapeLayer }) {
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

export type CanvasProps = {
  design: Design | null;
  /** Canvas size to show while there is no design yet. */
  blank: { w: number; h: number };
  assets: Asset[];
  nodeRef: RefObject<HTMLDivElement | null>;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Manual edit. `commit` is false while dragging and true when the change should be saved. */
  onChange?: (design: Design, commit: boolean) => void;
  locked?: boolean;
  working?: boolean;
  empty?: ReactNode;
};

export function DesignCanvas({ design, blank, assets, nodeRef, selectedId, onSelect, onChange, locked, working, empty }: CanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const W = design?.width ?? blank.w;
  const H = design?.height ?? blank.h;
  const fontTick = useFonts(designFonts(design));
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const pad = el.clientWidth < 520 ? 16 : 40;
      setScale(Math.max(0.02, Math.min((el.clientWidth - pad * 2) / W, (el.clientHeight - pad * 2) / H, 1.5)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  const drag = useRef<{ id: string; px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const latest = useRef(design);
  useLayoutEffect(() => {
    latest.current = design;
  }, [design]);

  const onLayerDown = (e: ReactPointerEvent, layer: Layer) => {
    if (locked || !onSelect) return;
    e.stopPropagation();
    onSelect(layer.id);
    const isBackdrop = layer.w >= W * 0.9 && layer.h >= H * 0.9;
    if (isBackdrop || !onChange) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: layer.id, px: e.clientX, py: e.clientY, x: layer.x, y: layer.y, moved: false };
  };

  const moveTo = (e: ReactPointerEvent, commit: boolean) => {
    const d = drag.current;
    const current = latest.current;
    if (!d || !current || !onChange) return;
    const dx = (e.clientX - d.px) / scale;
    const dy = (e.clientY - d.py) / scale;
    if (!d.moved && Math.hypot(dx, dy) < 3) {
      if (commit) drag.current = null;
      return;
    }
    d.moved = true;
    onChange(
      { ...current, layers: current.layers.map((l) => (l.id === d.id ? { ...l, x: Math.round(d.x + dx), y: Math.round(d.y + dy) } : l)) },
      commit,
    );
    if (commit) drag.current = null;
  };

  const selected = design?.layers.find((l) => l.id === selectedId);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden" onPointerDown={() => onSelect?.(null)}>
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
                style={{ ...frame(layer), cursor: locked ? "default" : "pointer", touchAction: "none" }}
                onPointerDown={(e) => onLayerDown(e, layer)}
                onPointerMove={(e) => moveTo(e, false)}
                onPointerUp={(e) => moveTo(e, true)}
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

        {selected && !locked ? (
          <div
            className="pointer-events-none absolute rounded-[2px] outline outline-[1.5px] outline-[var(--accent)]"
            style={{
              left: selected.x * scale,
              top: selected.y * scale,
              width: selected.w * scale,
              height: selected.h * scale,
              transform: selected.rotate ? `rotate(${selected.rotate}deg)` : undefined,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
