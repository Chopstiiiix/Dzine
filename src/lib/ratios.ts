// Canvas presets. `w` x `h` is the design space the agent lays out in (CSS pixels).
// The export is rendered at `w * scale` x `h * scale`.

export type RatioGroup = "Music" | "Social" | "Print" | "Cards";

export type Ratio = {
  id: string;
  label: string;
  group: RatioGroup;
  w: number;
  h: number;
  scale: number;
  /** Shown under the label. */
  hint: string;
  /** Closest aspect ratio the image model supports, for full-bleed imagery. */
  imageAspect: string;
};

export const RATIOS: Ratio[] = [
  { id: "album", label: "Album cover", group: "Music", w: 1000, h: 1000, scale: 3, hint: "1:1 · Spotify, Apple Music", imageAspect: "1:1" },
  { id: "canvas", label: "Spotify Canvas / Reel", group: "Music", w: 1080, h: 1920, scale: 2, hint: "9:16 · vertical", imageAspect: "9:16" },

  { id: "ig-portrait", label: "Instagram post", group: "Social", w: 1080, h: 1350, scale: 2, hint: "4:5 · feed", imageAspect: "4:5" },
  { id: "square", label: "Square post", group: "Social", w: 1080, h: 1080, scale: 2, hint: "1:1 · Instagram, Facebook", imageAspect: "1:1" },
  { id: "story", label: "Story / TikTok", group: "Social", w: 1080, h: 1920, scale: 2, hint: "9:16 · Stories, Reels, TikTok", imageAspect: "9:16" },
  { id: "landscape", label: "YouTube thumbnail", group: "Social", w: 1280, h: 720, scale: 2, hint: "16:9 · YouTube, X", imageAspect: "16:9" },
  { id: "banner", label: "Header banner", group: "Social", w: 1500, h: 500, scale: 2, hint: "3:1 · X, LinkedIn", imageAspect: "21:9" },

  { id: "poster", label: "Poster 24 × 36", group: "Print", w: 1200, h: 1800, scale: 3, hint: "2:3 · print", imageAspect: "2:3" },
  { id: "poster-34", label: "Poster 18 × 24", group: "Print", w: 1200, h: 1600, scale: 3, hint: "3:4 · print", imageAspect: "3:4" },
  { id: "a4", label: "Flyer A4 / A3", group: "Print", w: 1240, h: 1754, scale: 2, hint: "A-series · 300 dpi at A4", imageAspect: "2:3" },

  { id: "card", label: "Greeting card", group: "Cards", w: 1000, h: 1400, scale: 3, hint: "5 × 7 in", imageAspect: "3:4" },
  { id: "invite", label: "Invitation", group: "Cards", w: 1400, h: 1000, scale: 3, hint: "7 × 5 in · landscape", imageAspect: "4:3" },
  { id: "business", label: "Business card", group: "Cards", w: 1050, h: 600, scale: 2, hint: "3.5 × 2 in", imageAspect: "16:9" },
];

export const DEFAULT_RATIO = "ig-portrait";

export const RATIO_GROUPS: RatioGroup[] = ["Music", "Social", "Print", "Cards"];

export function getRatio(id: string | null | undefined): Ratio {
  return RATIOS.find((r) => r.id === id) ?? RATIOS.find((r) => r.id === DEFAULT_RATIO)!;
}

export const IMAGE_ASPECTS = ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"] as const;
