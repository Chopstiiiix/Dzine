import type { Ratio } from "@/lib/ratios";

// The typography playbook: professional text treatments written as real Dzine layers on a
// 1080 x 1350 canvas. For each brief the designer is shown the closest few, rescaled, to adapt.
// Weaker models copy a concrete example far more reliably than they follow prose advice.
// Preview them all at /dev/type.

export type Treatment = {
  id: string;
  name: string;
  /** Genres and moods it suits, matched against the brief. */
  moods: string[];
  use: string;
  /** Backdrop for the gallery preview only. */
  preview: string;
  layers: Record<string, unknown>[];
};

const REF_W = 1080;
const REF_H = 1350;

export const TREATMENTS: Treatment[] = [
  {
    id: "chrome",
    name: "Chrome title",
    moods: ["club", "nightlife", "hiphop", "rap", "afrobeats", "amapiano", "rnb", "y2k", "party", "concert", "mixtape", "drill", "trap"],
    use: "Metallic headline for club nights, hip-hop and Y2K. Silver gradient fill, dark outline, hard drop shadow, small tracked kicker above.",
    preview: "linear-gradient(160deg,#1a0b2e,#3b0d4f 55%,#0b0614)",
    layers: [
      { id: "kicker", type: "text", x: 140, y: 380, w: 800, h: 40, text: "FRIDAY NIGHT PRESENTS", font: "Space Grotesk", weight: 500, size: 26, tracking: 0.4, align: "center", color: "#e9e6ff" },
      {
        id: "title", type: "text", x: 70, y: 440, w: 940, h: 360, text: "HEAD\nLINE", font: "Anton", sizing: "fill", wrap: false,
        lineHeight: 0.86, align: "center", case: "upper",
        gradient: "linear-gradient(180deg,#ffffff 0%,#c9ccd6 38%,#5d6170 50%,#e8ebf2 62%,#8b90a0 100%)",
        stroke: { width: 3, color: "#14121c" }, shadow: "0px 14px 0px rgba(10,6,20,0.9)",
      },
      { id: "rule", type: "shape", shape: "rect", x: 390, y: 830, w: 300, h: 4, fill: "#e9e6ff" },
      { id: "details", type: "text", x: 140, y: 860, w: 800, h: 44, text: "SAT 14 NOV  ·  10PM TILL LATE", font: "Space Grotesk", weight: 600, size: 30, tracking: 0.18, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "neon",
    name: "Neon sign",
    moods: ["neon", "club", "nightlife", "bar", "lounge", "synthwave", "retro", "80s", "party", "night", "dj"],
    use: "Glowing tube lettering for nightlife. Thin rounded or inline display face, white-hot core colour, layered coloured glow in the shadow.",
    preview: "#0a0612",
    layers: [
      {
        id: "title", type: "text", x: 90, y: 470, w: 900, h: 300, text: "Headline", font: "Tilt Neon", sizing: "fill", wrap: false,
        align: "center", color: "#fff1fb",
        shadow: "0 0 6px #ffffff, 0 0 18px #ff3bd4, 0 0 42px #ff3bd4, 0 0 90px #b000ff",
      },
      {
        id: "sub", type: "text", x: 190, y: 800, w: 700, h: 70, text: "LIVE  ·  LATE  ·  LOUD", font: "Tilt Neon", sizing: "fill", wrap: false,
        align: "center", color: "#e9fbff", tracking: 0.12, shadow: "0 0 6px #ffffff, 0 0 16px #00e5ff, 0 0 40px #00a2ff",
      },
    ],
  },
  {
    id: "echo",
    name: "Outline echo stack",
    moods: ["concert", "tour", "hiphop", "rap", "festival", "sports", "loud", "bold", "street", "afrobeats", "drill", "energy"],
    use: "The title repeated in a vertical stack: one solid line, the rest hollow outlines fading out. Creates rhythm and energy from type alone.",
    preview: "linear-gradient(180deg,#ff4a1c,#b3170b)",
    layers: [
      { id: "echo1", type: "text", x: 40, y: 250, w: 1000, h: 190, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "transparent", stroke: { width: 3, color: "#ffffff" }, opacity: 0.35 },
      { id: "echo2", type: "text", x: 40, y: 440, w: 1000, h: 190, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "transparent", stroke: { width: 3, color: "#ffffff" }, opacity: 0.65 },
      { id: "title", type: "text", x: 40, y: 630, w: 1000, h: 190, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "echo3", type: "text", x: 40, y: 820, w: 1000, h: 190, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "transparent", stroke: { width: 3, color: "#ffffff" }, opacity: 0.65 },
      { id: "details", type: "text", x: 40, y: 1060, w: 1000, h: 50, text: "WORLD TOUR 2026  ·  LAGOS  ·  ACCRA  ·  LONDON", font: "Barlow Condensed", weight: 600, size: 34, tracking: 0.12, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "giant",
    name: "Giant cropped type",
    moods: ["fashion", "editorial", "album", "cover", "magazine", "minimal", "brand", "launch", "art", "exhibition", "streetwear"],
    use: "One word so large it bleeds off the canvas, set behind the subject (layer it under the cutout) or in overlay blend. The crop is the design; keep everything else small and quiet.",
    preview: "linear-gradient(180deg,#e8e2d6,#cfc6b4)",
    layers: [
      { id: "giant", type: "text", x: -120, y: 300, w: 1320, h: 620, text: "WORD", font: "Archivo Black", sizing: "fill", wrap: false, lineHeight: 0.8, align: "center", color: "#1b1a17", tracking: -0.04 },
      { id: "issue", type: "text", x: 70, y: 70, w: 500, h: 40, text: "ISSUE 07 — AUTUMN", font: "Inter", weight: 600, size: 26, tracking: 0.2, color: "#1b1a17" },
      { id: "caption", type: "text", x: 560, y: 1200, w: 450, h: 80, text: "A small caption sits in a corner,\nanchored to the margin.", font: "Inter", size: 24, lineHeight: 1.3, align: "right", color: "#1b1a17" },
    ],
  },
  {
    id: "script-over-caps",
    name: "Script over caps lockup",
    moods: ["afrobeats", "rnb", "party", "brunch", "summer", "beach", "festival", "birthday", "soul", "carnival", "vibes", "day party"],
    use: "A flowing script word overlapping a heavy condensed caps word, tilted a few degrees. The classic party-flyer lockup: contrast of style, size and colour.",
    preview: "linear-gradient(160deg,#ff8a00,#ff2d55 60%,#7a0a5a)",
    layers: [
      { id: "caps", type: "text", x: 70, y: 520, w: 940, h: 330, text: "VIBES", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#fff3e0", lineHeight: 0.9 },
      { id: "script", type: "text", x: 120, y: 400, w: 840, h: 260, text: "Summer", font: "Pacifico", sizing: "fill", wrap: false, align: "center", color: "#ffd23f", rotate: -7, shadow: "4px 6px 0px rgba(90,0,40,0.75)" },
      { id: "pill", type: "text", x: 340, y: 900, w: 400, h: 70, text: "SAT 14 NOV", font: "Barlow Condensed", weight: 700, size: 36, tracking: 0.12, align: "center", color: "#7a0a5a", bg: { color: "#fff3e0", padX: 28, padY: 10, radius: 999 } },
    ],
  },
  {
    id: "retro-extrude",
    name: "Retro 3D extrude",
    moods: ["retro", "70s", "80s", "groovy", "funk", "disco", "vintage", "skate", "roller", "throwback", "soul", "summer"],
    use: "Chunky rounded display type with a stepped solid shadow that reads as a 3D block, warm retro palette. Disco, funk, throwback and summer events.",
    preview: "#f6e3c3",
    layers: [
      {
        id: "title", type: "text", x: 80, y: 420, w: 920, h: 380, text: "Groovy\nNights", font: "Shrikhand", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#ff6b35",
        stroke: { width: 2, color: "#3d1f0f" },
        shadow: "2px 2px 0 #3d1f0f, 4px 4px 0 #3d1f0f, 6px 6px 0 #3d1f0f, 8px 8px 0 #3d1f0f, 10px 10px 0 #3d1f0f, 12px 12px 0 #f2a541, 14px 14px 0 #3d1f0f",
      },
      { id: "sub", type: "text", x: 190, y: 840, w: 700, h: 50, text: "ROLLER DISCO · ALL NIGHT", font: "Bungee", size: 34, tracking: 0.06, align: "center", color: "#3d1f0f" },
    ],
  },
  {
    id: "luxury",
    name: "Luxury minimal serif",
    moods: ["wedding", "gala", "luxury", "fashion", "elegant", "dinner", "invitation", "perfume", "jewelry", "save the date", "engagement", "anniversary"],
    use: "Quiet and expensive: a fine high-contrast serif with an italic accent word, wide-tracked small caps, hairline rules and lots of empty space.",
    preview: "#f4efe7",
    layers: [
      { id: "kicker", type: "text", x: 240, y: 330, w: 600, h: 34, text: "TOGETHER WITH THEIR FAMILIES", font: "Montserrat", weight: 500, size: 20, tracking: 0.35, align: "center", color: "#7a6a55" },
      { id: "names", type: "text", x: 110, y: 420, w: 860, h: 300, text: "Ada\n& Tunde", font: "Cormorant Garamond", weight: 500, italic: true, sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#2b2620" },
      { id: "rule1", type: "shape", shape: "rect", x: 490, y: 770, w: 100, h: 1.5, fill: "#7a6a55" },
      { id: "date", type: "text", x: 240, y: 800, w: 600, h: 40, text: "THE FOURTEENTH OF NOVEMBER", font: "Montserrat", weight: 500, size: 24, tracking: 0.3, align: "center", color: "#2b2620" },
      { id: "venue", type: "text", x: 240, y: 850, w: 600, h: 40, text: "Lagos, Nigeria", font: "Cormorant Garamond", italic: true, size: 30, align: "center", color: "#7a6a55" },
    ],
  },
  {
    id: "tape",
    name: "Tilted tape banner",
    moods: ["sale", "promo", "sports", "street", "streetwear", "drop", "launch", "announcement", "hiphop", "urban", "market", "pop-up"],
    use: "A bold colour band rotated a few degrees across the composition with heavy caps inside, like warning tape or a sticker. Adds urgency and motion.",
    preview: "linear-gradient(180deg,#1f1f1f,#0d0d0d)",
    layers: [
      { id: "band2", type: "shape", shape: "rect", x: -80, y: 730, w: 1240, h: 100, fill: "#ff3d00", rotate: 6 },
      { id: "band2text", type: "text", x: -60, y: 746, w: 1200, h: 68, text: "NEW DROP ✦ NEW DROP ✦ NEW DROP ✦ NEW DROP ✦ NEW DROP", font: "Archivo Black", sizing: "fill", wrap: false, align: "center", color: "#111111", rotate: 6 },
      { id: "band", type: "shape", shape: "rect", x: -80, y: 520, w: 1240, h: 170, fill: "#d7ff3a", rotate: -5 },
      { id: "bandtext", type: "text", x: -20, y: 540, w: 1120, h: 130, text: "HEADLINE HERE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#111111", rotate: -5 },
    ],
  },
  {
    id: "swiss",
    name: "Swiss grid",
    moods: ["conference", "corporate", "tech", "talk", "workshop", "seminar", "minimal", "architecture", "design", "exhibition", "summit", "business", "startup"],
    use: "Modernist grid: everything flush left on one axis, a huge date or number as the visual, thin rules separating info rows, one accent colour.",
    preview: "#f2f2ee",
    layers: [
      { id: "num", type: "text", x: 70, y: 90, w: 940, h: 560, text: "14.11", font: "Inter Tight", weight: 800, sizing: "fill", wrap: false, lineHeight: 0.85, tracking: -0.05, color: "#ff3d00" },
      { id: "title", type: "text", x: 70, y: 700, w: 940, h: 220, text: "Design\nSystems Summit", font: "Inter Tight", weight: 700, size: 92, lineHeight: 0.95, tracking: -0.03, color: "#111111" },
      { id: "rule1", type: "shape", shape: "rect", x: 70, y: 990, w: 940, h: 3, fill: "#111111" },
      { id: "row1", type: "text", x: 70, y: 1010, w: 460, h: 90, text: "Talks, workshops\nand open studios", font: "Inter", weight: 500, size: 28, lineHeight: 1.25, color: "#111111" },
      { id: "row2", type: "text", x: 560, y: 1010, w: 450, h: 90, text: "Landmark Centre\nLagos, 09:00", font: "Inter", weight: 500, size: 28, lineHeight: 1.25, color: "#111111" },
    ],
  },
  {
    id: "badge",
    name: "Circular text badge",
    moods: ["album", "cover", "brand", "coffee", "launch", "festival", "merch", "limited", "anniversary", "special", "live"],
    use: "Words running around a circle (svg textPath) with a mark or short word in the middle. Use as a stamp in a corner or as the centrepiece of a minimal cover.",
    preview: "#14213d",
    layers: [
      {
        id: "ring", type: "svg", x: 340, y: 475, w: 400, h: 400,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><path id='c' d='M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0'/></defs><circle cx='100' cy='100' r='96' fill='none' stroke='#fca311' stroke-width='2'/><text fill='#fca311' font-family='Space Grotesk' font-size='17' font-weight='700' letter-spacing='4.2'><textPath href='#c'>LIVE · LIMITED EDITION · LIVE · LIMITED EDITION ·</textPath></text></svg>",
      },
      { id: "core", type: "text", x: 420, y: 600, w: 240, h: 150, text: "07", font: "Space Grotesk", weight: 700, sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "stagger",
    name: "Staggered kinetic words",
    moods: ["festival", "concert", "lineup", "music", "art", "youth", "creative", "event", "dance", "afrobeats", "fun"],
    use: "Each word of the title on its own line at a different alignment, size or style (one outlined, one italic, one filled), so the eye zigzags down. Feels dynamic without any imagery.",
    preview: "linear-gradient(160deg,#2b59ff,#0a1a6b)",
    layers: [
      { id: "w1", type: "text", x: 60, y: 300, w: 760, h: 220, text: "MOVE", font: "Bebas Neue", sizing: "fill", wrap: false, color: "#ffffff" },
      { id: "w2", type: "text", x: 260, y: 510, w: 760, h: 220, text: "YOUR", font: "Bebas Neue", sizing: "fill", wrap: false, align: "right", color: "transparent", stroke: { width: 3, color: "#ffffff" } },
      { id: "w3", type: "text", x: 60, y: 720, w: 960, h: 260, text: "body", font: "Playfair Display", italic: true, weight: 800, sizing: "fill", wrap: false, color: "#ffd400" },
      { id: "details", type: "text", x: 60, y: 1040, w: 960, h: 44, text: "OPEN AIR · 12 HOURS · 30 ARTISTS", font: "Space Grotesk", weight: 600, size: 30, tracking: 0.14, color: "#ffffff" },
    ],
  },
  {
    id: "grunge",
    name: "Distressed stamp",
    moods: ["grunge", "punk", "rock", "metal", "street", "drill", "horror", "underground", "rave", "techno", "warehouse", "raw"],
    use: "Rough distressed or stencil type, slightly rotated like a stamp, blended into the image with multiply or overlay. Raw, underground energy.",
    preview: "linear-gradient(180deg,#d9d4c7,#b8b0a0)",
    layers: [
      { id: "stamp", type: "text", x: 80, y: 460, w: 920, h: 330, text: "UNDER\nGROUND", font: "Rubik Distressed", sizing: "fill", wrap: false, lineHeight: 0.9, align: "center", color: "#b3001b", rotate: -4, blend: "multiply" },
      { id: "box", type: "shape", shape: "rect", x: 300, y: 860, w: 480, h: 70, fill: "transparent", border: { width: 4, color: "#1a1a1a" }, rotate: -4 },
      { id: "sub", type: "text", x: 300, y: 868, w: 480, h: 54, text: "WAREHOUSE · 11PM", font: "Black Ops One", sizing: "fill", wrap: false, align: "center", color: "#1a1a1a", rotate: -4 },
    ],
  },
  {
    id: "gospel",
    name: "Glow serif with light rays",
    moods: ["church", "gospel", "worship", "praise", "conference", "revival", "crusade", "christian", "sermon", "easter", "christmas", "faith"],
    use: "A strong classic serif headline with a soft gold glow, a script accent word and a tracked theme line. Reverent, warm, premium church and gospel look.",
    preview: "radial-gradient(circle at 50% 40%,#3a2a6b,#120b24 70%)",
    layers: [
      { id: "glow", type: "shape", shape: "ellipse", x: 190, y: 330, w: 700, h: 500, fill: "radial-gradient(circle,rgba(255,200,90,0.55),rgba(255,200,90,0) 70%)", blur: 30 },
      { id: "accent", type: "text", x: 240, y: 360, w: 600, h: 130, text: "Night of", font: "Great Vibes", sizing: "fill", wrap: false, align: "center", color: "#ffd98a" },
      { id: "title", type: "text", x: 80, y: 480, w: 920, h: 260, text: "WORSHIP", font: "Cinzel", weight: 700, sizing: "fill", wrap: false, align: "center", color: "#fff6e0", tracking: 0.04, shadow: "0 0 30px rgba(255,200,90,0.6)" },
      { id: "theme", type: "text", x: 190, y: 770, w: 700, h: 44, text: "THEME: A NEW SONG", font: "Montserrat", weight: 600, size: 28, tracking: 0.3, align: "center", color: "#ffd98a" },
    ],
  },
  {
    id: "kids",
    name: "Bouncy playful letters",
    moods: ["kids", "birthday", "party", "children", "school", "fun", "cute", "family", "toy", "carnival", "baby shower"],
    use: "Rounded chunky display type, each line a different bright colour with a thick white outline and a soft offset shadow, tilted slightly. Kids and birthdays.",
    preview: "#bde8ff",
    layers: [
      { id: "l1", type: "text", x: 120, y: 380, w: 840, h: 220, text: "Happy", font: "Titan One", sizing: "fill", wrap: false, align: "center", color: "#ff5ca8", stroke: { width: 10, color: "#ffffff" }, shadow: "8px 10px 0 rgba(0,70,140,0.25)", rotate: -4 },
      { id: "l2", type: "text", x: 80, y: 580, w: 920, h: 260, text: "Birthday", font: "Titan One", sizing: "fill", wrap: false, align: "center", color: "#ffb800", stroke: { width: 10, color: "#ffffff" }, shadow: "8px 10px 0 rgba(0,70,140,0.25)", rotate: 3 },
      { id: "age", type: "text", x: 420, y: 860, w: 240, h: 200, text: "5", font: "Titan One", sizing: "fill", wrap: false, align: "center", color: "#2fbf71", stroke: { width: 10, color: "#ffffff" } },
    ],
  },
];

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** The treatments that best match a brief. Falls back to versatile ones when nothing matches. */
export function pickTreatments(brief: string, n = 3): Treatment[] {
  const q = new Set(words(brief.replace(/hip[\s-]?hop/gi, "hiphop")));
  const scored = TREATMENTS.map((t) => ({ t, s: t.moods.filter((m) => words(m).every((w) => q.has(w))).length }));
  const hits = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.t);
  const fallback = ["script-over-caps", "stagger", "swiss"].map((id) => TREATMENTS.find((t) => t.id === id)!);
  return [...new Set([...hits, ...fallback])].slice(0, n);
}

const SCALED = new Set(["x", "w"]);
const SCALED_Y = new Set(["y", "h"]);

/** A treatment's layers moved onto the target canvas: boxes scale per axis, type and strokes by the smaller factor. */
export function scaleTreatment(t: Treatment, ratio: Ratio): Record<string, unknown>[] {
  const sx = ratio.w / REF_W;
  const sy = ratio.h / REF_H;
  const s = Math.min(sx, sy);
  return t.layers.map((l) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(l)) {
      if (typeof v === "number" && SCALED.has(k)) out[k] = Math.round(v * sx);
      else if (typeof v === "number" && SCALED_Y.has(k)) out[k] = Math.round(v * sy);
      else if (typeof v === "number" && k === "size") out[k] = Math.round(v * s);
      else if (k === "stroke" && v && typeof v === "object") out[k] = { ...(v as object), width: Math.max(1, Math.round((v as { width: number }).width * s * 10) / 10) };
      else out[k] = v;
    }
    return out;
  });
}

export function treatmentBlock(brief: string, ratio: Ratio): string {
  const picks = pickTreatments(brief);
  return [
    "<type_treatments>",
    "Typographic treatments that suit this brief, as real layers already scaled to this canvas. Build your typography from one of " +
      "them (or a confident mix): swap in the user's words, keep the craft (the font contrast, outline, gradient, glow, rotation, " +
      "stacking and scale jumps), recolour to your palette and move the blocks to fit the image. Plain centred text in one weight is never acceptable.",
    ...picks.map((t) => `${t.name}: ${t.use}\n${JSON.stringify(scaleTreatment(t, ratio))}`),
    "</type_treatments>",
  ].join("\n\n");
}

/** Template mode: every treatment by id, best matches for the brief first. */
export function treatmentMenu(brief: string): string {
  const best = pickTreatments(brief).map((t) => t.id);
  const order = [...best, ...TREATMENTS.map((t) => t.id).filter((id) => !best.includes(id))];
  return [
    "<type_treatments>",
    `Best matches for this brief: ${best.join(", ")}.`,
    ...order.map((id) => {
      const t = TREATMENTS.find((x) => x.id === id)!;
      return `- ${t.id}: ${t.name}. ${t.use}`;
    }),
    "</type_treatments>",
  ].join("\n");
}
