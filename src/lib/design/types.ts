// The design document. All geometry is in CSS pixels of the canvas design space
// (see ratios.ts), origin top-left. Layers paint in array order: first = bottom.

export const BLENDS = [
  "normal", "multiply", "screen", "overlay", "soft-light", "hard-light", "color-dodge",
  "color-burn", "darken", "lighten", "difference", "exclusion", "luminosity", "color",
] as const;
export type Blend = (typeof BLENDS)[number];

export const MASKS = ["none", "fade-bottom", "fade-top", "fade-left", "fade-right", "fade-edges", "circle"] as const;
export type Mask = (typeof MASKS)[number];

export type Border = { width: number; color: string };

export const SHAPES = ["rect", "ellipse", "triangle", "diamond", "hexagon", "star"] as const;
export type ShapeKind = (typeof SHAPES)[number];

export type LayerBase = {
  id: string;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  opacity?: number;
  blend?: Blend;
};

export type ImageFilter = {
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  sepia?: number;
  blur?: number;
  hueRotate?: number;
};

export type ImageLayer = LayerBase & {
  type: "image";
  /** Asset id from the project's asset library. */
  asset: string;
  fit?: "cover" | "contain";
  /** CSS object-position, e.g. "50% 20%". */
  focus?: string;
  radius?: number;
  filter?: ImageFilter;
  mask?: Mask;
  shadow?: string;
  border?: Border;
  flipX?: boolean;
};

export type TextLayer = LayerBase & {
  type: "text";
  text: string;
  font: string;
  /** Font size in px. With sizing "fit" it is a maximum, with "fill" it is ignored. */
  size: number;
  /**
   * fit  = shrink until the text fits the box (default).
   * fill = grow or shrink to the largest size that fits the box.
   * fixed = use `size` exactly.
   */
  sizing?: "fit" | "fill" | "fixed";
  weight?: number;
  color?: string;
  /** CSS gradient used as the text fill instead of `color`. */
  gradient?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  lineHeight?: number;
  /** Letter spacing in em. */
  tracking?: number;
  case?: "none" | "upper" | "lower";
  italic?: boolean;
  /** false = only break at explicit newlines. */
  wrap?: boolean;
  stroke?: Border;
  shadow?: string;
  /** A filled label behind the text. */
  bg?: { color: string; padX?: number; padY?: number; radius?: number };
};

export type ShapeLayer = LayerBase & {
  type: "shape";
  shape: ShapeKind;
  /** CSS colour or gradient. */
  fill?: string;
  radius?: number;
  border?: Border;
  shadow?: string;
  /** Gaussian blur in px, for glows and soft light. */
  blur?: number;
};

export type SvgLayer = LayerBase & {
  type: "svg";
  /** A complete <svg> element. Scales to the layer box. */
  svg: string;
};

export type Layer = ImageLayer | TextLayer | ShapeLayer | SvgLayer;

export type Design = {
  ratio: string;
  width: number;
  height: number;
  /** CSS colour or gradient behind every layer. */
  background: string;
  /** Film grain strength, 0 to 1. */
  grain?: number;
  layers: Layer[];
};

export type PatchOp =
  | { op: "update"; id: string; props: Record<string, unknown> }
  | { op: "remove"; id: string }
  | { op: "add"; layer: Record<string, unknown>; before?: string }
  | { op: "reorder"; id: string; before?: string };

export type AssetKind = "upload" | "generated" | "cutout";

export type Asset = {
  id: string;
  kind: AssetKind;
  /** photo | logo | reference | texture | background ... free text, shown to the agent. */
  label: string;
  name: string;
  mime: string;
  width: number | null;
  height: number | null;
  url: string;
};
