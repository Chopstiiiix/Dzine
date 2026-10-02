"use client";

import { useRef, useSyncExternalStore } from "react";
import { DesignCanvas } from "@/components/DesignCanvas";
import type { Design } from "@/lib/design/types";

type Item = { id: string; name: string; use: string; design: Design };

function Card({ item }: { item: Item }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <figure className="flex flex-col gap-2">
      <div className="h-[450px] rounded-lg bg-stage">
        <DesignCanvas design={item.design} blank={{ w: 1080, h: 1350 }} assets={[]} nodeRef={nodeRef} />
      </div>
      <figcaption className="text-[13px] leading-snug">
        <b>{item.name}</b> <span className="text-muted">({item.id})</span>
        <br />
        <span className="text-muted">{item.use}</span>
      </figcaption>
    </figure>
  );
}

const noop = () => () => {};

export function TreatmentGallery({ items }: { items: Item[] }) {
  // The canvas sanitises SVG layers with DOMPurify in the browser only, so render client-side.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-xl font-semibold">Typography playbook</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {items.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
