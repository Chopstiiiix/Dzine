"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// One tooltip for the whole app. Any element with data-tip gets an explainer on hover or
// keyboard focus:
//   data-tip="Layers"                     the title
//   data-tip-desc="Every layer in…"       optional explanation underneath
//   data-tip-side="right"                 top | bottom (default) | left | right; flips if it would leave the screen
// It finds the element under the pointer itself, so disabled buttons get explained too.

type Tip = { el: Element; title: string; desc: string | null; side: string };

const DELAY = 450;
const GAP = 8;

function tipFor(el: Element | null): Tip | null {
  const host = el?.closest("[data-tip]");
  const title = host?.getAttribute("data-tip");
  if (!host || !title) return null;
  return { el: host, title, desc: host.getAttribute("data-tip-desc"), side: host.getAttribute("data-tip-side") || "bottom" };
}

export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: Element | null = null;
    let shown = false;
    let frame = 0;

    const show = (next: Tip | null, immediate: boolean) => {
      if (next?.el === current) return;
      current = next?.el ?? null;
      clearTimeout(timer);
      if (!next) {
        shown = false;
        setTip(null);
        return;
      }
      // Once one tip is showing, moving along a toolbar shows the next one straight away.
      const reveal = () => {
        shown = true;
        setPos(null);
        setTip(next);
      };
      if (immediate || shown) reveal();
      else {
        setTip(null);
        timer = setTimeout(reveal, DELAY);
      }
    };
    const hide = () => {
      current = null;
      shown = false;
      clearTimeout(timer);
      setTip(null);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => show(tipFor(document.elementFromPoint(e.clientX, e.clientY)), false));
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Element;
      if (el.matches?.(":focus-visible")) show(tipFor(el), true);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", hide, true);
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", hide, true);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, []);

  // Place it once it has rendered and can be measured.
  useLayoutEffect(() => {
    if (!tip || !box.current) return;
    const r = tip.el.getBoundingClientRect();
    const { width: w, height: h } = box.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const at = (side: string) =>
      side === "top" ? { left: r.left + r.width / 2 - w / 2, top: r.top - h - GAP }
      : side === "left" ? { left: r.left - w - GAP, top: r.top + r.height / 2 - h / 2 }
      : side === "right" ? { left: r.right + GAP, top: r.top + r.height / 2 - h / 2 }
      : { left: r.left + r.width / 2 - w / 2, top: r.bottom + GAP };
    const fits = (p: { left: number; top: number }) => p.left >= 4 && p.top >= 4 && p.left + w <= vw - 4 && p.top + h <= vh - 4;
    const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
    let p = at(tip.side);
    if (!fits(p) && fits(at(opposite[tip.side]))) p = at(opposite[tip.side]);
    setPos({ left: Math.min(Math.max(4, p.left), vw - w - 4), top: Math.min(Math.max(4, p.top), vh - h - 4) });
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={box}
      role="tooltip"
      className="pointer-events-none fixed z-[100] max-w-[260px] rounded-lg border border-line bg-panel px-2.5 py-2 text-[12.5px] leading-snug shadow-xl transition-opacity duration-100"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, opacity: pos ? 1 : 0 }}
    >
      <p className="font-medium text-ink">{tip.title}</p>
      {tip.desc ? <p className="mt-0.5 text-muted">{tip.desc}</p> : null}
    </div>
  );
}
