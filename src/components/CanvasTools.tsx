"use client";

import {
  Blend, Circle, Diamond, Droplet, Eraser, FlipHorizontal2, Hexagon, Loader2, MousePointer2, Move, PaintBucket, RotateCcw, RotateCw,
  Shapes, Square, SquareDashed, SquareRoundCorner, Star, SunMedium, Triangle, Type,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Design, Layer, ShapeKind } from "@/lib/design/types";
import type { CanvasTool } from "./DesignCanvas";

// The tool rail beside the canvas. Property tools act on every selected layer they apply to;
// fill and gradient paint the design's background when nothing is selected.

type Panel = "shapes" | "fill" | "gradient" | "shadow" | "opacity" | "rotate" | null;
type AddKind = "text" | ShapeKind | "rounded";

const SHADOWS: { label: string; value: string | undefined }[] = [
  { label: "None", value: undefined },
  { label: "Soft", value: "0 8px 24px rgba(0,0,0,0.35)" },
  { label: "Lifted", value: "0 18px 48px rgba(0,0,0,0.5)" },
  { label: "Hard", value: "6px 6px 0 rgba(0,0,0,0.9)" },
  { label: "Glow", value: "0 0 28px rgba(255,255,255,0.75)" },
];

const SHAPE_TOOLS: { kind: AddKind; label: string; icon: ReactNode }[] = [
  { kind: "rect", label: "Rectangle", icon: <Square size={16} /> },
  { kind: "rounded", label: "Rounded rectangle", icon: <SquareRoundCorner size={16} /> },
  { kind: "ellipse", label: "Circle", icon: <Circle size={16} /> },
  { kind: "triangle", label: "Triangle", icon: <Triangle size={16} /> },
  { kind: "diamond", label: "Diamond", icon: <Diamond size={16} /> },
  { kind: "hexagon", label: "Hexagon", icon: <Hexagon size={16} /> },
  { kind: "star", label: "Star", icon: <Star size={16} /> },
];

/** The first hex colour in a CSS paint, so the pickers open on something close to what is there. */
const firstHex = (css: string | undefined, fallback: string) => css?.match(/#[0-9a-f]{6}\b/i)?.[0] ?? fallback;
const paintOf = (l: Layer | undefined) => (l?.type === "text" ? (l.gradient ?? l.color) : l?.type === "shape" ? l.fill : undefined);

export function CanvasTools({
  design,
  selection,
  tool,
  onTool,
  onPatch,
  onBackground,
  onAdd,
  onCutout,
  cutting,
  disabled,
}: {
  design: Design | null;
  selection: Layer[];
  tool: CanvasTool;
  onTool: (t: CanvasTool) => void;
  onPatch: (fn: (l: Layer) => Partial<Layer> | null) => void;
  onBackground: (css: string) => void;
  onAdd: (kind: AddKind) => void;
  onCutout: () => void;
  cutting: boolean;
  disabled: boolean;
}) {
  const [panel, setPanel] = useState<Panel>(null);

  const off = disabled || !design;
  const none = selection.length === 0;
  const painted = selection.filter((l) => l.type === "text" || l.type === "shape");
  const shadowed = selection.filter((l) => l.type !== "svg") as Exclude<Layer, { type: "svg" }>[];
  const images = selection.filter((l) => l.type === "image");
  const first = selection[0];

  const can: Record<Exclude<Panel, null>, boolean> = {
    shapes: true,
    fill: none || painted.length > 0,
    gradient: none || painted.length > 0,
    shadow: shadowed.length > 0,
    opacity: !none,
    rotate: !none,
  };
  const target = none ? "background" : painted.length === 1 ? painted[0].type : "selection";
  const current = none ? design?.background : paintOf(painted[0]);

  const paint = (css: string, gradient: boolean) => {
    if (none) return onBackground(css);
    onPatch((l) =>
      l.type === "text" ? (gradient ? { gradient: css } : { color: css, gradient: undefined }) : l.type === "shape" ? { fill: css } : null,
    );
  };
  const toggle = (p: Panel) => setPanel((x) => (x === p ? null : p));
  const show = panel && !off && can[panel] ? panel : null;

  return (
    <div className="pointer-events-none absolute inset-y-2 left-2 z-10 flex items-center gap-2 md:left-3" onPointerDown={(e) => e.stopPropagation()}>
      <div
        role="toolbar"
        aria-label="Canvas tools"
        aria-orientation="vertical"
        className="dz-scroll pointer-events-auto flex max-h-full flex-col gap-0.5 overflow-y-auto rounded-xl border border-line bg-panel p-1 shadow-lg"
      >
        <Tool label="Select (A)" desc="Click a layer to pick it, Shift-click to pick more, then drag to move. Full-size backgrounds stay put." active={tool === "select"} disabled={off} onClick={() => onTool("select")}>
          <MousePointer2 size={16} />
        </Tool>
        <Tool label="Move (V)" desc="Drag anything on the canvas to move it, backgrounds included." active={tool === "move"} disabled={off} onClick={() => onTool("move")}>
          <Move size={16} />
        </Tool>
        <Tool label="Marquee (M)" desc="Drag a box on the canvas to select every layer fully inside it. Shift adds to the selection." active={tool === "marquee"} disabled={off} onClick={() => onTool("marquee")}>
          <SquareDashed size={16} />
        </Tool>
        <Sep />
        <Tool label="Add text" desc="Drops a new text box in the middle. Change the words in the bar under the canvas." disabled={off} onClick={() => onAdd("text")}>
          <Type size={16} />
        </Tool>
        <Tool label="Shapes" desc="Add a rectangle, circle, triangle, diamond, hexagon or star." disabled={off} active={show === "shapes"} onClick={() => toggle("shapes")}>
          <Shapes size={16} />
        </Tool>
        <Sep />
        <Tool label="Colour fill" desc={`Paint the ${target} one solid colour. With nothing selected, this colours the background.`} disabled={off || !can.fill} active={show === "fill"} onClick={() => toggle("fill")}>
          <PaintBucket size={16} />
        </Tool>
        <Tool label="Gradient" desc={`Blend two colours across the ${target}, at any angle.`} disabled={off || !can.gradient} active={show === "gradient"} onClick={() => toggle("gradient")}>
          <Droplet size={16} />
        </Tool>
        <Tool label="Drop shadow" desc="Give the selection a soft, lifted, hard or glowing shadow. Select a layer first." disabled={off || !can.shadow} active={show === "shadow"} onClick={() => toggle("shadow")}>
          <SunMedium size={16} />
        </Tool>
        <Tool label="Opacity" desc="Make the selection see-through. Select a layer first." disabled={off || !can.opacity} active={show === "opacity"} onClick={() => toggle("opacity")}>
          <Blend size={16} />
        </Tool>
        <Tool label="Rotate and flip" desc="Turn the selection to any angle or in 90° steps, or mirror an image. Select a layer first." disabled={off || !can.rotate} active={show === "rotate"} onClick={() => toggle("rotate")}>
          <RotateCw size={16} />
        </Tool>
        <Tool label="Remove background" desc="Cut the subject out of a photo so it sits on the design. Select one image first." disabled={off || selection.length !== 1 || images.length !== 1 || cutting} onClick={onCutout}>
          {cutting ? <Loader2 size={16} className="animate-spin" /> : <Eraser size={16} />}
        </Tool>
      </div>

      {show ? (
        <div className="pointer-events-auto w-56 rounded-xl border border-line bg-panel p-3 text-[12.5px] shadow-lg">
          {show === "shapes" ? (
            <div className="flex flex-col gap-2">
              <span className="font-medium">Add a shape</span>
              <div className="grid grid-cols-4 gap-1">
                {SHAPE_TOOLS.map((s) => (
                  <button
                    key={s.kind}
                    type="button"
                    data-tip={s.label}
                    aria-label={`Add ${s.label.toLowerCase()}`}
                    onClick={() => {
                      onAdd(s.kind);
                      setPanel(null);
                    }}
                    className="flex h-10 items-center justify-center rounded-lg text-muted transition hover:bg-soft hover:text-ink"
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {show === "fill" ? <FillPanel key={target} initial={firstHex(current, "#ffffff")} target={target} onPick={(c) => paint(c, false)} /> : null}
          {show === "gradient" ? <GradientPanel key={target} initial={firstHex(current, "#f5c542")} target={target} onPick={(c) => paint(c, true)} /> : null}

          {show === "shadow" ? (
            <div className="flex flex-col gap-1">
              <p className="mb-1 font-medium">Drop shadow</p>
              {SHADOWS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onPatch((l) => (l.type === "svg" ? null : { shadow: s.value }))}
                  className={`rounded-lg px-2.5 py-1.5 text-left transition ${shadowed[0]?.shadow === s.value ? "bg-soft font-medium text-ink" : "text-muted hover:bg-soft hover:text-ink"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}

          {show === "opacity" ? (
            <label className="flex flex-col gap-2">
              <span className="flex justify-between font-medium">
                Opacity <span className="tabular-nums text-muted">{Math.round((first?.opacity ?? 1) * 100)}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((first?.opacity ?? 1) * 100)}
                onChange={(e) => onPatch(() => ({ opacity: +e.target.value >= 100 ? undefined : +e.target.value / 100 }))}
              />
            </label>
          ) : null}

          {show === "rotate" ? (
            <div className="flex flex-col gap-2">
              <span className="flex justify-between font-medium">
                Rotate <span className="tabular-nums text-muted">{first?.rotate ?? 0}°</span>
              </span>
              <input type="range" min={-180} max={180} value={first?.rotate ?? 0} onChange={(e) => onPatch(() => ({ rotate: +e.target.value || undefined }))} />
              <div className="flex gap-1">
                <PanelButton label="Rotate left 90°" onClick={() => onPatch((l) => ({ rotate: turn(l.rotate, -90) }))}>
                  <RotateCcw size={15} />
                </PanelButton>
                <PanelButton label="Rotate right 90°" onClick={() => onPatch((l) => ({ rotate: turn(l.rotate, 90) }))}>
                  <RotateCw size={15} />
                </PanelButton>
                <PanelButton label="Flip image horizontally" disabled={!images.length} onClick={() => onPatch((l) => (l.type === "image" ? { flipX: !l.flipX || undefined } : null))}>
                  <FlipHorizontal2 size={15} />
                </PanelButton>
              </div>
              <p className="text-[11.5px] text-faint">Or drag the round handle above a selected layer. Shift snaps to 15°.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Adds degrees and wraps into -180..180. */
const turn = (deg: number | undefined, by: number) => ((((deg ?? 0) + by + 540) % 360) - 180) || undefined;

function FillPanel({ initial, target, onPick }: { initial: string; target: string; onPick: (c: string) => void }) {
  const [color, setColor] = useState(initial);
  return (
    <label className="flex flex-col gap-2">
      <span className="font-medium">Fill the {target}</span>
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          onPick(e.target.value);
        }}
        className="h-9 w-full cursor-pointer rounded-lg border border-line bg-transparent"
      />
    </label>
  );
}

function GradientPanel({ initial, target, onPick }: { initial: string; target: string; onPick: (c: string) => void }) {
  const [from, setFrom] = useState(initial);
  const [to, setTo] = useState("#e2554f");
  const [angle, setAngle] = useState(180);
  const apply = (f: string, t: string, a: number) => onPick(`linear-gradient(${a}deg, ${f}, ${t})`);
  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium">Gradient on the {target}</span>
      <div className="h-6 rounded-md border border-line" style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }} />
      <div className="flex gap-2">
        <input type="color" aria-label="Start colour" value={from} onChange={(e) => (setFrom(e.target.value), apply(e.target.value, to, angle))} className="h-9 flex-1 cursor-pointer rounded-lg border border-line bg-transparent" />
        <input type="color" aria-label="End colour" value={to} onChange={(e) => (setTo(e.target.value), apply(from, e.target.value, angle))} className="h-9 flex-1 cursor-pointer rounded-lg border border-line bg-transparent" />
      </div>
      <label className="flex items-center gap-2 text-muted">
        Angle
        <input type="range" min={0} max={360} step={15} value={angle} onChange={(e) => (setAngle(+e.target.value), apply(from, to, +e.target.value))} className="flex-1" />
        <span className="w-9 text-right tabular-nums">{angle}°</span>
      </label>
    </div>
  );
}

function Tool({ label, desc, active, disabled, onClick, children }: { label: string; desc: string; active?: boolean; disabled?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-tip={label}
      data-tip-desc={desc}
      data-tip-side="right"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-30 ${active ? "bg-soft text-ink" : "text-muted hover:bg-soft hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function PanelButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-tip={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 flex-1 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-soft hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="mx-1.5 my-0.5 h-px shrink-0 bg-line" />;
