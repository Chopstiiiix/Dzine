"use client";

import { useEffect, useState } from "react";
import type { Design, TextLayer } from "@/lib/design/types";

// Google Fonts are fetched as CSS text and injected inline. That keeps the @font-face
// rules readable by our exporter, which a cross-origin <link> would not allow.

const cssByFamily = new Map<string, Promise<string>>();

export function ensureFont(family: string): Promise<string> {
  let p = cssByFamily.get(family);
  if (!p) {
    p = fetch(`/api/fonts/css?family=${encodeURIComponent(family)}`)
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "")
      .then((css) => {
        if (css) {
          const el = document.createElement("style");
          el.dataset.dzFont = family;
          el.textContent = css;
          document.head.appendChild(el);
        }
        return css;
      });
    cssByFamily.set(family, p);
  }
  return p;
}

/** Loads the given families and returns a counter that bumps whenever a font finishes loading. */
export function useFonts(families: string[]): number {
  const [tick, setTick] = useState(0);
  const key = families.join("|");

  useEffect(() => {
    let alive = true;
    Promise.all(key.split("|").filter(Boolean).map(ensureFont)).then(() => alive && setTick((t) => t + 1));
    return () => {
      alive = false;
    };
  }, [key]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    document.fonts.addEventListener("loadingdone", bump);
    return () => document.fonts.removeEventListener("loadingdone", bump);
  }, []);

  return tick;
}

// ------------------------------------------------------------------ export embedding

type Usage = { chars: Set<number>; weights: Set<number>; italic: boolean; normal: boolean };

function usage(design: Design): Map<string, Usage> {
  const map = new Map<string, Usage>();
  for (const l of design.layers) {
    if (l.type !== "text") continue;
    const t = l as TextLayer;
    const u = map.get(t.font) ?? { chars: new Set<number>(), weights: new Set<number>(), italic: false, normal: false };
    const text = t.case === "upper" ? t.text.toUpperCase() : t.case === "lower" ? t.text.toLowerCase() : t.text;
    for (const ch of text) u.chars.add(ch.codePointAt(0)!);
    u.weights.add(t.weight ?? 400);
    if (t.italic) u.italic = true;
    else u.normal = true;
    map.set(t.font, u);
  }
  return map;
}

function inRange(range: string, chars: Set<number>): boolean {
  for (const part of range.split(",")) {
    const m = part.trim().match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i);
    if (!m) continue;
    const lo = parseInt(m[1].replace(/\?/g, "0"), 16);
    const hi = m[2] ? parseInt(m[2], 16) : parseInt(m[1].replace(/\?/g, "F"), 16);
    for (const c of chars) if (c >= lo && c <= hi) return true;
  }
  return false;
}

const dataUrls = new Map<string, Promise<string>>();
function toDataUrl(url: string): Promise<string> {
  let p = dataUrls.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      );
    dataUrls.set(url, p);
  }
  return p;
}

/**
 * @font-face CSS with the font files inlined, limited to the faces and unicode subsets
 * this design actually uses. Handed to the exporter so the PNG has the real fonts.
 */
export async function fontEmbedCss(design: Design): Promise<string> {
  const out: string[] = [];
  for (const [family, u] of usage(design)) {
    const css = await ensureFont(family);
    for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
      const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
      if (range && !inRange(range, u.chars)) continue;
      const style = block.match(/font-style:\s*(\w+)/)?.[1] ?? "normal";
      if (style === "italic" ? !u.italic : !u.normal) continue;
      const w = block.match(/font-weight:\s*(\d+)(?:\s+(\d+))?/);
      if (w) {
        const lo = Number(w[1]);
        const hi = Number(w[2] ?? w[1]);
        if (![...u.weights].some((x) => x >= lo && x <= hi)) continue;
      }
      const url = block.match(/url\((https:[^)]+)\)/)?.[1];
      if (!url) continue;
      try {
        out.push(block.replace(url, await toDataUrl(url)));
      } catch {
        // Skip a face that fails to download: the browser falls back for it.
      }
    }
  }
  return out.join("\n");
}
