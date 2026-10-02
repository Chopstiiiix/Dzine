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
      { id: "w2", type: "text", x: 260, y: 520, w: 760, h: 200, text: "YOUR", font: "Bebas Neue", sizing: "fill", wrap: false, align: "right", color: "transparent", stroke: { width: 3, color: "#ffffff" } },
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
  {
    id: "brush-hero",
    name: "Brush script hero",
    moods: ["hiphop", "rap", "mixtape", "street", "sports", "skate", "basketball", "youth", "summer", "drill", "trap", "urban"],
    use: "A big hand-painted marker title, tilted, with a painted brush swoosh under it. Raw, energetic, made-by-hand.",
    preview: "linear-gradient(160deg,#141414,#2a2a2a)",
    layers: [
      {
        id: "swoosh", type: "svg", x: 120, y: 740, w: 840, h: 90,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'><path d='M5 28 C 90 8, 250 6, 395 16 L 392 25 C 250 18, 100 22, 8 37 Z' fill='#ff3d00'/></svg>",
      },
      { id: "title", type: "text", x: 60, y: 450, w: 960, h: 300, text: "Headline", font: "Permanent Marker", sizing: "fill", wrap: false, align: "center", color: "#ffffff", rotate: -6, shadow: "6px 6px 0px rgba(0,0,0,0.35)" },
      { id: "details", type: "text", x: 140, y: 870, w: 800, h: 50, text: "SAT 14 NOV  ·  10PM", font: "Barlow Condensed", weight: 600, size: 36, tracking: 0.15, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "masthead",
    name: "Magazine masthead",
    moods: ["fashion", "editorial", "magazine", "album", "cover", "beauty", "lifestyle", "interview", "feature", "model", "luxury"],
    use: "A huge high-contrast serif masthead across the top, an issue line under a rule, and italic cover lines anchored bottom left. Reads as a magazine cover.",
    preview: "#e9e4da",
    layers: [
      { id: "masthead", type: "text", x: 40, y: 40, w: 1000, h: 250, text: "HEADLINE", font: "Playfair Display", weight: 900, sizing: "fill", wrap: false, align: "center", color: "#111111", tracking: -0.03 },
      { id: "rule", type: "shape", shape: "rect", x: 40, y: 300, w: 1000, h: 3, fill: "#111111" },
      { id: "kicker", type: "text", x: 40, y: 316, w: 1000, h: 34, text: "THE NIGHTLIFE ISSUE · NOVEMBER", font: "Inter", weight: 600, size: 22, tracking: 0.25, align: "center", color: "#111111" },
      { id: "coverline", type: "text", x: 40, y: 900, w: 560, h: 160, text: "The new sound\nof the city", font: "Playfair Display", weight: 700, italic: true, size: 56, lineHeight: 1.05, color: "#111111" },
      { id: "details", type: "text", x: 40, y: 1080, w: 640, h: 90, text: "Inside: the DJs, the venues, the night", font: "Inter", weight: 600, size: 26, lineHeight: 1.3, color: "#111111" },
    ],
  },
  {
    id: "label-stack",
    name: "Label stack",
    moods: ["streetwear", "fashion", "drop", "launch", "street", "urban", "brand", "sale", "pop-up", "market", "hiphop", "collection"],
    use: "Each word of the title printed on its own solid label, staggered left and right like stickers or printed tape. Bold, graphic, streetwear.",
    preview: "linear-gradient(180deg,#ffd400,#ffb000)",
    layers: [
      { id: "line1", type: "text", x: 80, y: 420, w: 700, h: 130, text: "WORD", font: "Anton", sizing: "fill", wrap: false, color: "#111111", bg: { color: "#ffffff", padX: 24, padY: 4 } },
      { id: "line2", type: "text", x: 200, y: 560, w: 780, h: 130, text: "WORD", font: "Anton", sizing: "fill", wrap: false, align: "right", color: "#ffffff", bg: { color: "#ff2d55", padX: 24, padY: 4 } },
      { id: "line3", type: "text", x: 80, y: 700, w: 640, h: 130, text: "WORD", font: "Anton", sizing: "fill", wrap: false, color: "#111111", bg: { color: "#ffffff", padX: 24, padY: 4 } },
      { id: "details", type: "text", x: 80, y: 870, w: 900, h: 50, text: "DROP 01  ·  FRIDAY 6PM", font: "Space Grotesk", weight: 700, size: 32, tracking: 0.12, color: "#111111" },
    ],
  },
  {
    id: "vertical",
    name: "Vertical title",
    moods: ["fashion", "album", "minimal", "exhibition", "art", "architecture", "film", "editorial", "gallery", "photography", "portfolio"],
    use: "The title runs up the left edge, rotated 90 degrees and as tall as the page; the information sits in a quiet column on the right. Architectural and confident.",
    preview: "#ece8df",
    layers: [
      { id: "title", type: "text", x: -440, y: 545, w: 1220, h: 260, text: "HEADLINE", font: "Bebas Neue", sizing: "fill", wrap: false, align: "center", color: "#111111", rotate: -90 },
      { id: "kicker", type: "text", x: 360, y: 80, w: 650, h: 36, text: "AN EXHIBITION", font: "Inter", weight: 600, size: 24, tracking: 0.3, color: "#111111" },
      { id: "rule", type: "shape", shape: "rect", x: 360, y: 1110, w: 650, h: 3, fill: "#111111" },
      { id: "details", type: "text", x: 360, y: 1130, w: 650, h: 120, text: "14 Nov — 20 Dec\nThe Gallery, Lagos", font: "Inter", weight: 500, size: 30, lineHeight: 1.3, color: "#111111" },
    ],
  },
  {
    id: "y2k",
    name: "Y2K gradient glow",
    moods: ["y2k", "tech", "launch", "party", "futuristic", "pop", "rnb", "2000s", "digital", "app", "rave", "electronic"],
    use: "A wide heavy display title filled with an iridescent cyan-violet-pink gradient, floating over a blurred colour blob. Glossy, digital, Y2K.",
    preview: "#0b0820",
    layers: [
      { id: "blob", type: "shape", shape: "ellipse", x: 140, y: 380, w: 800, h: 560, fill: "radial-gradient(circle,rgba(255,79,216,0.55),rgba(123,92,255,0.25) 45%,rgba(0,0,0,0) 70%)", blur: 40 },
      { id: "kicker", type: "text", x: 140, y: 470, w: 800, h: 36, text: "LIVE IN CONCERT", font: "Unbounded", weight: 400, size: 24, tracking: 0.3, align: "center", color: "#e8e6ff" },
      { id: "title", type: "text", x: 60, y: 520, w: 960, h: 260, text: "HEADLINE", font: "Unbounded", weight: 900, sizing: "fill", wrap: false, align: "center", gradient: "linear-gradient(90deg,#00f0ff,#7b5cff 45%,#ff4fd8)", shadow: "0 10px 30px rgba(123,92,255,0.6)" },
      { id: "details", type: "text", x: 140, y: 820, w: 800, h: 50, text: "SAT 14 NOV  ·  10PM", font: "Space Grotesk", weight: 600, size: 30, tracking: 0.12, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "arcade",
    name: "Arcade pixel",
    moods: ["gaming", "esports", "tournament", "retro", "8bit", "pixel", "game", "arcade", "tech", "hackathon", "lan"],
    use: "Pixel-font title in electric yellow with a hard magenta offset shadow, inside a neon frame, 'PLAYER 1' style kicker. Gaming and retro tech.",
    preview: "#120a2a",
    layers: [
      { id: "frame", type: "shape", shape: "rect", x: 60, y: 360, w: 960, h: 580, fill: "transparent", border: { width: 6, color: "#29f0ff" } },
      { id: "kicker", type: "text", x: 140, y: 400, w: 800, h: 34, text: "PLAYER 1 READY", font: "Press Start 2P", size: 22, align: "center", color: "#29f0ff" },
      { id: "title", type: "text", x: 100, y: 470, w: 880, h: 280, text: "HEAD\nLINE", font: "Press Start 2P", sizing: "fill", wrap: false, lineHeight: 1.25, align: "center", color: "#ffe600", shadow: "6px 6px 0 #ff2e88" },
      { id: "details", type: "text", x: 120, y: 790, w: 840, h: 100, text: "SAT 14 NOV · 10PM", font: "Press Start 2P", size: 20, lineHeight: 1.7, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "western",
    name: "Western poster",
    moods: ["country", "western", "rodeo", "cowboy", "barn", "bbq", "saloon", "ranch", "rustic", "hoedown", "line dancing"],
    use: "Old wood-type wanted-poster look: ornate Tuscan title between heavy rules, slab-serif details, warm paper and rust ink.",
    preview: "#e9d3a6",
    layers: [
      { id: "kicker", type: "text", x: 140, y: 330, w: 800, h: 44, text: "SATURDAY NIGHT", font: "Rye", size: 30, tracking: 0.08, align: "center", color: "#3b2412" },
      { id: "rule1", type: "shape", shape: "rect", x: 140, y: 390, w: 800, h: 5, fill: "#3b2412" },
      { id: "title", type: "text", x: 80, y: 420, w: 920, h: 300, text: "HEAD\nLINE", font: "Rye", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#8a2c0d" },
      { id: "rule2", type: "shape", shape: "rect", x: 140, y: 740, w: 800, h: 5, fill: "#3b2412" },
      { id: "details", type: "text", x: 140, y: 770, w: 800, h: 50, text: "BBQ · LIVE BAND · DANCING", font: "Alfa Slab One", size: 32, tracking: 0.08, align: "center", color: "#3b2412" },
    ],
  },
  {
    id: "graffiti",
    name: "Graffiti tag",
    moods: ["graffiti", "street", "hiphop", "urban", "skate", "rap", "mixtape", "drill", "underground", "youth", "block party"],
    use: "A spray-paint tag title in acid green with a thick black outline and a hot pink offset shadow, details in marker. Street, block party, skate.",
    preview: "linear-gradient(180deg,#5b5b5b,#2c2c2c)",
    layers: [
      { id: "title", type: "text", x: 60, y: 460, w: 960, h: 320, text: "Headline", font: "Sedgwick Ave Display", sizing: "fill", wrap: false, align: "center", color: "#39ff14", stroke: { width: 6, color: "#000000" }, shadow: "8px 8px 0 #ff00a8", rotate: -5 },
      { id: "details", type: "text", x: 140, y: 830, w: 800, h: 60, text: "Block party · Sat 14 Nov", font: "Permanent Marker", size: 38, align: "center", color: "#ffffff", rotate: -2 },
    ],
  },
  {
    id: "minimal",
    name: "Minimal lowercase",
    moods: ["tech", "startup", "brand", "launch", "app", "product", "minimal", "clean", "modern", "agency", "portfolio", "podcast"],
    use: "Modern restraint: a tight lowercase sans title flush left, a single accent dot, small details underneath, generous white space.",
    preview: "#f5f4f0",
    layers: [
      { id: "kicker", type: "text", x: 80, y: 520, w: 600, h: 30, text: "(new)", font: "Inter", weight: 500, size: 22, tracking: 0.05, color: "#8a8a85" },
      { id: "title", type: "text", x: 80, y: 560, w: 720, h: 200, text: "headline", font: "Inter Tight", weight: 600, sizing: "fill", wrap: false, case: "lower", tracking: -0.04, color: "#111111" },
      { id: "dot", type: "shape", shape: "ellipse", x: 870, y: 610, w: 110, h: 110, fill: "#ff3d00" },
      { id: "details", type: "text", x: 80, y: 800, w: 800, h: 80, text: "Launching 14 November\nlagos.studio", font: "Inter", weight: 500, size: 26, lineHeight: 1.3, color: "#111111" },
    ],
  },
  {
    id: "sale-burst",
    name: "Sale burst",
    moods: ["sale", "promo", "discount", "offer", "black friday", "deal", "shop", "store", "market", "clearance", "giveaway"],
    use: "A yellow starburst sticker carrying the big number or percentage, with the heavy caps title and details below. Retail, promos, giveaways.",
    preview: "#e11d48",
    layers: [
      {
        id: "burst", type: "svg", x: 290, y: 300, w: 500, h: 500,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><polygon fill='#ffd400' points='100.0,2.0 115.6,21.5 137.5,9.5 144.4,33.5 169.3,30.7 166.5,55.6 190.5,62.5 178.5,84.4 198.0,100.0 178.5,115.6 190.5,137.5 166.5,144.4 169.3,169.3 144.4,166.5 137.5,190.5 115.6,178.5 100.0,198.0 84.4,178.5 62.5,190.5 55.6,166.5 30.7,169.3 33.5,144.4 9.5,137.5 21.5,115.6 2.0,100.0 21.5,84.4 9.5,62.5 33.5,55.6 30.7,30.7 55.6,33.5 62.5,9.5 84.4,21.5'/></svg>",
      },
      { id: "accent", type: "text", x: 350, y: 460, w: 380, h: 180, text: "50%", font: "Archivo Black", sizing: "fill", wrap: false, align: "center", color: "#111111", rotate: -8 },
      { id: "title", type: "text", x: 60, y: 840, w: 960, h: 200, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "details", type: "text", x: 140, y: 1070, w: 800, h: 44, text: "THIS WEEKEND ONLY", font: "Space Grotesk", weight: 700, size: 30, tracking: 0.12, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "horror",
    name: "Horror drip",
    moods: ["horror", "halloween", "scary", "thriller", "haunted", "zombie", "spooky", "fright", "costume", "monster"],
    use: "Dripping blood-red horror lettering with a dark red glow, framed by elegant Roman caps for kicker and details. Halloween, horror nights.",
    preview: "radial-gradient(circle at 50% 40%,#2b0a0a,#050505 70%)",
    layers: [
      { id: "kicker", type: "text", x: 140, y: 420, w: 800, h: 40, text: "ENTER IF YOU DARE", font: "Cinzel", weight: 700, size: 26, tracking: 0.3, align: "center", color: "#e5e5e5" },
      { id: "title", type: "text", x: 60, y: 480, w: 960, h: 300, text: "HEAD\nLINE", font: "Creepster", sizing: "fill", wrap: false, lineHeight: 0.9, align: "center", color: "#c1121f", shadow: "0 0 24px rgba(193,18,31,0.6)" },
      { id: "details", type: "text", x: 140, y: 820, w: 800, h: 50, text: "31 OCTOBER · MIDNIGHT", font: "Cinzel", weight: 700, size: 28, tracking: 0.2, align: "center", color: "#e5e5e5" },
    ],
  },
  {
    id: "lineup",
    name: "Festival lineup",
    moods: ["festival", "lineup", "concert", "music", "fest", "carnival", "tour", "artists", "stage", "showcase", "day party"],
    use: "Poster hierarchy for many names: festival title on top, headliners large in a second line, the supporting acts and info smaller below.",
    preview: "linear-gradient(180deg,#ff5f6d,#ffc371)",
    layers: [
      { id: "kicker", type: "text", x: 80, y: 250, w: 920, h: 40, text: "THREE DAYS · TWO STAGES", font: "Space Grotesk", weight: 700, size: 26, tracking: 0.3, align: "center", color: "#3a0d18" },
      { id: "title", type: "text", x: 60, y: 300, w: 960, h: 260, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "subhead", type: "text", x: 80, y: 600, w: 920, h: 180, text: "HEADLINER  ·  HEADLINER", font: "Barlow Condensed", weight: 800, size: 74, lineHeight: 1.05, align: "center", color: "#3a0d18" },
      { id: "details", type: "text", x: 80, y: 820, w: 920, h: 120, text: "Artist · Artist · Artist · Artist · Artist", font: "Barlow Condensed", weight: 600, size: 36, tracking: 0.08, lineHeight: 1.3, align: "center", color: "#3a0d18" },
    ],
  },
  {
    id: "party-photo",
    name: "Party headliner",
    moods: ["afrobeats", "party", "club", "nightlife", "after party", "owambe", "amapiano", "concert", "birthday", "rave", "celebration", "day party", "hangout", "night"],
    use: "The Afro-party flyer formula: the title repeated huge and faint behind the scene, a bold gold title at the bottom, a stacked date block top left, a round entry-price badge and an info strip. Best over a photo of people.",
    preview: "radial-gradient(circle at 50% 35%,#7a2e00,#1a0800 75%)",
    layers: [
      { id: "ghost1", type: "text", x: -200, y: 150, w: 1480, h: 260, text: "HEADLINE HEADLINE", font: "Anton", sizing: "fill", wrap: false, color: "#ffffff", opacity: 0.09, rotate: -8 },
      { id: "ghost2", type: "text", x: -200, y: 420, w: 1480, h: 260, text: "HEADLINE HEADLINE", font: "Anton", sizing: "fill", wrap: false, color: "#ffffff", opacity: 0.09, rotate: -8 },
      { id: "datebox", type: "shape", shape: "rect", x: 70, y: 70, w: 150, h: 190, fill: "#ffc94d", radius: 8 },
      { id: "date", type: "text", x: 78, y: 82, w: 134, h: 166, text: "SAT\n14\nNOV", font: "Anton", sizing: "fill", wrap: false, lineHeight: 1, align: "center", color: "#1a0800" },
      { id: "badge", type: "shape", shape: "ellipse", x: 850, y: 70, w: 170, h: 170, fill: "#ff3d00" },
      { id: "price", type: "text", x: 870, y: 108, w: 130, h: 94, text: "$20\nENTRY", font: "Anton", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#ffffff" },
      { id: "kicker", type: "text", x: 140, y: 820, w: 800, h: 44, text: "CLUB EKO PRESENTS", font: "Space Grotesk", weight: 700, size: 26, tracking: 0.3, align: "center", color: "#ffd166" },
      {
        id: "title", type: "text", x: 50, y: 870, w: 980, h: 230, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center",
        gradient: "linear-gradient(180deg,#fff3c4 0%,#ffc94d 45%,#e08a00 100%)", shadow: "0 8px 0 rgba(60,20,0,0.85)",
      },
      { id: "strip", type: "shape", shape: "rect", x: 0, y: 1180, w: 1080, h: 110, fill: "rgba(0,0,0,0.55)" },
      { id: "details", type: "text", x: 60, y: 1205, w: 960, h: 60, text: "DRESS CODE: ALL BLACK  ·  TABLES 08000000000", font: "Space Grotesk", weight: 600, size: 28, tracking: 0.1, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "minister",
    name: "Church programme",
    moods: ["church", "gospel", "worship", "praise", "crusade", "revival", "sermon", "christian", "prayer", "service", "convention", "thanksgiving", "youth", "ministry", "pastor"],
    use: "Church and conference flyer: theme title at the bottom with a script accent, the minister's name on a tilted plate, a round date badge top right, a details line. Leave the centre for the minister's photo.",
    preview: "radial-gradient(circle at 50% 30%,#3b2a8a,#0d0826 70%)",
    layers: [
      { id: "kicker", type: "text", x: 80, y: 80, w: 640, h: 40, text: "THE CHURCH PRESENTS", font: "Montserrat", weight: 700, size: 24, tracking: 0.3, color: "#ffd98a" },
      { id: "dateCircle", type: "shape", shape: "ellipse", x: 860, y: 50, w: 170, h: 170, fill: "#ffd98a" },
      { id: "date", type: "text", x: 880, y: 82, w: 130, h: 106, text: "14\nNOV", font: "Anton", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#0d0826" },
      { id: "accent", type: "text", x: 120, y: 790, w: 840, h: 130, text: "Night of", font: "Great Vibes", sizing: "fill", wrap: false, align: "center", color: "#ffd98a", rotate: -4 },
      { id: "title", type: "text", x: 50, y: 880, w: 980, h: 200, text: "HEADLINE", font: "Cinzel", weight: 800, sizing: "fill", wrap: false, align: "center", color: "#ffffff", shadow: "0 0 30px rgba(255,200,90,0.5)" },
      { id: "plate", type: "shape", shape: "rect", x: 300, y: 1100, w: 480, h: 72, fill: "#ffffff", rotate: -3 },
      { id: "host", type: "text", x: 312, y: 1109, w: 456, h: 54, text: "PASTOR NAME", font: "Montserrat", weight: 800, sizing: "fill", wrap: false, align: "center", case: "upper", color: "#0d0826", rotate: -3 },
      { id: "details", type: "text", x: 80, y: 1230, w: 920, h: 50, text: "SUNDAY 9AM  ·  MAIN AUDITORIUM", font: "Montserrat", weight: 600, size: 26, tracking: 0.15, align: "center", color: "#ffd98a" },
    ],
  },
  {
    id: "menu-list",
    name: "Menu board",
    moods: ["restaurant", "menu", "food", "cafe", "kitchen", "bistro", "bar", "cocktail", "drinks", "brunch", "buka", "grill", "pizza", "burger", "chops", "catering", "bakery", "lounge"],
    use: "Restaurant menu: a script word over a bold title, a dark panel listing dishes with their prices aligned right, contact at the bottom. Pass dishes as items, e.g. 'Jollof Rice — ₦3,500'.",
    preview: "linear-gradient(180deg,#1b1b1b,#0e0e0e)",
    layers: [
      { id: "title", type: "text", x: 60, y: 170, w: 960, h: 200, text: "MENU", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "accent", type: "text", x: 140, y: 60, w: 800, h: 120, text: "Today's", font: "Pacifico", sizing: "fill", wrap: false, align: "center", color: "#ffb703", rotate: -4, shadow: "3px 4px 0px rgba(0,0,0,0.45)" },
      { id: "panel", type: "shape", shape: "rect", x: 90, y: 400, w: 900, h: 640, fill: "rgba(0,0,0,0.62)", radius: 24, border: { width: 2, color: "#ffb703" } },
      { id: "names", type: "text", x: 140, y: 450, w: 560, h: 540, text: "Dish\nDish", font: "Space Grotesk", weight: 600, size: 40, lineHeight: 1.9, color: "#ffffff" },
      { id: "prices", type: "text", x: 700, y: 450, w: 240, h: 540, text: "$10\n$10", font: "Space Grotesk", weight: 700, size: 40, lineHeight: 1.9, align: "right", color: "#ffb703" },
      { id: "details", type: "text", x: 90, y: 1090, w: 900, h: 50, text: "ORDER: 0800 000 0000  ·  12 MARINA ROAD", font: "Space Grotesk", weight: 600, size: 28, tracking: 0.1, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "food-promo",
    name: "Food promo",
    moods: ["food", "restaurant", "promo", "special", "delivery", "order", "takeaway", "kitchen", "chicken", "pizza", "burger", "shawarma", "grill", "cafe", "offer", "suya", "small chops"],
    use: "A dish promotion: a script word over a heavy title, a painted brush tag, an ORDER NOW button with the phone number and a round price badge, over a dark food photo.",
    preview: "radial-gradient(circle at 50% 70%,#5a3a1a,#0f0a06 70%)",
    layers: [
      { id: "badge", type: "shape", shape: "ellipse", x: 800, y: 640, w: 190, h: 190, fill: "#ff3d00", rotate: 8 },
      { id: "price", type: "text", x: 820, y: 690, w: 150, h: 90, text: "₦5,000", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff", rotate: 8 },
      { id: "accent", type: "text", x: 140, y: 300, w: 800, h: 150, text: "Delicious", font: "Kaushan Script", sizing: "fill", wrap: false, align: "center", color: "#ffffff", rotate: -5 },
      { id: "title", type: "text", x: 60, y: 420, w: 960, h: 220, text: "HEADLINE", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      {
        id: "tagStroke", type: "svg", x: 330, y: 650, w: 420, h: 90,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80' preserveAspectRatio='none'><path d='M8 18 C 120 4, 280 2, 392 12 L 388 66 C 270 76, 130 78, 12 70 Z' fill='#ffc300'/></svg>",
      },
      { id: "tag", type: "text", x: 350, y: 660, w: 380, h: 70, text: "PROMO", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#1a1a1a", rotate: -2 },
      { id: "button", type: "shape", shape: "rect", x: 340, y: 780, w: 400, h: 80, radius: 40, fill: "#ffc300" },
      { id: "cta", type: "text", x: 360, y: 792, w: 360, h: 56, text: "ORDER NOW", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#1a1a1a" },
      { id: "details", type: "text", x: 140, y: 890, w: 800, h: 50, text: "0800 000 0000", font: "Space Grotesk", weight: 700, size: 30, tracking: 0.08, align: "center", color: "#ffffff" },
    ],
  },
  {
    id: "corporate",
    name: "Corporate angles",
    moods: ["business", "corporate", "agency", "marketing", "consulting", "company", "firm", "services", "finance", "seminar", "webinar", "startup", "logistics", "cleaning", "insurance", "ict", "printing"],
    use: "Clean business flyer: angled colour blocks, a left-aligned stacked headline, a checklist of services and a contact bar. Pass services as items. The photo shows on the right.",
    preview: "linear-gradient(135deg,#f4f6fa,#e3e8f2)",
    layers: [
      { id: "blockA", type: "shape", shape: "rect", x: -320, y: -260, w: 1060, h: 760, fill: "#0b2c6b", rotate: -18 },
      { id: "blockB", type: "shape", shape: "rect", x: -320, y: 470, w: 1060, h: 26, fill: "#ffb400", rotate: -18 },
      { id: "kicker", type: "text", x: 80, y: 90, w: 560, h: 36, text: "GROW WITH US", font: "Montserrat", weight: 700, size: 22, tracking: 0.3, color: "#ffb400" },
      { id: "title", type: "text", x: 80, y: 140, w: 600, h: 260, text: "HEAD\nLINE", font: "Montserrat", weight: 900, sizing: "fill", wrap: false, lineHeight: 0.95, color: "#ffffff" },
      { id: "items", type: "text", x: 80, y: 620, w: 640, h: 380, text: "✓  Service\n✓  Service", font: "Montserrat", weight: 600, size: 36, lineHeight: 1.7, color: "#0b2c6b" },
      { id: "bar", type: "shape", shape: "rect", x: 0, y: 1200, w: 1080, h: 150, fill: "#0b2c6b" },
      { id: "details", type: "text", x: 80, y: 1235, w: 920, h: 80, text: "0800 000 0000\nwww.company.com", font: "Montserrat", weight: 600, size: 28, lineHeight: 1.35, color: "#ffffff" },
    ],
  },
  {
    id: "admission",
    name: "School admission",
    moods: ["school", "admission", "enrollment", "education", "academy", "college", "university", "course", "training", "class", "tutorial", "lesson", "bootcamp", "workshop", "registration", "summer school"],
    use: "Admission and course flyer: a script word, a bold caps headline, a huge year or number, a bullet list of courses and a phone pill.",
    preview: "linear-gradient(160deg,#ff7a00,#6a1b9a)",
    layers: [
      { id: "kicker", type: "text", x: 80, y: 110, w: 560, h: 130, text: "Admission", font: "Pacifico", sizing: "fill", wrap: false, color: "#ffffff", rotate: -4 },
      { id: "title", type: "text", x: 80, y: 240, w: 640, h: 120, text: "OPEN FOR", font: "Anton", sizing: "fill", wrap: false, color: "#ffffff" },
      { id: "number", type: "text", x: 80, y: 360, w: 680, h: 260, text: "2026", font: "Anton", sizing: "fill", wrap: false, color: "#ffd400" },
      { id: "items", type: "text", x: 80, y: 660, w: 660, h: 340, text: "•  Course\n•  Course", font: "Montserrat", weight: 600, size: 36, lineHeight: 1.6, color: "#ffffff" },
      { id: "details", type: "text", x: 80, y: 1060, w: 700, h: 80, text: "CALL 0800 000 0000", font: "Montserrat", weight: 800, size: 32, color: "#6a1b9a", bg: { color: "#ffd400", padX: 28, padY: 12, radius: 999 } },
    ],
  },
  {
    id: "matchday",
    name: "Match day",
    moods: ["sports", "football", "soccer", "match", "game", "basketball", "tournament", "league", "derby", "final", "boxing", "fight", "competition", "fixture"],
    use: "Sports fixture: a MATCH DAY title, the two sides facing each other around a big VS, and a date, time and venue strip. Pass the sides in subhead as 'Team A vs Team B'.",
    preview: "linear-gradient(180deg,#0a3d1f,#04170b)",
    layers: [
      { id: "kicker", type: "text", x: 140, y: 260, w: 800, h: 40, text: "LEAGUE ROUND 12", font: "Barlow Condensed", weight: 700, size: 30, tracking: 0.3, align: "center", color: "#b6ff3b" },
      { id: "title", type: "text", x: 60, y: 300, w: 960, h: 230, text: "MATCH DAY", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "teamA", type: "text", x: 60, y: 600, w: 400, h: 140, text: "TEAM A", font: "Anton", sizing: "fill", wrap: false, align: "right", color: "#ffffff" },
      { id: "vs", type: "text", x: 470, y: 580, w: 140, h: 180, text: "VS", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#b6ff3b" },
      { id: "teamB", type: "text", x: 620, y: 600, w: 400, h: 140, text: "TEAM B", font: "Anton", sizing: "fill", wrap: false, color: "#ffffff" },
      { id: "strip", type: "shape", shape: "rect", x: 120, y: 800, w: 840, h: 80, fill: "#b6ff3b", radius: 6 },
      { id: "details", type: "text", x: 140, y: 812, w: 800, h: 56, text: "SAT 4PM  ·  CITY STADIUM", font: "Barlow Condensed", weight: 700, size: 34, tracking: 0.1, align: "center", color: "#04170b" },
    ],
  },
  {
    id: "offer-wave",
    name: "Photo top, wave panel",
    moods: ["hotel", "travel", "resort", "real estate", "property", "spa", "apartment", "vacation", "tour", "airline", "beauty", "salon", "clinic", "hospital", "health", "wellness", "shortlet"],
    use: "Hospitality and property flyer: the photo fills the top, a curved panel sweeps across the lower half carrying an elegant serif title, a discount badge, a feature list and contact details.",
    preview: "linear-gradient(180deg,#9cc6e8,#4a7fb0)",
    layers: [
      {
        id: "wave", type: "svg", x: 0, y: 600, w: 1080, h: 750,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 750' preserveAspectRatio='none'><path d='M0 120 C 300 0, 700 220, 1080 60 L1080 750 L0 750 Z' fill='#0e2a47'/></svg>",
      },
      { id: "badge", type: "shape", shape: "ellipse", x: 820, y: 640, w: 200, h: 200, fill: "#f2b544" },
      { id: "price", type: "text", x: 845, y: 690, w: 150, h: 100, text: "30%\nOFF", font: "Anton", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#0e2a47" },
      { id: "kicker", type: "text", x: 80, y: 770, w: 600, h: 36, text: "LUXURY STAYS", font: "Montserrat", weight: 700, size: 22, tracking: 0.3, color: "#9cc6e8" },
      { id: "title", type: "text", x: 80, y: 810, w: 680, h: 140, text: "Headline", font: "Playfair Display", weight: 700, sizing: "fill", wrap: false, color: "#ffffff" },
      { id: "items", type: "text", x: 80, y: 975, w: 560, h: 260, text: "•  Feature\n•  Feature", font: "Montserrat", weight: 500, size: 30, lineHeight: 1.6, color: "#ffffff" },
      { id: "details", type: "text", x: 660, y: 990, w: 360, h: 220, text: "Book now\n0800 000 0000", font: "Montserrat", weight: 600, size: 28, lineHeight: 1.45, color: "#f2b544" },
    ],
  },
  {
    id: "fitness",
    name: "Fitness slash",
    moods: ["gym", "fitness", "workout", "training", "bootcamp", "yoga", "crossfit", "boxing", "run", "marathon", "health", "dance class", "aerobics", "weight loss"],
    use: "Gym and fitness flyer: a heavy italic condensed title in two tones slashed across the page, diagonal stripes, a price badge, a class list and contact line.",
    preview: "linear-gradient(160deg,#111111,#232323)",
    layers: [
      { id: "stripe1", type: "shape", shape: "rect", x: -100, y: 380, w: 1300, h: 22, fill: "#c6ff00", rotate: -7 },
      { id: "stripe2", type: "shape", shape: "rect", x: -100, y: 830, w: 1300, h: 22, fill: "#c6ff00", rotate: -7 },
      { id: "badge", type: "shape", shape: "ellipse", x: 820, y: 110, w: 180, h: 180, fill: "#c6ff00" },
      { id: "price", type: "text", x: 840, y: 150, w: 140, h: 100, text: "₦10K\nMONTHLY", font: "Anton", sizing: "fill", wrap: false, lineHeight: 0.95, align: "center", color: "#111111" },
      { id: "kicker", type: "text", x: 80, y: 300, w: 700, h: 40, text: "NEW CLASSES", font: "Barlow Condensed", weight: 700, italic: true, size: 30, tracking: 0.3, color: "#c6ff00" },
      { id: "line1", type: "text", x: 60, y: 420, w: 960, h: 200, text: "TRAIN", font: "Barlow Condensed", weight: 900, italic: true, sizing: "fill", wrap: false, color: "#ffffff", rotate: -6 },
      { id: "line2", type: "text", x: 60, y: 610, w: 960, h: 200, text: "HARD", font: "Barlow Condensed", weight: 900, italic: true, sizing: "fill", wrap: false, align: "right", color: "#c6ff00", rotate: -6 },
      { id: "items", type: "text", x: 80, y: 950, w: 620, h: 210, text: "•  Class\n•  Class", font: "Barlow Condensed", weight: 600, size: 38, lineHeight: 1.45, color: "#ffffff" },
      { id: "details", type: "text", x: 80, y: 1180, w: 920, h: 50, text: "0800 000 0000  ·  LEKKI PHASE 1", font: "Barlow Condensed", weight: 700, size: 34, tracking: 0.1, color: "#c6ff00" },
    ],
  },
  {
    id: "grand-opening",
    name: "Grand opening ribbon",
    moods: ["opening", "grand opening", "launch", "store", "shop", "new branch", "unveiling", "inauguration", "boutique", "salon", "pharmacy", "supermarket", "open"],
    use: "Opening announcement: the title on a folded ribbon banner, confetti, a big date, the opening offers listed, and the address.",
    preview: "linear-gradient(180deg,#fff7e8,#ffe2b3)",
    layers: [
      { id: "confetti", type: "svg", x: 0, y: 0, w: 1080, h: 600, svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 600'><circle cx='90' cy='80' r='14' fill='#ff4d6d'/><circle cx='210' cy='170' r='9' fill='#ffb703'/><circle cx='330' cy='60' r='11' fill='#3a86ff'/><circle cx='470' cy='140' r='7' fill='#8338ec'/><circle cx='610' cy='70' r='13' fill='#06d6a0'/><circle cx='760' cy='160' r='9' fill='#ff4d6d'/><circle cx='890' cy='60' r='12' fill='#ffb703'/><circle cx='1000' cy='190' r='8' fill='#3a86ff'/><circle cx='150' cy='280' r='8' fill='#06d6a0'/><circle cx='940' cy='300' r='11' fill='#8338ec'/><circle cx='60' cy='420' r='10' fill='#ffb703'/><circle cx='1030' cy='450' r='9' fill='#ff4d6d'/><circle cx='400' cy='250' r='6' fill='#ff4d6d'/><circle cx='700' cy='260' r='7' fill='#ffb703'/></svg>" },
      { id: "kicker", type: "text", x: 140, y: 330, w: 800, h: 50, text: "YOU'RE INVITED", font: "Montserrat", weight: 800, size: 26, tracking: 0.3, align: "center", color: "#b30059" },
      {
        id: "ribbon", type: "svg", x: 40, y: 400, w: 1000, h: 230,
        svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 230' preserveAspectRatio='none'><path d='M0 60 L90 60 L60 115 L90 170 L0 170 Z' fill='#7a003c'/><path d='M1000 60 L910 60 L940 115 L910 170 L1000 170 Z' fill='#7a003c'/><rect x='70' y='30' width='860' height='170' fill='#b30059'/></svg>",
      },
      { id: "title", type: "text", x: 140, y: 445, w: 800, h: 140, text: "GRAND OPENING", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#ffffff" },
      { id: "date", type: "text", x: 140, y: 660, w: 800, h: 120, text: "SAT 14 NOV", font: "Anton", sizing: "fill", wrap: false, align: "center", color: "#1c1c1c" },
      { id: "items", type: "text", x: 190, y: 810, w: 700, h: 200, text: "★  Offer\n★  Offer", font: "Montserrat", weight: 600, size: 32, lineHeight: 1.6, align: "center", color: "#1c1c1c" },
      { id: "details", type: "text", x: 140, y: 1050, w: 800, h: 50, text: "12 MARINA ROAD, LAGOS", font: "Montserrat", weight: 700, size: 26, tracking: 0.1, align: "center", color: "#b30059" },
    ],
  },
];

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** The treatments that best match a brief. Falls back to versatile ones when nothing matches. */
export function pickTreatments(brief: string, n = 3, forced?: string): Treatment[] {
  const q = new Set(words(brief.replace(/hip[\s-]?hop/gi, "hiphop")));
  const scored = TREATMENTS.map((t) => ({ t, s: t.moods.filter((m) => words(m).every((w) => q.has(w))).length }));
  const hits = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.t);
  const fallback = ["script-over-caps", "stagger", "swiss"].map((id) => TREATMENTS.find((t) => t.id === id)!);
  const first = TREATMENTS.filter((t) => t.id === forced);
  return [...new Set([...first, ...hits, ...fallback])].slice(0, n);
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

export function treatmentBlock(brief: string, ratio: Ratio, forced?: string): string {
  const picks = pickTreatments(brief, 3, forced);
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
export function treatmentMenu(brief: string, forced?: string): string {
  const best = pickTreatments(brief, 3, forced).map((t) => t.id);
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
