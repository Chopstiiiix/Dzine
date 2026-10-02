import { TREATMENTS, scaleTreatment } from "@/lib/agent/type-treatments";
import { findFont, lookupFont } from "@/lib/fonts";
import type { Ratio } from "@/lib/ratios";

// Template mode: the designer chooses a treatment and supplies words, colours and a position;
// this file computes every box. Built for models that write poor coordinates (local Gemma):
// the result always looks like the playbook gallery, never overlaps, never drops a detail.

type Slot =
  | "headline" | "accent" | "kicker" | "subhead" | "details" | "details2" | "line1" | "line2" | "line3"
  | "date" | "host" | "price" | "items" | "itemNames" | "itemPrices" | "teamA" | "teamB" | "ghost";
/** glow / glowText: neon tubes keep a white-hot core and take the colour in their glow. */
type Role = "headline" | "accent" | "text" | "glow" | "glowText";
/** needs: a decorative layer that only makes sense when that slot has text (the sale burst's star). */
/** stack: facts on separate lines instead of one "a · b" line. */
type Map = Record<string, { slot?: Slot; role?: Role; needs?: Slot; stack?: boolean }>;

/** Layouts that use the whole page (photo top, banner, corner blocks): position does not move them. */
const FULL_PAGE = new Set(["party-photo", "minister", "corporate", "offer-wave", "fitness", "grand-opening", "giant", "vertical"]);

/** Which text each treatment layer carries and which palette colour it takes. */
const SLOTS: Record<string, Map> = {
  chrome: { kicker: { slot: "kicker", role: "text" }, title: { slot: "headline" }, rule: { role: "accent" }, details: { slot: "details", role: "text" } },
  neon: { title: { slot: "headline", role: "glow" }, sub: { slot: "details", role: "glowText" } },
  echo: {
    echo1: { slot: "headline", role: "headline" }, echo2: { slot: "headline", role: "headline" }, title: { slot: "headline", role: "headline" },
    echo3: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" },
  },
  giant: { giant: { slot: "headline", role: "headline" }, issue: { slot: "kicker", role: "text" }, caption: { slot: "details", role: "text" } },
  "script-over-caps": { caps: { slot: "headline", role: "headline" }, script: { slot: "accent", role: "accent" }, pill: { slot: "details" } },
  "retro-extrude": { title: { slot: "headline", role: "headline" }, sub: { slot: "details", role: "text" } },
  luxury: {
    kicker: { slot: "kicker", role: "text" }, names: { slot: "headline", role: "headline" }, rule1: { role: "accent" },
    date: { slot: "details", role: "text" }, venue: { slot: "details2", role: "accent" },
  },
  tape: { band: { role: "accent" }, bandtext: { slot: "headline" }, band2: { role: "headline" }, band2text: { slot: "kicker" } },
  swiss: {
    num: { slot: "accent", role: "accent" }, title: { slot: "headline", role: "headline" }, rule1: { role: "text" },
    row1: { slot: "details", role: "text" }, row2: { slot: "details2", role: "text" },
  },
  badge: { ring: {}, core: { slot: "headline", role: "headline" } },
  stagger: {
    w1: { slot: "line1", role: "headline" }, w2: { slot: "line2", role: "headline" }, w3: { slot: "line3", role: "accent" },
    details: { slot: "details", role: "text" },
  },
  grunge: { stamp: { slot: "headline", role: "headline" }, box: { role: "text" }, sub: { slot: "details", role: "text" } },
  gospel: { glow: {}, accent: { slot: "accent", role: "accent" }, title: { slot: "headline", role: "headline" }, theme: { slot: "details", role: "accent" } },
  kids: { l1: { slot: "line1" }, l2: { slot: "line2" }, age: { slot: "accent" } },
  "brush-hero": { swoosh: {}, title: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" } },
  masthead: {
    masthead: { slot: "headline", role: "headline" }, rule: { role: "text" }, kicker: { slot: "kicker", role: "text" },
    coverline: { slot: "accent", role: "accent" }, details: { slot: "details", role: "text" },
  },
  "label-stack": { line1: { slot: "line1" }, line2: { slot: "line2" }, line3: { slot: "line3" }, details: { slot: "details", role: "text" } },
  vertical: { title: { slot: "headline", role: "headline" }, kicker: { slot: "kicker", role: "text" }, rule: { role: "text" }, details: { slot: "details", role: "text" } },
  y2k: { blob: {}, kicker: { slot: "kicker", role: "text" }, title: { slot: "headline" }, details: { slot: "details", role: "text" } },
  arcade: { frame: {}, kicker: { slot: "kicker", role: "accent" }, title: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" } },
  western: {
    kicker: { slot: "kicker", role: "text" }, rule1: { role: "text" }, title: { slot: "headline", role: "headline" },
    rule2: { role: "text" }, details: { slot: "details", role: "text" },
  },
  graffiti: { title: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" } },
  minimal: { kicker: { slot: "kicker", role: "text" }, title: { slot: "headline", role: "headline" }, dot: { role: "accent" }, details: { slot: "details", role: "text" } },
  "party-photo": {
    ghost1: { slot: "ghost" }, ghost2: { slot: "ghost" }, datebox: { needs: "date", role: "accent" }, date: { slot: "date" },
    badge: { needs: "price" }, price: { slot: "price" }, kicker: { slot: "kicker", role: "accent" }, title: { slot: "headline" },
    strip: { needs: "details" }, details: { slot: "details", role: "text" },
  },
  minister: {
    kicker: { slot: "kicker", role: "accent" }, dateCircle: { needs: "date", role: "accent" }, date: { slot: "date" },
    accent: { slot: "accent", role: "accent" }, title: { slot: "headline", role: "headline" }, plate: { needs: "host" },
    host: { slot: "host" }, details: { slot: "details", role: "text" },
  },
  "menu-list": {
    accent: { slot: "accent", role: "accent" }, title: { slot: "headline", role: "headline" }, panel: { needs: "itemNames" },
    names: { slot: "itemNames", role: "text" }, prices: { slot: "itemPrices", role: "accent" }, details: { slot: "details", role: "text" },
  },
  "food-promo": {
    badge: { needs: "price" }, price: { slot: "price" }, accent: { slot: "accent", role: "accent" }, title: { slot: "headline", role: "headline" },
    tagStroke: { needs: "kicker" }, tag: { slot: "kicker" }, button: { role: "accent" }, cta: {}, details: { slot: "details", role: "text" },
  },
  corporate: {
    blockA: { role: "headline" }, blockB: { role: "accent" }, kicker: { slot: "kicker", role: "accent" }, title: { slot: "headline" },
    items: { slot: "items" }, bar: { role: "headline" }, details: { slot: "details", stack: true },
  },
  admission: {
    kicker: { slot: "kicker" }, title: { slot: "headline", role: "headline" }, number: { slot: "accent", role: "accent" },
    items: { slot: "items", role: "text" }, details: { slot: "details" },
  },
  matchday: {
    kicker: { slot: "kicker", role: "accent" }, title: { slot: "headline", role: "headline" }, teamA: { slot: "teamA" },
    vs: { needs: "teamA", role: "accent" }, teamB: { slot: "teamB" }, strip: { needs: "details", role: "accent" }, details: { slot: "details" },
  },
  "offer-wave": {
    wave: {}, badge: { needs: "price", role: "accent" }, price: { slot: "price" }, kicker: { slot: "kicker" },
    title: { slot: "headline", role: "headline" }, items: { slot: "items", role: "text" }, details: { slot: "details", role: "accent", stack: true },
  },
  fitness: {
    stripe1: { role: "accent" }, stripe2: { role: "accent" }, badge: { needs: "price", role: "accent" }, price: { slot: "price" },
    kicker: { slot: "kicker", role: "accent" }, line1: { slot: "line1" }, line2: { slot: "line2", role: "accent" },
    items: { slot: "items", role: "text" }, details: { slot: "details", role: "accent" },
  },
  "grand-opening": {
    confetti: {}, kicker: { slot: "kicker", role: "accent" }, ribbon: {}, title: { slot: "headline" }, date: { slot: "date", role: "text" },
    items: { slot: "items", role: "text" }, details: { slot: "details", role: "accent" },
  },
  "sale-burst": { burst: { needs: "accent" }, accent: { slot: "accent" }, title: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" } },
  horror: { kicker: { slot: "kicker", role: "text" }, title: { slot: "headline", role: "headline" }, details: { slot: "details", role: "text" } },
  lineup: {
    kicker: { slot: "kicker", role: "text" }, title: { slot: "headline", role: "headline" }, subhead: { slot: "subhead", role: "text" },
    details: { slot: "details", role: "text" },
  },
};

export const TREATMENT_IDS = TREATMENTS.map((t) => t.id);

export type ComposeInput = {
  treatment: string;
  position?: "top" | "middle" | "bottom";
  headline: string;
  accent?: string;
  kicker?: string;
  subhead?: string;
  details?: string[];
  details2?: string;
  /** Date for a date block or badge, e.g. "SAT 14 NOV". */
  date?: string;
  /** Minister, speaker or host name for a name plate. */
  host?: string;
  /** Price or offer for a badge, e.g. "₦5,000", "30% OFF", "$20 ENTRY". */
  price?: string;
  /** Menu dishes, services, courses or offers, one per entry. Menu prices after " — ". */
  items?: string[];
  colors?: Partial<Record<"headline" | "accent" | "text", string>>;
  headline_font?: string;
  background_asset_id?: string;
  subject_asset_id?: string;
  logo_asset_id?: string;
  title?: string;
};

/** Rough lightness (0-1) of the first hex colour in a CSS colour or gradient. */
function luminance(css: string): number {
  const hex = css.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[1];
  if (!hex) return 0;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Splits words into n lines of similar length. */
export function splitLines(text: string, n: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length <= 1) return [words.join(" ")];
  n = Math.min(n, words.length);
  const target = words.join(" ").length / n;
  const lines: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const left = words.length - i - 1;
    const linesLeft = n - lines.length - 1;
    if ((cur.join(" ").length >= target && linesLeft > 0) || left === linesLeft) {
      if (linesLeft > 0) {
        lines.push(cur.join(" "));
        cur = [];
      }
    }
  }
  if (cur.length) lines.push(cur.join(" "));
  return lines;
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

function repeatTo(s: string, min: number, sep: string) {
  let out = s;
  while (out.length < min) out += sep + s;
  return out;
}

/** The raw design (render_design shape) for a template-mode request. */
export function composeDesign(input: ComposeInput, ratio: Ratio): { design: Record<string, unknown>; notes: string[] } {
  const notes: string[] = [];
  const t = TREATMENTS.find((x) => x.id === input.treatment) ?? TREATMENTS.find((x) => x.id === "script-over-caps")!;
  if (t.id !== input.treatment) notes.push(`Unknown treatment "${input.treatment}", used ${t.id}.`);
  const map = SLOTS[t.id] ?? {};
  const W = ratio.w;
  const H = ratio.h;

  let headline = (input.headline ?? "").trim() || "Untitled";
  let accent = input.accent?.trim();
  // Two-part lockups take their accent from the headline when none is given: "Midnight" over "LAGOS".
  if (!accent && t.id === "script-over-caps") {
    const parts = headline.split(/\s+/);
    if (parts.length > 1) {
      accent = parts.slice(0, -1).join(" ");
      headline = parts[parts.length - 1];
    }
  }
  // "Eagles vs Lions" fills the two sides of a fixture layout.
  const teams = Object.values(map).some((m) => m.slot === "teamA") ? input.subhead?.split(/\s+(?:vs\.?|v\.?|versus)\s+/i) : undefined;
  const hasTeams = teams?.length === 2;
  const hasSubhead = hasTeams || Object.values(map).some((m) => m.slot === "subhead");
  const details = [hasSubhead ? undefined : input.subhead, ...(input.details ?? [])].map((s) => s?.trim()).filter(Boolean) as string[];
  const lineSlots = Object.values(map).filter((m) => m.slot?.startsWith("line")).length;
  const lines = lineSlots ? splitLines(headline, lineSlots) : [];

  const text: Partial<Record<Slot, string | undefined>> = {
    headline,
    accent,
    kicker: input.kicker?.trim(),
    subhead: hasSubhead ? input.subhead?.trim() : undefined,
    details: details.length ? details.join("  ·  ") : undefined,
    details2: input.details2?.trim(),
    line1: lines[0],
    line2: lines[1],
    line3: lines[2],
    date: input.date?.trim(),
    host: input.host?.trim(),
    price: input.price?.trim(),
    teamA: hasTeams ? teams![0].trim() : undefined,
    teamB: hasTeams ? teams![1].trim() : undefined,
    ghost: `${headline} ${headline}`.toUpperCase(),
  };
  // Lists: plain lines, or dish / price pairs split on a dash or the last price-looking token.
  const items = (input.items ?? []).map((i) => i.trim()).filter(Boolean);
  const pairs = items.map((i) => {
    const m = i.match(/^(.*?)\s*(?:[—–-]|:|\.{2,})\s*([^\s]*\d[^\s]*(?:\s?\w+)?)$/) ?? i.match(/^(.*\S)\s+([$₦£€]\s?[\d.,]+k?)$/i);
    return m ? { name: m[1].trim(), price: m[2].trim() } : { name: i, price: "" };
  });
  if (items.length) {
    text.items = items.join("\n");
    text.itemNames = pairs.map((p) => p.name).join("\n");
    text.itemPrices = pairs.map((p) => p.price).join("\n");
  }
  // Three-line slots with a two-word headline: the last word goes to the last slot.
  if (lineSlots === 3 && lines.length === 2) {
    text.line3 = lines[1];
    text.line2 = undefined;
  }

  const used = new Set<Slot>();
  /** Facts a pill-style layer could not hold; they go on the info line. */
  const leftover: string[] = [];
  /** Empty vertical bands [from, to] left by dropped or shrunk blocks; closed after layout. */
  const gaps: [number, number][] = [];
  let listSize: number | undefined;
  /** The layer carrying the details slot, whatever the treatment calls it. */
  let detailsLayer: Record<string, unknown> | undefined;
  const layers: Record<string, unknown>[] = [];
  for (const l of scaleTreatment(t, ratio)) {
    const m = map[String(l.id)] ?? {};
    if (m.needs && !text[m.needs]) {
      gaps.push([Number(l.y), Number(l.y) + Number(l.h)]);
      continue;
    }
    const out: Record<string, unknown> = { ...l };
    if (m.slot) {
      let v = text[m.slot];
      if (!v) {
        // Nothing to say here: drop the layer rather than leave sample text, and close its gap.
        gaps.push([Number(l.y), Number(l.y) + Number(l.h)]);
        continue;
      }
      if (m.slot === "headline" && String(l.text).includes("\n")) v = splitLines(v, 2).join("\n");
      // Date and price blocks stack like their sample ("SAT\n14\nNOV").
      if ((m.slot === "date" || m.slot === "price") && String(l.text).includes("\n")) {
        v = splitLines(v, String(l.text).split("\n").length).join("\n");
      }
      // Lists keep the sample's bullet, and every line gets the same fixed size so names and prices line up.
      if (m.slot === "items" || m.slot === "itemNames" || m.slot === "itemPrices") {
        const bullet = m.slot === "items" ? (String(l.text).match(/^([^\p{L}\p{N}\s]+\s+)/u)?.[1] ?? "") : "";
        const rows = v.split("\n");
        v = rows.map((r) => bullet + r).join("\n");
        const lh = Number(out.lineHeight ?? 1.4);
        const longest = Math.max(...(m.slot === "itemPrices" ? pairs.map((p) => p.name) : rows).map((r) => r.length + bullet.length), 4);
        listSize ??= Math.floor(Math.min(Number(out.size ?? 36), Number(out.h) / (rows.length * lh), Number(out.w) / (longest * 0.56)));
        out.size = listSize;
        out.sizing = "fixed";
        out.wrap = false;
        const fitted = Math.ceil(rows.length * listSize * lh + listSize * 0.4);
        const spare = Number(out.h) - fitted;
        if (spare > 0) {
          out.h = fitted;
          if (m.slot !== "itemPrices") {
            gaps.push([Number(out.y) + fitted, Number(out.y) + fitted + spare]);
            // A panel drawn around the list shrinks with it.
            for (const p of layers) {
              const inside = Number(p.y) <= Number(out.y) && Number(p.y) + Number(p.h) >= Number(out.y) + fitted + spare;
              if (p.type === "shape" && inside) p.h = Number(p.h) - spare;
            }
          }
        }
      }
      // Giant type: one word can bleed off the edges, several words stack so each stays readable.
      if (t.id === "giant" && m.slot === "headline" && v.includes(" ")) {
        v = splitLines(v, 2).join("\n");
        out.x = Math.round(-W * 0.04);
        out.w = Math.round(W * 1.08);
        out.h = Math.round(Number(out.h) * 1.25);
      }
      if (m.slot === "details" && m.stack) v = details.join("\n");
      // A pill holds one short fact; the rest go on the info line below.
      if (m.slot === "details" && out.bg && details.length > 1) {
        v = details[0];
        leftover.push(...details.slice(1));
      }
      if (m.slot === "kicker" && t.id === "tape") v = repeatTo(v.toUpperCase(), 48, "  ✦  ");
      if (m.slot === "headline" && input.headline_font) {
        const f = lookupFont(input.headline_font);
        if (f) out.font = f.family;
        else notes.push(`Font "${input.headline_font}" is not in the library, kept ${String(l.font)}.`);
      }
      if (findFont(String(out.font)).category === "script" && v === v.toUpperCase()) v = titleCase(v);
      out.text = v;
      used.add(m.slot);
      if (m.slot === "details") detailsLayer = out;
      // Fact lines are broken deliberately: shrink a long line to fit rather than wrap and leave an orphan.
      if (m.slot === "details" || m.slot === "details2" || m.slot === "subhead") {
        out.wrap = false;
        out.sizing = "fit";
      }
      // A one-line "fill" title is limited by its width, so a box sized for two lines leaves a gap below.
      // Estimate the cap height from the width (about half an em per character) and close the gap.
      if (out.sizing === "fill" && out.wrap === false && !v.includes("\n") && !out.rotate) {
        const est = Number(out.w) / (v.length * 0.5);
        const h = Math.round(Math.min(Number(out.h), est * 1.2));
        const gap = Number(out.h) - h;
        if (gap > 0) {
          out.h = h;
          gaps.push([Number(out.y) + h, Number(out.y) + h + gap]);
        }
      }
      // A subhead joins the details: give that block room for a second line.
      if (m.slot === "details" && !m.stack && !out.bg && !hasSubhead && input.subhead && details.length > 1) {
        out.text = [details[0], details.slice(1).join("  ·  ")].join("\n");
        // Anchored layouts keep the box and let the type shrink; elsewhere the block grows.
        if (!FULL_PAGE.has(t.id)) out.h = Math.round(Number(out.h) * 2.2);
      }
    }
    const glow = m.role === "glow" ? input.colors?.headline : m.role === "glowText" ? input.colors?.text ?? input.colors?.accent : undefined;
    if (glow && typeof out.shadow === "string") {
      out.shadow = `0 0 6px #ffffff, 0 0 18px ${glow}, 0 0 42px ${glow}, 0 0 90px ${glow}`;
    }
    const colour = m.role && m.role !== "glow" && m.role !== "glowText" ? input.colors?.[m.role] : undefined;
    if (colour) {
      if (out.type === "shape") out.fill = colour;
      else if (out.color === "transparent" && out.stroke) out.stroke = { ...(out.stroke as object), color: colour };
      else if (!out.gradient) out.color = colour;
    }
    if (t.id === "badge" && out.type === "svg" && input.kicker) {
      used.add("kicker"); // the ring carries it
      out.svg = String(out.svg).replace(/<textPath href='#c'>[^<]*<\/textPath>/, `<textPath href='#c'>${repeatTo(input.kicker.toUpperCase().replace(/[<>&'"]/g, ""), 46, " · ")} ·</textPath>`);
    }
    layers.push(out);
  }

  // Close gaps left by empty slots, except in full-page layouts whose blocks are anchored to the edges.
  if (!FULL_PAGE.has(t.id)) {
    // Overlapping bands (a VS between two dropped team names) count once.
    const merged: [number, number][] = [];
    for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) {
      const last = merged[merged.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else merged.push([a, b]);
    }
    for (const l of layers) {
      const y = Number(l.y);
      const shift = merged.reduce((sum, [a, b]) => sum + (a < y ? Math.min(b, y) - a : 0), 0);
      l.y = y - shift;
    }
  }

  // Every fact the user gave must appear. Whatever the treatment has no place for goes on an info line.
  const margin = Math.round(Math.min(W, H) * 0.06);
  const infoColour = (light: boolean) => input.colors?.text ?? (light ? "#1b1a17" : "#ffffff");
  const lightPreview = luminance(t.preview) > 0.6 && !input.background_asset_id;
  if (!used.has("kicker") && text.kicker) {
    const size = Math.round(H * 0.024);
    const topNow = Math.min(...layers.map((l) => Number(l.y)));
    layers.unshift({
      id: "kicker", type: "text", text: text.kicker, font: "Space Grotesk", weight: 600, size, tracking: 0.3, case: "upper",
      align: "center", color: infoColour(lightPreview), x: margin, y: topNow - Math.round(size * 2.4), w: W - 2 * margin, h: Math.round(size * 1.5),
    });
  }
  const missing = [
    ...(!used.has("details") && details.length ? details : leftover),
    ...(!used.has("details2") && text.details2 ? [text.details2] : []),
    ...(["date", "host", "price"] as const).filter((k) => text[k] && !used.has(k)).map((k) => text[k]!),
    ...(items.length && !used.has("items") && !used.has("itemNames") ? items : []),
  ];
  if (missing.length) {
    const bottomNow = Math.max(...layers.map((l) => Number(l.y) + Number(l.h)));
    const size = Math.round(H * 0.026);
    const h = Math.round(size * 1.35 * Math.min(3, Math.ceil(missing.join("  ·  ").length / 40)) + size * 0.5);
    // Match the treatment's own details block, so a flush-left layout keeps its axis.
    const like = detailsLayer;
    if (like && FULL_PAGE.has(t.id)) {
      // Anchored layouts have no free space below: the facts join the details block as one more line.
      // Same box, one more line: "fit" shrinks the type so nothing collides.
      like.text = `${like.text}\n${missing.join("  ·  ")}`;
      like.wrap = false;
      like.sizing = "fit";
    } else layers.push({
      id: "info", type: "text", text: missing.join("  ·  "), font: like?.font ?? "Space Grotesk", weight: 600, size, tracking: 0.1, case: "upper",
      lineHeight: 1.35, align: like?.align ?? "center", color: like && !like.bg ? like.color : infoColour(lightPreview),
      x: like ? like.x : margin, y: Math.min(H - margin - h, bottomNow + Math.round(size * 1.2)), w: like ? like.w : W - 2 * margin, h,
      ...(like?.rotate ? { rotate: like.rotate } : {}),
    });
  }

  // Place the type group in the requested zone, keeping a safe margin.
  const top = Math.min(...layers.map((l) => Number(l.y)));
  const bottom = Math.max(...layers.map((l) => Number(l.y) + Number(l.h)));
  const groupH = bottom - top;
  const zone = input.position ?? "middle";
  // Full-canvas compositions (corner kicker, corner caption) already use the whole page: leave them be.
  if (groupH <= H - 2 * margin && !FULL_PAGE.has(t.id)) {
    const y0 = zone === "top" ? margin : zone === "bottom" ? H - margin - groupH : Math.round((H - groupH) / 2);
    for (const l of layers) l.y = Math.round(Number(l.y) + y0 - top);
  }
  // A block that grew for a second line can reach past the edge: pull it back inside the margin.
  for (const l of layers) {
    if (l.type === "text" && Number(l.w) <= W) l.y = Math.max(0, Math.min(Number(l.y), H - margin - Number(l.h)));
  }

  const under: Record<string, unknown>[] = [];
  if (input.background_asset_id) {
    under.push({ id: "background", type: "image", asset: input.background_asset_id, x: 0, y: 0, w: W, h: H, fit: "cover" });
    // A scrim on the text side keeps type readable over any photo.
    const dir = zone === "top" ? "to bottom" : "to top";
    if (zone === "middle") {
      under.push({ id: "scrim", type: "shape", shape: "rect", x: 0, y: 0, w: W, h: H, fill: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)" });
    } else {
      const sh = Math.round(Math.min(H, groupH + margin * 4));
      under.push({ id: "scrim", type: "shape", shape: "rect", x: 0, y: zone === "top" ? 0 : H - sh, w: W, h: sh, fill: `linear-gradient(${dir}, rgba(0,0,0,0.7), rgba(0,0,0,0))` });
    }
  }
  if (input.subject_asset_id) {
    const subject = { id: "subject", type: "image", asset: input.subject_asset_id, x: Math.round(W * 0.1), y: Math.round(H * 0.3), w: Math.round(W * 0.8), h: Math.round(H * 0.7), fit: "contain", focus: "50% 100%" };
    // Giant type sits behind the subject; every other treatment reads on top of it.
    if (t.id === "giant") layers.splice(1, 0, subject);
    else under.push(subject);
  }
  const over: Record<string, unknown>[] = [];
  if (input.logo_asset_id) {
    const s = Math.round(Math.min(W, H) * 0.14);
    over.push({ id: "logo", type: "image", asset: input.logo_asset_id, fit: "contain", w: s, h: s, x: W - margin - s, y: zone === "top" ? H - margin - s : margin });
  }

  return {
    design: { title: input.title, background: t.preview, layers: [...under, ...layers, ...over] },
    notes,
  };
}
