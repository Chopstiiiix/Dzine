import Anthropic from "@anthropic-ai/sdk";
import { parse as parsePartialJson } from "partial-json";
import { serverConfig } from "@/lib/config";
import { applyPatch, normalizeDesign } from "@/lib/design/normalize";
import type { Asset, Design } from "@/lib/design/types";
import { IMAGE_ASPECTS, type Ratio } from "@/lib/ratios";
import type { ChatMessage, Pending, Project, Store } from "@/lib/store/types";
import { describeFont, searchFonts } from "@/lib/fonts";
import { referenceBlock } from "./examples";
import { TREATMENTS, treatmentBlock, treatmentMenu } from "./type-treatments";
import { generateImage, removeBackground } from "./images";
import { findLinks, imageFromLink } from "./links";
import { SYSTEM_PROMPT, TEMPLATE_MODE_PROMPT, contextBlock } from "./prompt";
import { COMPOSE_TOOL, DESIGN_TOOLS, TOOLS, TOOL_STATUS } from "./tools";
import { type ComposeInput, composeDesign } from "@/lib/design/compose";

type MessageParam = Anthropic.MessageParam;
type Block = Anthropic.ContentBlockParam;
type ToolResult = Anthropic.ToolResultBlockParam;
type ResultContent = Exclude<ToolResult["content"], string | undefined>;

/** Everything the browser hears about while the agent works. One JSON object per line. */
export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "status"; text: string | null }
  | { type: "design"; design: Design; partial?: boolean }
  | { type: "asset"; asset: Asset }
  | { type: "title"; title: string }
  /** The turn is paused: send back a preview of the canvas to continue. */
  | { type: "review" }
  | { type: "credits"; credits: number }
  | { type: "done"; message: ChatMessage | null }
  | { type: "error"; message: string };

export type AgentInput =
  | { kind: "user"; text: string; attachmentIds: string[]; /** Typography treatment the user picked. */ style?: string }
  /** `image` is a JPEG data URL of the rendered canvas, or null if the capture failed. */
  | { kind: "review"; image: string | null };

export type AgentRun = {
  store: Store;
  project: Project;
  ratio: Ratio;
  input: AgentInput;
  emit: (e: AgentEvent) => void;
  /** Set to true once the turn has produced something worth paying for. */
  progress: { produced: boolean };
};

const REVIEW_BRIEF =
  "This is the actual render of the canvas. Review it as an art director: text that is cramped, clipped, overlapping or too small; weak contrast; unclear hierarchy; untidy margins or alignment; a face or key subject covered or badly cropped; anything that misses the brief or the reference. Fix real problems with patch_design. If it already works, reply to the user and stop. Never mention this review.";

const MAX_STEPS = 10;
const MAX_HISTORY = 40;

/** Keeps the most recent messages, cutting only at a plain user message so tool calls stay paired. */
function trimHistory(history: MessageParam[]): MessageParam[] {
  if (history.length <= MAX_HISTORY) return history;
  for (let i = history.length - MAX_HISTORY; i < history.length; i++) {
    const m = history[i];
    const plain = m.role === "user" && (typeof m.content === "string" || !m.content.some((b) => b.type === "tool_result"));
    if (plain) return history.slice(i);
  }
  return history;
}

async function imageBlock(store: Store, asset: Asset): Promise<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
  if (asset.mime === "image/svg+xml") return { type: "text", text: "(vector placeholder, not viewable)" };
  if (!store.demo && /^https?:\/\//.test(asset.url)) {
    return { type: "image", source: { type: "url", url: asset.url } };
  }
  const raw = await store.getAssetData(asset.id);
  if (!raw) return { type: "text", text: "(image unavailable)" };
  return {
    type: "image",
    source: { type: "base64", media_type: raw.mime as "image/jpeg" | "image/png" | "image/webp", data: raw.data.toString("base64") },
  };
}

/** Turns a paused turn into the tool results the model is waiting for. */
function resolvePending(pending: Pending, image: string | null): { blocks: ToolResult[]; review: ToolResult } {
  const match = image?.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  const content: ResultContent = match
    ? [
        { type: "text", text: `${pending.reviewNote}\n\n${REVIEW_BRIEF}` },
        { type: "image", source: { type: "base64", media_type: `image/${match[1]}` as "image/jpeg", data: match[2] } },
      ]
    : [{ type: "text", text: `${pending.reviewNote} (No preview was available this time.)` }];
  const review: ToolResult = { type: "tool_result", tool_use_id: pending.reviewToolUseId, content };
  return { blocks: [...(pending.toolResults as ToolResult[]), review], review };
}

export async function runAgent(run: AgentRun): Promise<void> {
  const { store, project, ratio, input, emit, progress } = run;
  const client = new Anthropic();

  const assets = await store.listAssets(project.id);
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const addAsset = (a: Asset) => {
    assets.push(a);
    assetById.set(a.id, a);
    emit({ type: "asset", asset: a });
  };

  // The style picked for this turn; a review pass inherits it from the paused turn.
  const pickedStyle = input.kind === "user" ? input.style : project.pending?.style;
  let design = project.design;
  let title = project.title;
  const history = [...(project.history as MessageParam[])];
  let imagesUsed = 0;
  let reviewsLeft = serverConfig.reviewPasses;
  let assistantText = "";
  /** Preview images are only useful once: they are swapped for a note before the history is saved. */
  const reviewBlocks: ToolResult[] = [];

  // ------------------------------------------------------------ incoming message

  if (input.kind === "review") {
    if (!project.pending) {
      emit({ type: "done", message: null });
      return;
    }
    const { blocks, review } = resolvePending(project.pending, input.image);
    reviewBlocks.push(review);
    history.push({ role: "user", content: blocks });
    imagesUsed = project.pending.imagesUsed;
    reviewsLeft = project.pending.reviewsLeft;
    assistantText = project.pending.assistantText;
  } else {
    const content: Block[] = [];
    // A previous turn was left waiting for a preview that never came: close it off first.
    if (project.pending) content.push(...resolvePending(project.pending, null).blocks);
    for (const id of input.attachmentIds) {
      const a = assetById.get(id);
      if (!a) continue;
      const size = a.width && a.height ? `, ${a.width}x${a.height}px` : "";
      content.push({ type: "text", text: `Attached asset ${a.id} (label: ${a.label}, file: "${a.name}"${size}):` });
      content.push(await imageBlock(store, a));
    }
    for (const link of findLinks(input.text)) {
      try {
        const img = await imageFromLink(link);
        const a = await store.addAsset(project.id, {
          kind: "upload",
          label: "reference",
          name: new URL(link).hostname.replace(/^www\./, "").slice(0, 80),
          ...img,
        });
        addAsset(a);
        content.push({ type: "text", text: `Reference image from the link ${link} (asset ${a.id}, label: reference):` });
        content.push(await imageBlock(store, a));
      } catch (err) {
        const why = err instanceof Error ? err.message : "unknown error";
        content.push({ type: "text", text: `Could not read the link ${link}: ${why} Ask the user to upload the image instead if it matters.` });
      }
    }
    content.push({ type: "text", text: input.text || "(see attachments)" });
    const picked = input.style && TREATMENTS.find((t) => t.id === input.style);
    if (picked) content.push({ type: "text", text: `(The user picked the "${picked.name}" text style (${picked.id}) in the style picker. Use it.)` });
    history.push({ role: "user", content });
  }

  // Layouts to learn from, picked once per turn from the user's own words.
  // Template mode lists every treatment by name (the engine places them); free mode shows the closest few
  // as layers to adapt, plus the nearest professional layouts.
  const references =
    input.kind !== "user"
      ? ""
      : serverConfig.templateMode
        ? treatmentMenu(input.text, input.style)
        : [treatmentBlock(input.text, ratio, input.style), await referenceBlock(input.text, ratio)].filter(Boolean).join("\n\n");
  const tools = serverConfig.templateMode
    ? [...TOOLS.filter((t) => t.name === "generate_image" || t.name === "search_fonts"), COMPOSE_TOOL]
    : TOOLS;

  const finish = (text: string) => text.replace(/\n{3,}/g, "\n\n").trim();

  const save = async (pending: Pending | null) => {
    for (const r of reviewBlocks) r.content = [{ type: "text", text: "Design rendered. (Preview reviewed.)" }];
    await store.updateProject(project.id, { design, history: trimHistory(history), pending, title });
  };

  // ------------------------------------------------------------ tools

  const ok = (id: string, content: ResultContent): ToolResult => ({ type: "tool_result", tool_use_id: id, content });
  const fail = (id: string, message: string): ToolResult => ({
    type: "tool_result",
    tool_use_id: id,
    content: [{ type: "text", text: message }],
    is_error: true,
  });

  async function execTool(use: Anthropic.ToolUseBlock): Promise<{ result: ToolResult; designNote?: string }> {
    const args = (use.input ?? {}) as Record<string, unknown>;
    try {
      if (use.name === "generate_image") {
        if (imagesUsed >= serverConfig.maxImagesPerTurn) {
          return { result: fail(use.id, "Image budget for this turn is used up. Work with the assets you already have.") };
        }
        imagesUsed += 1;
        const prompt = String(args.prompt ?? "").slice(0, 4000);
        if (!prompt) return { result: fail(use.id, "prompt is required.") };
        const aspect = (IMAGE_ASPECTS as readonly string[]).includes(String(args.aspect_ratio)) ? String(args.aspect_ratio) : ratio.imageAspect;
        const sourceIds = Array.isArray(args.source_asset_ids) ? args.source_asset_ids.map(String) : [];
        const sources = sourceIds.map((id) => assetById.get(id)).filter((a): a is Asset => !!a);
        if (sources.length !== sourceIds.length) {
          imagesUsed -= 1;
          return { result: fail(use.id, `Unknown source asset id. Valid ids: ${[...assetById.keys()].join(", ") || "none"}.`) };
        }
        const img = await generateImage({ store, prompt, aspect, sources });
        const asset = await store.addAsset(project.id, {
          kind: "generated",
          label: "generated",
          name: String(args.name ?? "AI image").slice(0, 80),
          mime: img.mime,
          width: img.width,
          height: img.height,
          data: img.data,
        });
        addAsset(asset);
        progress.produced = true;
        const note = img.placeholder
          ? `Created asset ${asset.id}. Image generation is not configured, so this is a plain gradient placeholder: design around it.`
          : `Created asset ${asset.id} (${asset.width}x${asset.height}). This is the image:`;
        return { result: ok(use.id, [{ type: "text", text: note }, await imageBlock(store, asset)]) };
      }

      if (use.name === "search_fonts") {
        const found = searchFonts(String(args.query ?? ""), typeof args.category === "string" ? args.category : undefined);
        const text = found.length
          ? `Fonts matching "${args.query}":\n${found.map(describeFont).join("\n")}`
          : `No fonts match "${args.query}". Try broader words (e.g. 'handwritten', 'vintage', 'bold').`;
        return { result: ok(use.id, [{ type: "text", text }]) };
      }

      if (use.name === "remove_background") {
        const source = assetById.get(String(args.asset_id));
        if (!source) return { result: fail(use.id, `Unknown asset id "${args.asset_id}".`) };
        const img = await removeBackground(store, source);
        const asset = await store.addAsset(project.id, {
          kind: "cutout",
          label: source.label === "logo" ? "logo" : "cutout",
          name: `${source.name} (cutout)`.slice(0, 80),
          mime: img.mime,
          width: img.width,
          height: img.height,
          data: img.data,
        });
        addAsset(asset);
        progress.produced = true;
        const note = img.placeholder
          ? `Created asset ${asset.id}. Background removal is not configured, so this is the original image unchanged.`
          : `Created cutout asset ${asset.id} (${asset.width}x${asset.height}, transparent background):`;
        return { result: ok(use.id, [{ type: "text", text: note }, await imageBlock(store, asset)]) };
      }

      if (use.name === "render_design" || use.name === "patch_design" || use.name === "compose_design") {
        const ids = new Set(assetById.keys());
        let next: { design: Design; warnings: string[] };
        if (use.name === "compose_design") {
          // A style picked in the picker wins over the model's choice.
          const composed = composeDesign({ ...(args as ComposeInput), ...(pickedStyle ? { treatment: pickedStyle } : {}) }, ratio);
          next = normalizeDesign(composed.design, ratio, ids);
          next.warnings.unshift(...composed.notes);
          if (typeof args.title === "string" && args.title.trim() && (title === "Untitled design" || !title)) {
            title = args.title.trim().slice(0, 60);
            emit({ type: "title", title });
          }
        } else if (use.name === "render_design") {
          next = normalizeDesign(args, ratio, ids);
          if (!next.design.layers.length) {
            return { result: fail(use.id, `No valid layers. ${next.warnings.join(" ")}`) };
          }
          if (typeof args.title === "string" && args.title.trim() && (title === "Untitled design" || !title)) {
            title = args.title.trim().slice(0, 60);
            emit({ type: "title", title });
          }
        } else {
          if (!design) return { result: fail(use.id, "The canvas is empty. Use render_design first.") };
          next = applyPatch(design, args, ratio, ids);
        }
        design = next.design;
        emit({ type: "design", design });
        progress.produced = true;
        const note =
          `Design on canvas: ${design.layers.length} layers.` +
          (next.warnings.length ? ` Warnings: ${next.warnings.join(" ")}` : "");
        return { result: ok(use.id, [{ type: "text", text: note }]), designNote: note };
      }

      return { result: fail(use.id, `Unknown tool "${use.name}".`) };
    } catch (err) {
      console.error(`[dzine] tool ${use.name} failed`, err);
      if (use.name === "generate_image") imagesUsed = Math.max(0, imagesUsed - 1);
      const message = err instanceof Error ? err.message : "Unknown error";
      return { result: fail(use.id, `${use.name} failed: ${message}`) };
    }
  }

  // ------------------------------------------------------------ the loop

  for (let step = 0; step < MAX_STEPS; step++) {
    const stream = client.messages.stream({
      model: serverConfig.agentModel,
      max_tokens: 24000,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ...(serverConfig.templateMode ? [{ type: "text" as const, text: TEMPLATE_MODE_PROMPT }] : []),
        {
          type: "text",
          text: contextBlock({ ratio, assets, design, imagesLeft: Math.max(0, serverConfig.maxImagesPerTurn - imagesUsed) }),
        },
        ...(references ? [{ type: "text" as const, text: references }] : []),
      ],
      tools,
      messages: trimHistory(history),
      ...(serverConfig.thinking ? { thinking: { type: "adaptive" as const, display: "omitted" as const } } : {}),
    });

    const live = new Map<number, { name: string; json: string; layers: number; at: number }>();
    const ids = new Set(assetById.keys());

    for await (const ev of stream) {
      if (ev.type === "content_block_start") {
        if (ev.content_block.type === "tool_use") {
          live.set(ev.index, { name: ev.content_block.name, json: "", layers: -1, at: 0 });
          emit({ type: "status", text: TOOL_STATUS[ev.content_block.name] ?? "Working" });
        } else if (ev.content_block.type === "text" && assistantText && !assistantText.endsWith("\n")) {
          assistantText += "\n\n";
          emit({ type: "text", delta: "\n\n" });
        }
      } else if (ev.type === "content_block_delta") {
        if (ev.delta.type === "text_delta") {
          assistantText += ev.delta.text;
          emit({ type: "text", delta: ev.delta.text });
        } else if (ev.delta.type === "input_json_delta") {
          const b = live.get(ev.index);
          if (b?.name !== "render_design") continue;
          b.json += ev.delta.partial_json;
          const now = Date.now();
          if (now - b.at < 120) continue;
          b.at = now;
          try {
            // Show layers as the model writes them.
            const partial = normalizeDesign(parsePartialJson(b.json), ratio, ids, { partial: true }).design;
            if (partial.layers.length !== b.layers) {
              b.layers = partial.layers.length;
              emit({ type: "design", design: partial, partial: true });
            }
          } catch {
            // Not parseable yet.
          }
        }
      }
    }

    const message = await stream.finalMessage();
    if (message.stop_reason !== "tool_use") {
      // A cut-off reply can end in a half-written tool call, which must not enter the history.
      const kept = message.content.filter((b) => b.type !== "tool_use");
      if (kept.length) history.push({ role: "assistant", content: kept as Block[] });
      else history.push({ role: "assistant", content: [{ type: "text", text: assistantText || "(no reply)" }] });
      break;
    }
    history.push({ role: "assistant", content: message.content as Block[] });

    const uses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const outcomes = await Promise.all(uses.map(execTool));
    emit({ type: "status", text: null });

    // Pause on the last successful design change so the model can look at the real render.
    let reviewAt = -1;
    outcomes.forEach((o, i) => {
      if (o.designNote && DESIGN_TOOLS.has(uses[i].name)) reviewAt = i;
    });

    if (reviewAt >= 0 && reviewsLeft > 0) {
      await save({
        toolResults: outcomes.filter((_, i) => i !== reviewAt).map((o) => o.result),
        reviewToolUseId: uses[reviewAt].id,
        reviewNote: outcomes[reviewAt].designNote!,
        reviewsLeft: reviewsLeft - 1,
        imagesUsed,
        assistantText,
        style: pickedStyle,
      });
      emit({ type: "status", text: "Checking the details" });
      emit({ type: "review" });
      return;
    }

    history.push({ role: "user", content: outcomes.map((o) => o.result) });
  }

  // ------------------------------------------------------------ wrap up

  await save(null);
  const text = finish(assistantText);
  const saved = text ? await store.addMessage(project.id, { role: "assistant", content: text, attachments: [] }) : null;
  emit({ type: "status", text: null });
  emit({ type: "done", message: saved });
}
