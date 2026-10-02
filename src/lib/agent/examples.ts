import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { Design } from "@/lib/design/types";
import type { Ratio } from "@/lib/ratios";
import { createAdminSupabase } from "@/lib/supabase/server";

// The designer's reference library. For every brief the agent is shown the closest
// professional layouts: Crello templates (CDLA-Permissive-2.0) plus designs Dzine users
// downloaded with little revision, which is how the library keeps improving.

type CrelloLayer = {
  t: string; x: number; y: number; w: number; h: number;
  rot?: number; op?: number; color?: string;
  text?: string; font?: string; size?: number; bold?: boolean; align?: string; caps?: boolean; lh?: number; ls?: number;
};
type Crello = {
  id: string; format: string; category: string; title: string; keywords: string[]; industries: string[];
  w: number; h: number; layers: CrelloLayer[];
};
type Learned = { id: string; ratio: string; tags: string[]; revisions: number; design: Design };

const STOP = new Set(
  "the and for with that this from your you are our was will have has but not all can into about make want like design poster flyer please use using some more very just also".split(" "),
);

export function words(s: string): string[] {
  return (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => !STOP.has(w));
}

// ------------------------------------------------------------ crello

let library: { items: Crello[]; tokens: Set<string>[]; vocab: Set<string> } | null = null;

function crello() {
  if (library) return library;
  let items: Crello[] = [];
  try {
    const gz = readFileSync(join(process.cwd(), "src/lib/agent/examples/crello.json.gz"));
    items = JSON.parse(gunzipSync(gz).toString("utf8"));
  } catch (err) {
    console.error("[dzine] layout library unavailable", err);
  }
  const tokens = items.map(
    (t) => new Set([...t.keywords.flatMap(words), ...words(t.title), ...words(t.category), ...t.industries.flatMap(words)]),
  );
  const vocab = new Set(tokens.flatMap((s) => [...s]));
  library = { items, tokens, vocab };
  return library;
}

function aspectPenalty(w: number, h: number, ratio: Ratio) {
  return Math.abs(Math.log(w / h / (ratio.w / ratio.h)));
}

// ponytail: keyword overlap + aspect match, a linear scan over ~20k templates (a few ms).
// Swap in embeddings if retrieval quality becomes the bottleneck.
function topCrello(brief: string, ratio: Ratio, n: number): Crello[] {
  const { items, tokens } = crello();
  const q = new Set(words(brief));
  if (!q.size) return [];
  const scored: { i: number; s: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    let hits = 0;
    for (const w of q) if (tokens[i].has(w)) hits++;
    if (!hits) continue;
    const textLayers = items[i].layers.filter((l) => l.t === "text").length;
    scored.push({ i, s: hits - aspectPenalty(items[i].w, items[i].h, ratio) * 2 + Math.min(textLayers, 5) * 0.05 });
  }
  scored.sort((a, b) => b.s - a.s);
  const out: Crello[] = [];
  const seen = new Set<string>();
  for (const { i } of scored) {
    const t = items[i];
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    out.push(t);
    if (out.length === n) break;
  }
  return out;
}

const px = (n: number) => Math.round(n);

/** A template rescaled to the target canvas, one line per layer. */
function describeCrello(t: Crello, ratio: Ratio): string {
  const sx = ratio.w / t.w;
  const sy = ratio.h / t.h;
  const sf = Math.min(sx, sy);
  const lines = t.layers
    .filter((l) => l.x < t.w && l.y < t.h && l.x + l.w > 0 && l.y + l.h > 0)
    .map((l) => {
      const box = `at ${px(l.x * sx)},${px(l.y * sy)} size ${px(l.w * sx)}x${px(l.h * sy)}`;
      const extra = [l.rot ? `rotate ${px(l.rot)}` : "", l.op != null ? `opacity ${l.op}` : ""].filter(Boolean).join(", ");
      if (l.t === "text") {
        const style = [
          l.font, `${px((l.size ?? 0) * sf)}px`, l.bold && "bold", l.caps && "caps", l.align,
          l.ls && `letter-spacing ${l.ls}`, l.lh && `line-height ${l.lh}`, l.color,
        ].filter(Boolean).join(" ");
        return `  text "${l.text}" | ${style} | ${box}${extra ? ", " + extra : ""}`;
      }
      return `  ${l.t}${l.color ? " " + l.color : ""} | ${box}${extra ? ", " + extra : ""}`;
    });
  return `"${t.title}" (${t.format}, ${t.category})\n${lines.join("\n")}`;
}

// ------------------------------------------------------------ learned

const LOCAL_FILE = join(process.cwd(), ".dzine", "learned.json");

async function loadLearned(ratio: string): Promise<Learned[]> {
  const admin = createAdminSupabase();
  if (admin) {
    const { data, error } = await admin
      .from("dzine_examples")
      .select("id, ratio, tags, revisions, design")
      .eq("ratio", ratio)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) console.error("[dzine] learned examples", error.message);
    return (data as Learned[] | null) ?? [];
  }
  try {
    return (JSON.parse(await readFile(LOCAL_FILE, "utf8")) as Learned[]).filter((e) => e.ratio === ratio);
  } catch {
    return [];
  }
}

/** Keeps the layout and style, drops anything personal: text becomes a same-shape placeholder, images lose their asset. */
function anonymise(design: Design): Design {
  return {
    ...design,
    layers: design.layers.map((l) => {
      if (l.type === "text") return { ...l, text: l.text.replace(/[A-Z]/g, "X").replace(/[a-z]/g, "x").replace(/\d/g, "0") };
      if (l.type === "image") return { ...l, asset: "image" };
      return l;
    }),
  };
}

/**
 * Records a finished design as a future reference. Only designs that needed few revisions are kept,
 * and only words that also appear in the template vocabulary are stored as tags, so names, venues
 * and other personal details never leave the user's project.
 */
export async function learnFromDesign(input: { projectId: string; ratio: string; briefs: string[]; design: Design }) {
  const revisions = Math.max(0, input.briefs.length - 1);
  if (revisions > 2 || input.design.layers.length < 2) return false;
  const { vocab } = crello();
  const tags = [...new Set(input.briefs.flatMap(words).filter((w) => vocab.has(w)))].slice(0, 30);
  const row: Learned = { id: input.projectId, ratio: input.ratio, tags, revisions, design: anonymise(input.design) };

  const admin = createAdminSupabase();
  if (admin) {
    const { error } = await admin.from("dzine_examples").upsert(row);
    if (error) throw new Error(error.message);
    return true;
  }
  const all = await (async () => {
    try {
      return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as Learned[];
    } catch {
      return [];
    }
  })();
  const next = [row, ...all.filter((e) => e.id !== row.id)].slice(0, 2000);
  await mkdir(join(process.cwd(), ".dzine"), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(next));
  return true;
}

function topLearned(all: Learned[], brief: string, n: number): Learned[] {
  const q = new Set(words(brief));
  return all
    .map((e) => ({ e, s: e.tags.filter((t) => q.has(t)).length - e.revisions * 0.5 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.e);
}

// ------------------------------------------------------------ prompt block

export async function referenceBlock(brief: string, ratio: Ratio): Promise<string> {
  const learned = topLearned(await loadLearned(ratio.id), brief, 2);
  const templates = topCrello(brief, ratio, 4 - learned.length);
  if (!learned.length && !templates.length) return "";
  const parts = [
    "<reference_layouts>",
    "Professional layouts close to this brief, already scaled to this canvas. Study them for hierarchy, type scale contrast, " +
      "spacing, alignment, how many type styles they use and how shapes frame the text. Borrow structure, never copy their words. " +
      "Fonts not in your list: pick the closest family from the list.",
    ...learned.map((e, i) => `Dzine design ${i + 1} (kept by a user, text masked):\n${JSON.stringify(e.design.layers)}`),
    ...templates.map((t, i) => `Template ${i + 1}: ${describeCrello(t, ratio)}`),
    "</reference_layouts>",
  ];
  return parts.join("\n\n");
}
