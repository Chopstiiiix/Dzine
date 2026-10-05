// Runs the agent on any OpenAI-compatible chat API (NVIDIA, OpenRouter, vLLM...) by translating
// Anthropic request params in and Anthropic stream events out, so the agent loop stays unchanged.
// Tries each model in turn and moves on when one errors or sits in a queue, then falls back to the
// Anthropic client (Ollama locally) if none answers.
import type Anthropic from "@anthropic-ai/sdk";
import type { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { randomUUID } from "node:crypto";

type Params = Anthropic.MessageStreamParams;
type Msg = Record<string, unknown>;
export type LlmConfig = { baseUrl: string; keys: string[]; models: string[]; waitMs: number };

// ponytail: guessed from the model name; add a per-model setting if a provider names things differently.
const SEES_IMAGES = /kimi|gemma|vision|vl\b/i;
const NO_IMAGE = { type: "text", text: "(image attached, but this model cannot view images)" };

let nextKey = 0;

function imagePart(b: Anthropic.ImageBlockParam, vision: boolean) {
  if (!vision) return NO_IMAGE;
  const s = b.source;
  const url = s.type === "base64" ? `data:${s.media_type};base64,${s.data}` : s.type === "url" ? s.url : "";
  return { type: "image_url", image_url: { url } };
}

function toOpenAI(params: Params, vision: boolean): Msg[] {
  const system = typeof params.system === "string" ? params.system : (params.system ?? []).map((b) => b.text).join("\n\n");
  const out: Msg[] = system ? [{ role: "system", content: system }] : [];
  for (const m of params.messages) {
    const blocks = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : m.content;
    if (m.role === "assistant") {
      const text = blocks.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      const calls = blocks.flatMap((b) =>
        b.type === "tool_use" ? [{ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } }] : [],
      );
      out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
      continue;
    }
    // Tool results become `tool` messages. They only carry text, so their images follow in a user message.
    const parts: Msg[] = [];
    for (const b of blocks) {
      if (b.type === "tool_result") {
        const content = typeof b.content === "string" ? [{ type: "text" as const, text: b.content }] : (b.content ?? []);
        const text = content.flatMap((c) => (c.type === "text" ? [c.text] : [])).join("\n");
        out.push({ role: "tool", tool_call_id: b.tool_use_id, content: (b.is_error ? "Error: " : "") + (text || "(done)") });
        for (const c of content) if (c.type === "image") parts.push(imagePart(c, vision));
      } else if (b.type === "text") parts.push({ type: "text", text: b.text });
      else if (b.type === "image") parts.push(imagePart(b, vision));
    }
    if (parts.length) out.push({ role: "user", content: parts });
  }
  return out;
}

/** Opens a stream and waits for its first bytes. Null when the model errors or stays queued past `waitMs`. */
async function connect(params: Params, cfg: LlmConfig, model: string) {
  const key = cfg.keys[nextKey++ % cfg.keys.length];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.waitMs);
  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        model,
        messages: toOpenAI(params, SEES_IMAGES.test(model)),
        tools: params.tools?.map((t) => {
          const tool = t as Anthropic.Tool;
          return { type: "function", function: { name: tool.name, description: tool.description, parameters: tool.input_schema } };
        }),
        // ponytail: 16k is NVIDIA's cap; make it configurable if another provider needs more.
        max_tokens: Math.min(params.max_tokens, 16384),
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      console.warn(`[dzine] ${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const reader = res.body.getReader();
    const first = await reader.read();
    if (first.done) return null;
    // A busy model can answer 200 and then send only an error ("Service temporarily overloaded").
    const head = new TextDecoder().decode(first.value);
    if (/^data:\s*\{"error"/m.test(head) && !head.includes('"choices"')) {
      console.warn(`[dzine] ${model}: ${head.slice(0, 200)}`);
      void reader.cancel();
      return null;
    }
    return { reader, first: first.value };
  } catch (err) {
    console.warn(`[dzine] ${model}: ${ctrl.signal.aborted ? `no answer in ${cfg.waitMs / 1000}s` : String(err)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Same shape as `client.messages.stream(params)`, as far as the agent loop uses it. */
export function openaiStream(params: Params, cfg: LlmConfig, fallback: () => MessageStream) {
  const content: Anthropic.ContentBlock[] = [];
  let stopReason: Anthropic.StopReason = "end_turn";
  let fellBack: MessageStream | null = null;
  let finished!: () => void;
  const done = new Promise<void>((r) => (finished = r));

  async function* events(): AsyncGenerator<Anthropic.MessageStreamEvent> {
    try {
      let conn = null;
      for (const model of cfg.models) if ((conn = await connect(params, cfg, model))) break;
      if (!conn) {
        console.warn("[dzine] no hosted model answered, using the fallback model");
        fellBack = fallback();
        yield* fellBack;
        return;
      }

      let text: Anthropic.TextBlock | null = null;
      const calls = new Map<number, { block: Anthropic.ToolUseBlock; index: number; json: string }>();
      const decoder = new TextDecoder();
      let buffer = "";
      for (let chunk: Uint8Array | undefined = conn.first; chunk; chunk = (await conn.reader.read()).value) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!data || data === "[DONE]") continue;
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(`Model API: ${JSON.stringify(parsed.error).slice(0, 300)}`);
          const choice = parsed.choices?.[0];
          if (!choice) continue;
          const d = choice.delta ?? {};
          if (d.content) {
            if (!text) {
              text = { type: "text", text: "", citations: null };
              content.push(text);
              yield { type: "content_block_start", index: content.length - 1, content_block: { ...text } };
            }
            text.text += d.content;
            yield { type: "content_block_delta", index: content.indexOf(text), delta: { type: "text_delta", text: d.content } };
          }
          for (const tc of d.tool_calls ?? []) {
            let call = calls.get(tc.index ?? 0);
            if (!call) {
              // Our own ids: providers reuse theirs across steps, and Anthropic rejects some formats.
              const block = { type: "tool_use", id: `toolu_${randomUUID().replace(/-/g, "")}`, name: tc.function?.name ?? "", input: {} } as Anthropic.ToolUseBlock;
              content.push(block);
              call = { block, index: content.length - 1, json: "" };
              calls.set(tc.index ?? 0, call);
              text = null;
              yield { type: "content_block_start", index: call.index, content_block: { ...block } };
            }
            if (tc.function?.name && !call.block.name) call.block.name = tc.function.name;
            if (tc.function?.arguments) {
              call.json += tc.function.arguments;
              yield { type: "content_block_delta", index: call.index, delta: { type: "input_json_delta", partial_json: tc.function.arguments } };
            }
          }
          if (choice.finish_reason === "length") stopReason = "max_tokens";
        }
      }
      for (const c of calls.values()) {
        try {
          c.block.input = c.json ? JSON.parse(c.json) : {};
        } catch {
          c.block.input = {};
          stopReason = "max_tokens"; // half-written call: the loop drops it
        }
      }
      if (calls.size && stopReason !== "max_tokens") stopReason = "tool_use";
    } finally {
      finished();
    }
  }

  return {
    [Symbol.asyncIterator]: events,
    async finalMessage(): Promise<Pick<Anthropic.Message, "content" | "stop_reason">> {
      await done;
      return fellBack ? await (fellBack as MessageStream).finalMessage() : { content, stop_reason: stopReason };
    },
  };
}
