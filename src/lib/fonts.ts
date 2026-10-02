import LIBRARY from "./fonts-library.json";

// Fonts the agent may use. A curated go-to list sits in the system prompt; the full library
// (every Google Fonts family plus Fontshare, all free for commercial use, built by
// scripts/import_fonts.py) is reachable through the search_fonts tool. A closed set keeps
// every font loadable and every export reproducible. Server only: the library is ~240 KB.

export type FontCategory = "display" | "serif" | "sans" | "script" | "mono-tech";

export type FontDef = {
  family: string;
  category: FontCategory;
  weights: number[];
  /** Weights that also have a true italic. */
  italics?: number[];
  note?: string;
  /** Where the files come from. Google Fonts unless set. */
  source?: "google" | "fontshare";
  slug?: string;
};

type LibraryEntry = { f: string; s: "g" | "fs"; slug?: string; c: FontCategory; w: number[]; i?: number[]; t: string[]; p: number };


const W39 = [300, 400, 500, 600, 700, 800, 900];
const W38 = [300, 400, 500, 600, 700, 800];
const W37 = [300, 400, 500, 600, 700];
const W49 = [400, 500, 600, 700, 800, 900];
const W47 = [400, 500, 600, 700];

export const FONTS: FontDef[] = [
  // Display: headlines, titles, big type
  { family: "Anton", category: "display", weights: [400], note: "tall condensed impact" },
  { family: "Bebas Neue", category: "display", weights: [400], note: "condensed caps" },
  { family: "Archivo Black", category: "display", weights: [400], note: "heavy grotesque" },
  { family: "Oswald", category: "display", weights: W37, note: "condensed" },
  { family: "League Gothic", category: "display", weights: [400], note: "very condensed" },
  { family: "Barlow Condensed", category: "display", weights: W39, note: "condensed workhorse" },
  { family: "Staatliches", category: "display", weights: [400], note: "geometric caps" },
  { family: "Alfa Slab One", category: "display", weights: [400], note: "fat slab" },
  { family: "Bowlby One", category: "display", weights: [400], note: "chunky" },
  { family: "Titan One", category: "display", weights: [400], note: "rounded, playful" },
  { family: "Rubik Mono One", category: "display", weights: [400], note: "blocky wide" },
  { family: "Dela Gothic One", category: "display", weights: [400], note: "heavy, quirky" },
  { family: "Unbounded", category: "display", weights: W39, note: "wide, modern" },
  { family: "Syne", category: "display", weights: [400, 500, 600, 700, 800], note: "art-school grotesque" },
  { family: "Bricolage Grotesque", category: "display", weights: W38, note: "characterful grotesque" },
  { family: "Monoton", category: "display", weights: [400], note: "neon inline" },
  { family: "Bungee", category: "display", weights: [400], note: "signage" },
  { family: "Righteous", category: "display", weights: [400], note: "retro deco" },
  { family: "Krona One", category: "display", weights: [400], note: "wide" },

  // Serif
  { family: "Playfair Display", category: "serif", weights: W49, italics: [400, 700, 900], note: "high-contrast editorial" },
  { family: "DM Serif Display", category: "serif", weights: [400], italics: [400], note: "elegant display" },
  { family: "Abril Fatface", category: "serif", weights: [400], note: "fat didone" },
  { family: "Cormorant Garamond", category: "serif", weights: W37, italics: [400, 600], note: "refined, luxury" },
  { family: "Bodoni Moda", category: "serif", weights: W49, italics: [400, 700], note: "fashion didone" },
  { family: "Cinzel", category: "serif", weights: W49, note: "roman caps, cinematic" },
  { family: "Fraunces", category: "serif", weights: W39, italics: [400, 700], note: "soft, warm" },
  { family: "Instrument Serif", category: "serif", weights: [400], italics: [400], note: "condensed editorial" },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700], italics: [400], note: "classic book" },
  { family: "Lora", category: "serif", weights: W47, italics: [400, 700], note: "readable body serif" },
  { family: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800], italics: [400, 600], note: "classical" },
  { family: "Italiana", category: "serif", weights: [400], note: "thin, elegant" },
  { family: "Marcellus", category: "serif", weights: [400], note: "inscriptional" },
  { family: "Gloock", category: "serif", weights: [400], note: "bold contemporary" },
  { family: "Yeseva One", category: "serif", weights: [400], note: "decorative" },

  // Sans: supporting text and clean headlines
  { family: "Inter", category: "sans", weights: W39, note: "neutral UI sans" },
  { family: "Montserrat", category: "sans", weights: W39, italics: [400, 700], note: "geometric" },
  { family: "Poppins", category: "sans", weights: W39, italics: [400, 700], note: "geometric, friendly" },
  { family: "Space Grotesk", category: "sans", weights: W37, note: "techy grotesque" },
  { family: "Manrope", category: "sans", weights: W38, note: "modern" },
  { family: "Sora", category: "sans", weights: W38, note: "modern geometric" },
  { family: "Outfit", category: "sans", weights: W39, note: "clean geometric" },
  { family: "Jost", category: "sans", weights: W39, note: "Futura-like" },
  { family: "Urbanist", category: "sans", weights: W39, note: "low-contrast geometric" },
  { family: "Plus Jakarta Sans", category: "sans", weights: W38, note: "contemporary" },
  { family: "DM Sans", category: "sans", weights: W39, note: "compact geometric" },
  { family: "Archivo", category: "sans", weights: W39, note: "grotesque" },
  { family: "Work Sans", category: "sans", weights: W39, note: "grotesque" },
  { family: "Raleway", category: "sans", weights: W39, note: "elegant thin-to-black" },
  { family: "Tenor Sans", category: "sans", weights: [400], note: "humanist, fashion" },
  { family: "Syncopate", category: "sans", weights: [400, 700], note: "wide caps" },

  // Script and handwriting
  { family: "Pacifico", category: "script", weights: [400], note: "brush script" },
  { family: "Great Vibes", category: "script", weights: [400], note: "formal calligraphy" },
  { family: "Sacramento", category: "script", weights: [400], note: "monoline script" },
  { family: "Allura", category: "script", weights: [400], note: "wedding script" },
  { family: "Parisienne", category: "script", weights: [400], note: "casual formal" },
  { family: "Dancing Script", category: "script", weights: W47, note: "lively" },
  { family: "Caveat", category: "script", weights: W47, note: "handwriting" },
  { family: "Permanent Marker", category: "script", weights: [400], note: "marker" },
  { family: "Rock Salt", category: "script", weights: [400], note: "rough hand" },

  // Mono and tech
  { family: "Space Mono", category: "mono-tech", weights: [400, 700], italics: [400], note: "retro mono" },
  { family: "IBM Plex Mono", category: "mono-tech", weights: W37, note: "engineered mono" },
  { family: "JetBrains Mono", category: "mono-tech", weights: W38, note: "code mono" },
  { family: "Orbitron", category: "mono-tech", weights: W49, note: "sci-fi" },
  { family: "Audiowide", category: "mono-tech", weights: [400], note: "futuristic" },
  { family: "Michroma", category: "mono-tech", weights: [400], note: "wide tech" },
  { family: "Russo One", category: "mono-tech", weights: [400], note: "sporty" },
  { family: "Black Ops One", category: "mono-tech", weights: [400], note: "stencil" },
  { family: "Special Elite", category: "mono-tech", weights: [400], note: "typewriter" },
  { family: "Press Start 2P", category: "mono-tech", weights: [400], note: "8-bit" },
];

export const DEFAULT_FONT = "Inter";

const library: (FontDef & { tags: string[]; rank: number })[] = (LIBRARY as LibraryEntry[]).map((e) => ({
  family: e.f,
  category: e.c,
  weights: e.w,
  italics: e.i,
  note: e.t.join(", "),
  source: e.s === "fs" ? "fontshare" : "google",
  slug: e.slug,
  tags: e.t,
  rank: e.p,
}));

const byName = new Map<string, FontDef>([...library, ...FONTS].map((f) => [f.family.toLowerCase(), f]));

/** The font with this exact family name, or null. */
export function lookupFont(name: string | undefined | null): FontDef | null {
  return byName.get(String(name ?? "").trim().toLowerCase()) ?? null;
}

export function findFont(name: string | undefined | null): FontDef {
  return lookupFont(name) ?? byName.get(DEFAULT_FONT.toLowerCase())!;
}

// Designer vocabulary -> the library's style tags (Google's tag set plus Fontshare's use tags).
const SYNONYMS: Record<string, string[]> = {
  graffiti: ["distressed", "rugged", "brush", "wacky", "loud"], street: ["rugged", "distressed", "brush", "loud"],
  grunge: ["distressed", "rugged"], urban: ["rugged", "loud", "stencil"], hiphop: ["loud", "rugged", "stencil", "distressed"],
  retro: ["vintage", "woodtype"], "70s": ["vintage", "blobby", "playful"], "80s": ["futuristic", "techno", "vintage"],
  groovy: ["blobby", "vintage", "playful"], vintage: ["vintage", "woodtype"], western: ["tuscan", "woodtype", "clarendon"],
  luxury: ["sophisticated", "fancy", "didone"], elegant: ["sophisticated", "formal", "fancy"], wedding: ["formal", "fancy", "sophisticated"],
  fashion: ["didone", "sophisticated", "fancy"], editorial: ["editorial", "magazines", "transitional"],
  futuristic: ["futuristic", "techno", "innovative"], tech: ["techno", "futuristic"], gaming: ["pixel", "techno", "futuristic"],
  neon: ["inline", "futuristic", "excited"], club: ["loud", "excited", "futuristic"], party: ["excited", "playful", "happy", "loud"],
  nightlife: ["loud", "excited", "futuristic"], afrobeats: ["loud", "excited", "playful", "active"], concert: ["loud", "excited"],
  sports: ["loud", "active", "stencil"], bold: ["loud"], heavy: ["loud", "fat"], minimal: ["geometric", "calm"], clean: ["geometric", "calm", "competent"],
  corporate: ["business", "competent"], kids: ["childlike", "cute", "happy"], cute: ["cute", "childlike"], fun: ["playful", "happy", "wacky"],
  comic: ["playful", "wacky"], horror: ["distressed", "blackletter", "medieval"], gothic: ["blackletter", "medieval"], metal: ["blackletter", "rugged"],
  handwritten: ["handwritten", "informal", "handwriting"], marker: ["brush", "informal", "handwritten"], calligraphy: ["formal", "script"],
  church: ["sophisticated", "formal", "transitional"], gospel: ["sophisticated", "formal"], christmas: ["formal", "fancy", "happy"],
  stencil: ["stencil"], army: ["stencil"], typewriter: ["monospace"], pixel: ["pixel"], deco: ["inline", "art deco"],
};

/** Families matching a style description, best first. Matches tags, names and category. */
export function searchFonts(query: string, category?: string, limit = 12): FontDef[] {
  const raw = query.toLowerCase().replace(/hip[\s-]?hop/g, "hiphop").match(/[a-z0-9]+/g) ?? [];
  const words = [...new Set(raw.flatMap((w) => [w, ...(SYNONYMS[w] ?? [])]))];
  return library
    .filter((f) => !category || f.category === category)
    .map((f) => {
      const name = f.family.toLowerCase();
      let s = 0;
      for (const w of words) {
        if (f.tags.some((t) => t.includes(w))) s += 3;
        if (name.includes(w)) s += 5;
        if (f.category.includes(w)) s += 1;
      }
      return { f, s: s - Math.log10(f.rank + 10) * 0.6 };
    })
    .filter((x) => x.s > 0 || !words.length)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.f);
}

export function describeFont(f: FontDef): string {
  const weights = f.weights.length === 1 ? String(f.weights[0]) : `${f.weights[0]}-${f.weights[f.weights.length - 1]}`;
  return `${f.family} (${f.category}; ${weights}${f.italics?.length ? ", italic" : ""}; ${f.note ?? ""})`;
}

export function nearestWeight(font: FontDef, weight: number | undefined): number {
  const target = weight ?? 400;
  return font.weights.reduce((best, w) => (Math.abs(w - target) < Math.abs(best - target) ? w : best));
}

/** Stylesheet URL for one family, with every weight in the catalogue. */
export function fontCssUrl(family: string): string {
  const font = findFont(family);
  if (font.source === "fontshare") {
    return `https://api.fontshare.com/v2/css?f[]=${font.slug}@${font.weights.join(",")}&display=swap`;
  }
  const name = font.family.replace(/ /g, "+");
  let spec = "";
  if (font.italics?.length) {
    const tuples = [...font.weights.map((w) => `0,${w}`), ...font.italics.map((w) => `1,${w}`)];
    spec = `:ital,wght@${tuples.join(";")}`;
  } else if (!(font.weights.length === 1 && font.weights[0] === 400)) {
    spec = `:wght@${font.weights.join(";")}`;
  }
  return `https://fonts.googleapis.com/css2?family=${name}${spec}&display=swap`;
}

/** Compact catalogue for the agent's system prompt. */
export function fontCatalogue(): string {
  const groups: Record<FontCategory, string[]> = { display: [], serif: [], sans: [], script: [], "mono-tech": [] };
  for (const f of FONTS) {
    const weights = f.weights.length === 1 ? "400" : `${f.weights[0]}-${f.weights[f.weights.length - 1]}`;
    groups[f.category].push(`${f.family} (${weights}${f.italics ? ", italic" : ""}; ${f.note})`);
  }
  return (Object.keys(groups) as FontCategory[]).map((k) => `${k.toUpperCase()}: ${groups[k].join(" · ")}`).join("\n");
}
