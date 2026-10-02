"use client";

import { Palette, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Design } from "@/lib/design/types";
import { DesignCanvas } from "./DesignCanvas";

export type Style = { id: string; name: string; use: string; design: Design };

function Preview({ design }: { design: Design }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return <DesignCanvas design={design} blank={{ w: design.width, h: design.height }} assets={[]} nodeRef={nodeRef} />;
}

/** The "Style" button in the composer and its grid of typography styles. null = Auto (Dzine chooses). */
export function StylePicker({ ratio, value, onChange, disabled }: { ratio: string; value: Style | null; onChange: (s: Style | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [styles, setStyles] = useState<{ ratio: string; list: Style[] } | null>(null);

  useEffect(() => {
    if (!open || styles?.ratio === ratio) return;
    let alive = true;
    fetch(`/api/styles?ratio=${encodeURIComponent(ratio)}`, { cache: "no-cache" })
      .then((r) => r.json())
      .then((b) => alive && setStyles({ ratio, list: b.styles }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open, ratio, styles?.ratio]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (s: Style | null) => {
    onChange(s);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title="Choose a text style"
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2 text-[12.5px] font-medium text-muted transition hover:bg-soft hover:text-ink disabled:opacity-40"
      >
        <Palette size={16} />
        <span className="max-w-[92px] truncate">{value ? value.name : "Style"}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Text styles"
            className="flex max-h-[88vh] w-[min(1040px,100%)] flex-col rounded-2xl border border-line bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-semibold">Text style</h2>
                <p className="text-[12.5px] text-muted">Pick how the type looks, or let Dzine choose for your brief.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="dz-scroll grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 overflow-y-auto p-5">
              <button
                type="button"
                aria-pressed={!value}
                onClick={() => pick(null)}
                className={`flex flex-col gap-2 rounded-xl p-1.5 text-left transition hover:bg-soft ${!value ? "ring-2 ring-accent" : ""}`}
              >
                <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-soft text-[13px] font-medium text-muted">Auto</div>
                <span className="px-0.5 text-[12.5px] font-medium">Dzine chooses</span>
              </button>
              {styles?.ratio === ratio
                ? styles.list.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={value?.id === s.id}
                      title={s.use}
                      onClick={() => pick(s)}
                      className={`flex flex-col gap-2 rounded-xl p-1.5 text-left transition hover:bg-soft ${value?.id === s.id ? "ring-2 ring-accent" : ""}`}
                    >
                      <div className="pointer-events-none aspect-[4/5] overflow-hidden rounded-lg bg-stage">
                        <Preview design={s.design} />
                      </div>
                      <span className="px-0.5 text-[12.5px] font-medium">{s.name}</span>
                    </button>
                  ))
                : Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-soft" />)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
