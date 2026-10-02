"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RATIOS, RATIO_GROUPS, type Ratio } from "@/lib/ratios";

export function RatioShape({ ratio, size = 22 }: { ratio: Ratio; size?: number }) {
  const k = size / Math.max(ratio.w, ratio.h);
  return (
    <span className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="rounded-[2px] border-[1.5px] border-current" style={{ width: Math.max(6, ratio.w * k), height: Math.max(6, ratio.h * k) }} />
    </span>
  );
}

export function RatioPicker({
  value,
  onPick,
  disabled,
  hasDesign,
}: {
  value: Ratio;
  onPick: (ratio: Ratio) => void;
  disabled?: boolean;
  /** When a design exists, switching format re-composes it and costs a credit. */
  hasDesign: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Ratio | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirm(null);
      }
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setConfirm(null));
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const pick = (r: Ratio) => {
    if (r.id === value.id) return setOpen(false);
    if (hasDesign) return setConfirm(r);
    onPick(r);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel pl-2 pr-2.5 text-[13px] font-medium text-ink transition hover:bg-soft disabled:opacity-50"
      >
        <span className="text-muted">
          <RatioShape ratio={value} size={18} />
        </span>
        <span className="max-w-[40vw] truncate">{value.label}</span>
        <span className="hidden text-faint sm:inline">{value.hint.split(" · ")[0]}</span>
        <ChevronDown size={14} className="text-faint" />
      </button>

      {open ? (
        <div className="dz-scroll absolute left-0 top-11 z-30 max-h-[70vh] w-[290px] overflow-y-auto rounded-xl border border-line bg-panel p-1.5 shadow-xl">
          {confirm ? (
            <div className="p-2.5">
              <p className="text-[13px] font-medium text-ink">Re-compose for {confirm.label}?</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                Dzine will rebuild the layout for the new proportions, keeping your content. Uses 1 credit.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="h-8 flex-1 rounded-lg bg-ink text-[13px] font-medium text-bg"
                  onClick={() => {
                    onPick(confirm);
                    setConfirm(null);
                    setOpen(false);
                  }}
                >
                  Re-compose
                </button>
                <button type="button" className="h-8 flex-1 rounded-lg border border-line text-[13px] font-medium" onClick={() => setConfirm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            RATIO_GROUPS.map((group) => (
              <div key={group} role="listbox" aria-label={group}>
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{group}</div>
                {RATIOS.filter((r) => r.group === group).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={r.id === value.id}
                    onClick={() => pick(r)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-soft"
                  >
                    <span className="text-muted">
                      <RatioShape ratio={r} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{r.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{r.hint}</span>
                    </span>
                    {r.id === value.id ? <Check size={15} className="text-accent" /> : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
