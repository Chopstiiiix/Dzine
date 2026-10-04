"use client";

import { Eye, EyeOff, Image as ImageIcon, Shapes, Sparkles, Type, X } from "lucide-react";
import type { Asset, Layer } from "@/lib/design/types";

/** What to call a layer in the list: its name, else the start of its text, else its type. */
export function layerName(l: Layer): string {
  if (l.name) return l.name;
  if (l.type === "text") return l.text.replace(/\s+/g, " ").slice(0, 32);
  return l.type === "svg" ? "Graphic" : l.type === "image" ? "Image" : "Shape";
}

const ICONS = { text: Type, image: ImageIcon, shape: Shapes, svg: Sparkles };

export function LayersPanel({
  layers,
  assets,
  selectedIds,
  onSelect,
  onToggleVisible,
  onClose,
}: {
  layers: Layer[];
  assets: Asset[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onToggleVisible: (l: Layer) => void;
  onClose: () => void;
}) {
  const assetUrl = new Map(assets.map((a) => [a.id, a.url]));
  return (
    <div
      className="absolute bottom-20 right-2 top-2 z-10 flex w-56 flex-col rounded-xl border border-line bg-panel shadow-lg md:right-3"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-line pl-3 pr-1.5">
        <span className="text-[12.5px] font-medium">Layers</span>
        <button type="button" aria-label="Close layers" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-soft hover:text-ink">
          <X size={14} />
        </button>
      </div>
      <ul className="dz-scroll min-h-0 flex-1 overflow-y-auto p-1">
        {/* Top of the stack first, like every design tool. */}
        {[...layers].reverse().map((l) => {
          const Icon = ICONS[l.type];
          const on = selectedIds.includes(l.id);
          const hidden = l.opacity === 0;
          return (
            <li key={l.id}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={(e) => onSelect(e.shiftKey ? (on ? selectedIds.filter((x) => x !== l.id) : [...selectedIds, l.id]) : [l.id])}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect([l.id])}
                className={`group flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-[12.5px] ${on ? "bg-soft text-ink" : "text-muted hover:bg-soft/60 hover:text-ink"}`}
              >
                {l.type === "image" && assetUrl.get(l.asset) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl.get(l.asset)} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />
                ) : (
                  <Icon size={14} className="shrink-0" />
                )}
                <span className={`min-w-0 flex-1 truncate ${hidden ? "opacity-40" : ""}`}>{layerName(l)}</span>
                <button
                  type="button"
                  aria-label={hidden ? "Show layer" : "Hide layer"}
                  title={hidden ? "Show" : "Hide"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisible(l);
                  }}
                  className={`rounded p-1 hover:text-ink ${hidden ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"}`}
                >
                  {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
