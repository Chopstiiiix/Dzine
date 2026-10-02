"use client";

import { ArrowUp, Paperclip, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Asset } from "@/lib/design/types";
import type { ChatMessage } from "@/lib/store/types";

export type Attachment = { key: string; file: File; preview: string; label: "photo" | "logo" | "reference" };

const LABELS: { id: Attachment["label"]; text: string; hint: string }[] = [
  { id: "photo", text: "Photo", hint: "Goes in the design" },
  { id: "logo", text: "Logo", hint: "Placed exactly as it is" },
  { id: "reference", text: "Reference", hint: "A style to follow" },
];

const IDEAS = [
  "Cover art for my single “Midnight in Lagos”: moody, neon, cinematic",
  "A flyer for a rooftop day party, Saturday 14 June, 2pm till late",
  "A minimalist birthday card for my mum, warm and elegant",
  "A gig poster in the style of the reference I'm attaching",
];

function guessLabel(file: File): Attachment["label"] {
  return /logo|brand|mark|icon/i.test(file.name) ? "logo" : /ref|inspo|inspiration|moodboard|style/i.test(file.name) ? "reference" : "photo";
}

export function ChatPanel({
  messages,
  assets,
  draft,
  status,
  busy,
  error,
  credits,
  onSend,
}: {
  messages: ChatMessage[];
  assets: Asset[];
  /** The assistant reply that is streaming in right now. */
  draft: string;
  status: string | null;
  busy: boolean;
  error: string | null;
  credits: number | null;
  /** Resolves to true when the message was accepted and the composer should clear. */
  onSend: (text: string, attachments: Attachment[]) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const assetById = new Map(assets.map((a) => [a.id, a]));

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, draft, status, error]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const addFiles = (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setAttachments((prev) =>
      [
        ...prev,
        ...images.map((file) => ({
          key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          preview: URL.createObjectURL(file),
          label: guessLabel(file),
        })),
      ].slice(0, 8),
    );
  };

  const submit = async () => {
    const value = text.trim();
    if (busy || (!value && !attachments.length)) return;
    const accepted = await onSend(value, attachments);
    if (accepted) {
      setText("");
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
      setAttachments([]);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const empty = !messages.length && !draft && !busy;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div ref={scroller} className="dz-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {empty ? (
          <div className="flex min-h-full flex-col justify-end pb-1">
            <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.025em]">What are we making?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Tell me what it&apos;s for and what it should say. Add your photos and logos, and drop in a reference if you have a look in mind.
            </p>
            <div className="mt-5 flex flex-col gap-1.5">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => {
                    setText(idea);
                    input.current?.focus();
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-left text-[13px] leading-snug text-muted transition hover:border-faint hover:text-ink"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col items-end gap-1.5">
                  {m.attachments.length ? (
                    <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
                      {m.attachments.map((id) => {
                        const a = assetById.get(id);
                        return a ? (
                          <span key={id} className="relative block h-16 w-16 overflow-hidden rounded-lg border border-line bg-[#8f8e88]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-px text-center text-[9.5px] font-medium uppercase tracking-wide text-white">
                              {a.label}
                            </span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                  {m.content ? (
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[14px] leading-relaxed">
                      {m.content}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div key={m.id} className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                  {m.content}
                </div>
              ),
            )}

            {draft ? <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{draft}</div> : null}

            {busy ? (
              <div className="flex items-center gap-2 text-[13px] text-muted" role="status" aria-live="polite">
                <span className="dz-dot" />
                {status ?? "Thinking"}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-line bg-soft px-3 py-2.5 text-[13px] leading-relaxed text-danger" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-line p-3">
        {attachments.length ? (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div key={a.key} className="flex items-center gap-2 rounded-xl border border-line bg-panel p-1.5 pr-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.preview} alt="" className="h-11 w-11 rounded-lg bg-[#8f8e88] object-cover" />
                <div className="flex flex-col gap-1">
                  <div className="inline-flex rounded-md bg-soft p-0.5" role="radiogroup" aria-label="What is this image?">
                    {LABELS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        aria-checked={a.label === l.id}
                        title={l.hint}
                        onClick={() => setAttachments((prev) => prev.map((x) => (x.key === a.key ? { ...x, label: l.id } : x)))}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
                          a.label === l.id ? "bg-panel text-ink shadow-sm" : "text-muted hover:text-ink"
                        }`}
                      >
                        {l.text}
                      </button>
                    ))}
                  </div>
                  <span className="max-w-[150px] truncate text-[11px] text-faint">{a.file.name}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${a.file.name}`}
                  onClick={() => {
                    URL.revokeObjectURL(a.preview);
                    setAttachments((prev) => prev.filter((x) => x.key !== a.key));
                  }}
                  className="rounded p-1 text-faint hover:bg-soft hover:text-ink"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-panel p-1.5 transition focus-within:border-faint">
          <input
            ref={picker}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple
            hidden
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Add photos, logos or a reference"
            title="Add photos, logos or a reference"
            onClick={() => picker.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-soft hover:text-ink"
          >
            <Paperclip size={17} />
          </button>
          <textarea
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onPaste={(e) => {
              if (e.clipboardData.files.length) addFiles(e.clipboardData.files);
            }}
            placeholder={messages.length ? "Ask for a change…" : "Describe your design…"}
            aria-label="Message Dzine"
            className="max-h-[180px] min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-snug outline-none placeholder:text-faint"
          />
          <button
            type="button"
            aria-label="Send"
            disabled={busy || (!text.trim() && !attachments.length)}
            onClick={() => void submit()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-bg transition disabled:opacity-25"
          >
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="mt-2 px-1 text-[11.5px] text-faint">
          {credits === null ? " " : credits > 0 ? `Each generation uses 1 credit. You have ${credits}.` : "You're out of credits."}
        </p>
      </div>

      {dragging ? (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-panel/90 text-[14px] font-medium">
          Drop images to attach
        </div>
      ) : null}
    </div>
  );
}
