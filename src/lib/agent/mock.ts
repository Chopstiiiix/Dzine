import type { Design, Layer } from "@/lib/design/types";
import { normalizeDesign } from "@/lib/design/normalize";
import type { AgentRun } from "./run";

// Stand-in for the real agent when ANTHROPIC_API_KEY is missing.
// It walks through the same event stream with a hand-made layout so the whole
// product flow (chat, live canvas, credits, export) can be tried without any keys.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PALETTES = [
  { bg: "linear-gradient(165deg, #140a2b 0%, #3a1150 48%, #ff5a36 100%)", ink: "#fff4e6", accent: "#ffd23f", glow: "#ff5a36" },
  { bg: "linear-gradient(160deg, #06141b 0%, #0f3d3e 55%, #c7f464 100%)", ink: "#f3ffe9", accent: "#c7f464", glow: "#1fd1a5" },
  { bg: "linear-gradient(170deg, #1b1b1b 0%, #2b1d14 50%, #e2b279 100%)", ink: "#fbf3e7", accent: "#e2b279", glow: "#d9773c" },
];

function headline(text: string) {
  const words = text
    .replace(/[^\p{L}\p{N}\s'&-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(the|and|for|with|make|create|design|poster|flyer|cover|album|want|need|please|that|this|look|like|about)$/i.test(w));
  const picked = words.slice(0, 2);
  return picked.length ? picked.join("\n") : "DZINE\nDEMO";
}

export async function runMockAgent(run: AgentRun): Promise<void> {
  const { store, project, ratio, input, emit, progress } = run;
  if (input.kind === "review") {
    emit({ type: "done", message: null });
    return;
  }

  const assets = await store.listAssets(project.id);
  const photo = assets.find((a) => a.label === "photo" || a.label === "cutout");
  const logo = assets.find((a) => a.label === "logo");
  const W = ratio.w;
  const H = ratio.h;
  const m = Math.round(Math.min(W, H) * 0.07);
  const turn = project.history.length;
  const p = PALETTES[turn % PALETTES.length];
  const wide = W / H > 1.2;
  const u = Math.min(W, H);

  const say = async (text: string) => {
    for (const word of text.split(/(?<= )/)) {
      emit({ type: "text", delta: word });
      await sleep(22);
    }
  };

  await say(
    "Demo mode: no AI keys are connected yet, so this is a sample layout that shows how the live canvas works. " +
      "I'm going for a bold, warm gradient with a big stacked headline. ",
  );

  emit({ type: "status", text: "Composing the layout" });

  const textW = wide ? W * 0.52 : W - 2 * m;
  const layers: Layer[] = [
    {
      id: "glow", type: "shape", shape: "ellipse",
      x: W * 0.3, y: H * 0.05, w: W * 0.95, h: W * 0.95,
      fill: `radial-gradient(circle, ${p.glow} 0%, transparent 65%)`, blur: u * 0.05, opacity: 0.75, blend: "screen",
    },
    {
      id: "rings", type: "svg", x: wide ? W * 0.5 : W * 0.18, y: wide ? -H * 0.2 : H * 0.02, w: u * 1.05, h: u * 1.05, opacity: 0.5,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none" stroke="${p.accent}" stroke-width="1.2">${[60, 95, 130, 165, 198]
        .map((r) => `<circle cx="200" cy="200" r="${r}"/>`)
        .join("")}</svg>`,
    },
    ...(photo
      ? [{
          id: "photo", type: "image" as const, asset: photo.id,
          x: wide ? W * 0.5 : 0, y: 0, w: wide ? W * 0.5 : W, h: wide ? H : H * 0.68,
          fit: (photo.label === "cutout" ? "contain" : "cover") as "contain" | "cover",
          mask: (wide ? "fade-left" : "fade-bottom") as "fade-left" | "fade-bottom",
        }]
      : []),
    {
      id: "scrim", type: "shape", shape: "rect", x: 0, y: H * 0.45, w: W, h: H * 0.55,
      fill: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 100%)",
    },
    {
      id: "kicker", type: "text", text: "DZINE PRESENTS", font: "Space Grotesk", weight: 600,
      size: u * 0.026, sizing: "fixed", color: p.accent, tracking: 0.32,
      x: m, y: m, w: textW, h: u * 0.05,
    },
    {
      id: "title", type: "text", text: headline(input.text), font: "Anton", case: "upper",
      size: 400, sizing: "fill", color: p.ink, lineHeight: 0.92, tracking: -0.01, valign: "bottom",
      x: m, y: wide ? H * 0.2 : H * 0.42, w: textW, h: wide ? H * 0.5 : H * 0.36,
      shadow: `0px ${Math.round(u * 0.01)}px ${Math.round(u * 0.04)}px rgba(0,0,0,0.35)`,
    },
    {
      id: "rule", type: "shape", shape: "rect", fill: p.accent,
      x: m, y: wide ? H * 0.74 : H * 0.805, w: u * 0.12, h: Math.max(3, u * 0.006),
    },
    {
      id: "details", type: "text", font: "Space Grotesk", weight: 500,
      text: "Sample layout · add your API keys\nto get real AI-designed artwork",
      size: u * 0.03, sizing: "fit", color: p.ink, lineHeight: 1.35, opacity: 0.9,
      x: m, y: wide ? H * 0.78 : H * 0.83, w: textW * 0.8, h: u * 0.1,
    },
    {
      id: "tag", type: "text", text: "DEMO", font: "Space Mono", weight: 700,
      size: u * 0.024, sizing: "fixed", color: "#111111", tracking: 0.2, align: "center", valign: "middle",
      bg: { color: p.accent, padX: u * 0.018, padY: u * 0.008, radius: 999 },
      x: W - m - u * 0.16, y: m - u * 0.008, w: u * 0.16, h: u * 0.06, rotate: 6,
    },
    ...(logo
      ? [{
          id: "logo", type: "image" as const, asset: logo.id, fit: "contain" as const,
          x: W - m - u * 0.16, y: H - m - u * 0.1, w: u * 0.16, h: u * 0.1,
        }]
      : []),
  ];

  const ids = new Set(assets.map((a) => a.id));
  const build = (n: number): Design =>
    normalizeDesign({ background: p.bg, grain: 0.22, layers: layers.slice(0, n) }, ratio, ids).design;

  for (let n = 0; n <= layers.length; n++) {
    emit({ type: "design", design: build(n), partial: n < layers.length });
    await sleep(380);
  }

  const design = build(layers.length);
  progress.produced = true;
  const title = project.title === "Untitled design" ? headline(input.text).replace("\n", " ").slice(0, 40) : project.title;
  if (title !== project.title) emit({ type: "title", title });

  emit({ type: "text", delta: "\n\n" });
  const closing = "Drag any layer to move it, or click text to edit it. Connect your keys and the same flow runs with the real designer.";
  await say(closing);

  // A tiny history entry so the next demo turn uses a different palette.
  await store.updateProject(project.id, { design, title, history: [...project.history, { role: "user", content: input.text }] });
  const message = await store.addMessage(project.id, {
    role: "assistant",
    content:
      "Demo mode: no AI keys are connected yet, so this is a sample layout that shows how the live canvas works. " +
      "I'm going for a bold, warm gradient with a big stacked headline.\n\n" + closing,
    attachments: [],
  });
  emit({ type: "status", text: null });
  emit({ type: "done", message });
}
