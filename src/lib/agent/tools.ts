import type Anthropic from "@anthropic-ai/sdk";
import { BLENDS, MASKS } from "@/lib/design/types";
import { IMAGE_ASPECTS } from "@/lib/ratios";

const border = {
  type: "object",
  properties: { width: { type: "number" }, color: { type: "string" } },
  required: ["width", "color"],
} as const;

const layerSchema = {
  type: "object",
  description: "One layer. Only the properties that apply to its type are used.",
  properties: {
    id: { type: "string", description: "Short unique id, e.g. 'bg', 'title', 'date'." },
    type: { type: "string", enum: ["image", "text", "shape", "svg"] },
    x: { type: "number" },
    y: { type: "number" },
    w: { type: "number" },
    h: { type: "number" },
    rotate: { type: "number", description: "Degrees, clockwise." },
    opacity: { type: "number" },
    blend: { type: "string", enum: [...BLENDS] },

    // image
    asset: { type: "string", description: "image: asset id from <assets>." },
    fit: { type: "string", enum: ["cover", "contain"] },
    focus: { type: "string", description: "image: CSS object-position, e.g. '50% 20%'." },
    mask: { type: "string", enum: [...MASKS] },
    filter: {
      type: "object",
      properties: {
        brightness: { type: "number" },
        contrast: { type: "number" },
        saturate: { type: "number" },
        grayscale: { type: "number" },
        sepia: { type: "number" },
        blur: { type: "number" },
        hueRotate: { type: "number" },
      },
    },
    flipX: { type: "boolean" },

    // text
    text: { type: "string" },
    font: { type: "string", description: "Family from the font catalogue." },
    size: { type: "number", description: "px. A maximum when sizing is 'fit'." },
    sizing: { type: "string", enum: ["fit", "fill", "fixed"] },
    weight: { type: "number" },
    color: { type: "string" },
    gradient: { type: "string", description: "text: CSS gradient used as the letter fill." },
    align: { type: "string", enum: ["left", "center", "right"] },
    valign: { type: "string", enum: ["top", "middle", "bottom"] },
    lineHeight: { type: "number" },
    tracking: { type: "number", description: "Letter spacing in em." },
    case: { type: "string", enum: ["none", "upper", "lower"] },
    italic: { type: "boolean" },
    wrap: { type: "boolean", description: "false = break only at \\n." },
    stroke: border,
    bg: {
      type: "object",
      properties: {
        color: { type: "string" },
        padX: { type: "number" },
        padY: { type: "number" },
        radius: { type: "number" },
      },
      required: ["color"],
    },

    // shape
    shape: { type: "string", enum: ["rect", "ellipse"] },
    fill: { type: "string", description: "shape: CSS colour or gradient." },
    blur: { type: "number", description: "shape: gaussian blur in px." },

    // shared by image and shape
    radius: { type: "number" },
    border,
    shadow: { type: "string", description: "'<x>px <y>px <blur>px <colour>'." },

    // svg
    svg: { type: "string", description: "svg: one complete <svg viewBox=...> element." },
  },
  required: ["id", "type", "x", "y", "w", "h"],
} as const;

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "generate_image",
    description:
      "Create an image with the AI image model and add it to the asset library. Without source_asset_ids it generates from the prompt alone. With source_asset_ids it transforms or combines those assets (restyle a photo, extend a background to a new aspect, place a product in a scene). Returns the new asset id and shows you the image.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short label for the asset, e.g. 'sunset skyline background'." },
        prompt: { type: "string", description: "Detailed description of the image. See 'Writing image prompts'." },
        aspect_ratio: { type: "string", enum: [...IMAGE_ASPECTS] },
        source_asset_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional. Asset ids to transform or use as visual input.",
        },
      },
      required: ["name", "prompt", "aspect_ratio"],
    },
  },
  {
    name: "search_fonts",
    description:
      "Search the full font library (about 1,700 families, all free for commercial use) by style, mood or name. Returns matching families with category, weights and style tags. Free: does not use the image budget.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Style words, e.g. 'graffiti', 'elegant wedding script', 'bold condensed sports', 'retro 70s'." },
        category: { type: "string", enum: ["display", "serif", "sans", "script", "mono-tech"] },
      },
      required: ["query"],
    },
  },
  {
    name: "remove_background",
    description:
      "Cut the main subject out of an image asset and return a new transparent asset (kind: cutout). Does not count against the image budget.",
    input_schema: {
      type: "object",
      properties: { asset_id: { type: "string" } },
      required: ["asset_id"],
    },
  },
  {
    name: "render_design",
    description:
      "Put a complete design on the canvas, replacing whatever is there. Write `background` first, then `layers` ordered bottom to top: the user watches the layers appear as you write them.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Name for this project, 2-5 words, e.g. 'Lagos Rooftop Party Flyer'." },
        background: { type: "string", description: "CSS colour or gradient behind all layers." },
        grain: { type: "number", description: "Film grain 0-1. Omit for none." },
        layers: { type: "array", items: layerSchema },
      },
      required: ["background", "layers"],
    },
  },
  {
    name: "patch_design",
    description:
      "Change the current design in place. Operations run in order. update merges props into a layer (set a prop to null to remove it). add inserts a new layer on top, or below the layer named in `before`. reorder moves a layer below the layer named in `before`, or to the top when `before` is omitted.",
    input_schema: {
      type: "object",
      properties: {
        background: { type: "string" },
        grain: { type: "number" },
        ops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              op: { type: "string", enum: ["update", "add", "remove", "reorder"] },
              id: { type: "string", description: "update, remove, reorder: the layer id." },
              props: { type: "object", description: "update: properties to change." },
              layer: layerSchema,
              before: { type: "string", description: "add, reorder: id of the layer that should end up directly above." },
            },
            required: ["op"],
          },
        },
      },
      required: ["ops"],
    },
  },
];

export const DESIGN_TOOLS = new Set(["render_design", "patch_design"]);

export const TOOL_STATUS: Record<string, string> = {
  generate_image: "Creating imagery",
  remove_background: "Cutting out the subject",
  search_fonts: "Choosing type",
  render_design: "Composing the layout",
  patch_design: "Updating the design",
};
