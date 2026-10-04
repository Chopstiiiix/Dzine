"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent/run";
import { download, renderPng, renderPreview } from "@/lib/client/export";
import { prepareImage } from "@/lib/client/upload";
import type { Asset, Design, Layer, TextLayer } from "@/lib/design/types";
import { type Ratio, getRatio } from "@/lib/ratios";
import type { ChatMessage } from "@/lib/store/types";
import { type Attachment, ChatPanel } from "./ChatPanel";
import { PaintingLoader } from "./PaintingLoader";
import type { Style } from "./StylePicker";
import { DesignCanvas } from "./DesignCanvas";
import { Logo } from "./Logo";
import { type Account, Paywall } from "./Paywall";
import { RatioPicker } from "./RatioPicker";

async function* readEvents(res: Response): AsyncGenerator<AgentEvent> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line) as AgentEvent;
      } catch {
        // Ignore a malformed line rather than dropping the stream.
      }
    }
    if (done) return;
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dzine";

export function Studio({ projectId }: { projectId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [title, setTitle] = useState("Untitled design");
  const [ratio, setRatio] = useState<Ratio>(getRatio(null));
  const [design, setDesign] = useState<Design | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [account, setAccount] = useState<Account | null>(null);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  // ponytail: the picked style lives for this session only; store it on the project if users expect it to stick.
  const [style, setStyle] = useState<Style | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nodeRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<Design | null>(null);
  useLayoutEffect(() => {
    designRef.current = design;
  }, [design]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const credits = account?.credits ?? null;
  const setCredits = useCallback((n: number) => setAccount((a) => (a ? { ...a, credits: n } : a)), []);

  // ---------------------------------------------------------------- load

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, me] = await Promise.all([fetch(`/api/projects/${projectId}`), fetch("/api/me")]);
      if (!alive) return;
      if (!p.ok) return setMissing(true);
      const data = await p.json();
      setTitle(data.project.title);
      setRatio(getRatio(data.project.ratio));
      setDesign(data.project.design);
      setAssets(data.assets);
      setMessages(data.messages);
      if (me.ok) setAccount(await me.json());
      setLoaded(true);

      const paid = new URLSearchParams(window.location.search).get("paid");
      if (paid) {
        setNotice(paid === "1" ? "Payment received. Your credits are ready." : "That payment did not go through. You have not been charged.");
        window.history.replaceState(null, "", window.location.pathname);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  // ---------------------------------------------------------------- saving

  const patchProject = useCallback(
    (body: Record<string, unknown>) =>
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null),
    [projectId],
  );

  const saveThumb = useCallback(async () => {
    const node = nodeRef.current;
    const d = designRef.current;
    if (!node || !d) return;
    try {
      const thumb = await renderPreview(node, d, 360, 0.72);
      await patchProject({ thumb });
    } catch {
      // A missing thumbnail is not worth interrupting anyone for.
    }
  }, [patchProject]);

  const editDesign = useCallback(
    (next: Design, commit: boolean) => {
      setDesign(next);
      if (!commit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void patchProject({ design: next }), 500);
    },
    [patchProject],
  );

  // ---------------------------------------------------------------- agent turns

  const consume = async (res: Response): Promise<boolean> => {
    let wantsReview = false;
    for await (const ev of readEvents(res)) {
      switch (ev.type) {
        case "text":
          setDraft((d) => d + ev.delta);
          break;
        case "status":
          setStatus(ev.text);
          break;
        case "design":
          setDesign(ev.design);
          break;
        case "asset":
          setAssets((a) => (a.some((x) => x.id === ev.asset.id) ? a : [...a, ev.asset]));
          break;
        case "title":
          setTitle(ev.title);
          break;
        case "credits":
          setCredits(ev.credits);
          break;
        case "review":
          wantsReview = true;
          break;
        case "done":
          if (ev.message) setMessages((m) => [...m, ev.message!]);
          setDraft("");
          break;
        case "error":
          setDraft("");
          setError(ev.message);
          break;
      }
    }
    return wantsReview;
  };

  const post = (body: Record<string, unknown>) =>
    fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...body }),
    });

  /** Runs one agent turn. `onAccepted` fires as soon as the server takes (or refuses) the message. */
  const runTurn = async (body: Record<string, unknown>, onAccepted: (accepted: boolean) => void): Promise<void> => {
    setBusy(true);
    setError(null);
    setStatus(null);
    setSelectedId(null);
    try {
      let res = await post(body);
      if (res.status === 402) {
        setPaywall(true);
        onAccepted(false);
        return;
      }
      if (!res.ok || !res.body) {
        const refusal = await res.json().catch(() => null);
        setError(typeof refusal?.error === "string" ? refusal.error : "Something went wrong. Please try again.");
        onAccepted(false);
        return;
      }
      onAccepted(true);

      // The agent may pause to look at the real render. Send it a snapshot and carry on.
      for (let pass = 0; pass < 4; pass++) {
        const wantsReview = await consume(res);
        if (!wantsReview) break;
        await new Promise((r) => setTimeout(r, 350));
        let image: string | null = null;
        try {
          if (nodeRef.current && designRef.current) image = await renderPreview(nodeRef.current, designRef.current, 900, 0.82);
        } catch {
          image = null;
        }
        res = await post({ review: { image } });
        if (!res.ok || !res.body) throw new Error("request_failed");
      }
    } catch {
      setDraft("");
      setError("The connection dropped while designing. Reload the page to see the latest version.");
      onAccepted(true);
    } finally {
      setBusy(false);
      setStatus(null);
      setTimeout(() => void saveThumb(), 600);
    }
  };

  const send = async (text: string, attachments: Attachment[]): Promise<boolean> => {
    if (credits !== null && credits <= 0) {
      setPaywall(true);
      return false;
    }
    setError(null);

    const uploaded: Asset[] = [];
    if (attachments.length) {
      setBusy(true);
      setStatus(attachments.length > 1 ? "Uploading your images" : "Uploading your image");
      try {
        for (const a of attachments) {
          const { blob } = await prepareImage(a.file);
          const form = new FormData();
          form.append("file", blob, a.file.name);
          form.append("projectId", projectId);
          form.append("label", a.label);
          form.append("name", a.file.name);
          const res = await fetch("/api/assets", { method: "POST", body: form });
          const body = await res.json();
          if (!res.ok) throw new Error(body.error || "Upload failed.");
          uploaded.push(body.asset);
        }
      } catch (err) {
        setBusy(false);
        setStatus(null);
        setError(err instanceof Error ? err.message : "Upload failed.");
        return false;
      }
      setAssets((a) => [...a, ...uploaded]);
    }

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      attachments: uploaded.map((a) => a.id),
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    return new Promise<boolean>((resolve) => {
      void runTurn({ text, attachmentIds: optimistic.attachments, ratio: ratio.id, style: style?.id }, (accepted) => {
        if (!accepted) setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        resolve(accepted);
      });
    });
  };

  const pickRatio = (next: Ratio) => {
    if (!design) {
      setRatio(next);
      void patchProject({ ratio: next.id });
      return;
    }
    if (credits !== null && credits <= 0) return setPaywall(true);
    const text = `Resize this design for ${next.label} (${next.w} × ${next.h}px). Keep the concept and all of the content, and re-compose the layout for the new proportions.`;
    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text, attachments: [], createdAt: new Date().toISOString() };
    const previous = ratio;
    setRatio(next);
    setMessages((m) => [...m, optimistic]);
    void runTurn({ text, attachmentIds: [], ratio: next.id, style: style?.id }, (accepted) => {
      if (!accepted) {
        setRatio(previous);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      }
    });
  };

  // ---------------------------------------------------------------- manual edits

  const selected = design?.layers.find((l) => l.id === selectedId) ?? null;

  const updateLayer = (id: string, props: Partial<Layer>, commit = true) => {
    const d = designRef.current;
    if (!d) return;
    editDesign({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...props } as Layer) : l)) }, commit);
  };

  const removeLayer = (id: string) => {
    const d = designRef.current;
    if (!d) return;
    editDesign({ ...d, layers: d.layers.filter((l) => l.id !== id) }, true);
    setSelectedId(null);
  };

  const shiftLayer = (id: string, dir: 1 | -1) => {
    const d = designRef.current;
    if (!d) return;
    const i = d.layers.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= d.layers.length) return;
    const layers = [...d.layers];
    [layers[i], layers[j]] = [layers[j], layers[i]];
    editDesign({ ...d, layers }, true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable]") || !selectedId || busy) return;
      const d = designRef.current;
      const layer = d?.layers.find((l) => l.id === selectedId);
      if (!layer) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "Escape") setSelectedId(null);
      else if (e.key === "Delete" || e.key === "Backspace") removeLayer(layer.id);
      else if (e.key === "ArrowLeft") updateLayer(layer.id, { x: layer.x - step });
      else if (e.key === "ArrowRight") updateLayer(layer.id, { x: layer.x + step });
      else if (e.key === "ArrowUp") updateLayer(layer.id, { y: layer.y - step });
      else if (e.key === "ArrowDown") updateLayer(layer.id, { y: layer.y + step });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, busy]);

  // ---------------------------------------------------------------- export

  const exportPng = async () => {
    if (!nodeRef.current || !design || exporting) return;
    setExporting(true);
    setSelectedId(null);
    try {
      const scale = getRatio(design.ratio).scale;
      const blob = await renderPng(nodeRef.current, design, scale);
      await download(blob, `${slug(title)}-${Math.round(design.width * scale)}x${Math.round(design.height * scale)}.png`);
      fetch(`/api/projects/${projectId}/learn`, { method: "POST" }).catch(() => {});
    } catch {
      setNotice("The export failed. Try again, or use Chrome if it keeps happening.");
    } finally {
      setExporting(false);
    }
  };

  // ---------------------------------------------------------------- render

  if (missing) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-muted">That design could not be found.</p>
        <Link href="/studio" className="rounded-lg bg-ink px-4 py-2 text-[14px] font-medium text-bg">
          Back to your designs
        </Link>
      </div>
    );
  }

  const designRatio = design ? getRatio(design.ratio) : ratio;
  const outW = Math.round((design?.width ?? ratio.w) * designRatio.scale);
  const outH = Math.round((design?.height ?? ratio.h) * designRatio.scale);

  return (
    <div className="flex h-dvh flex-col-reverse md:flex-row">
      {/* Left: the conversation */}
      <aside className="flex h-[52dvh] min-h-0 w-full shrink-0 flex-col border-t border-line bg-panel md:h-auto md:w-[400px] md:border-r md:border-t-0 lg:w-[430px]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <Link href="/studio" aria-label="Back to your designs" className="-ml-1.5 rounded-md p-2 text-muted transition hover:bg-soft hover:text-ink">
            <ArrowLeft size={17} />
          </Link>
          <Logo size={17} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{loaded ? title : ""}</span>
          {credits !== null ? (
            <button
              type="button"
              onClick={() => setPaywall(true)}
              className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[12px] font-medium tabular-nums transition hover:bg-soft"
              title="Get more credits"
            >
              {credits} {credits === 1 ? "credit" : "credits"}
            </button>
          ) : null}
        </header>

        {notice ? (
          <button type="button" onClick={() => setNotice(null)} className="border-b border-line bg-soft px-5 py-2.5 text-left text-[13px] text-ink">
            {notice}
          </button>
        ) : null}

        {loaded ? (
          <ChatPanel messages={messages} assets={assets} draft={draft} status={status} busy={busy} error={error} credits={credits} onSend={send} ratio={ratio.id} style={style} onStyle={setStyle} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-faint">Loading…</div>
        )}
      </aside>

      {/* Right: the live canvas */}
      <main className="dz-stage relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 px-3 md:px-4">
          <RatioPicker value={ratio} onPick={pickRatio} disabled={busy || !loaded} hasDesign={!!design} />
          <div className="flex-1" />
          <span className="hidden text-[12px] tabular-nums text-muted sm:inline">
            {outW} × {outH} px
          </span>
          <button
            type="button"
            onClick={() => void exportPng()}
            disabled={!design || busy || exporting}
            className="flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-bg transition disabled:opacity-30"
          >
            <Download size={15} />
            {exporting ? "Exporting…" : "Download"}
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <DesignCanvas
            design={design}
            blank={{ w: ratio.w, h: ratio.h }}
            assets={assets}
            nodeRef={nodeRef}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={editDesign}
            locked={busy || exporting}
            working={busy}
            empty={
              busy ? (
                <div className="flex flex-col items-center gap-3" role="status">
                  <PaintingLoader />
                  <p className="text-center text-[13px] font-medium text-[#73726c]">Designing…</p>
                </div>
              ) : (
                <p className="max-w-[70%] text-center text-[13px] leading-relaxed text-[#9b9a94]">
                  Your design will appear here as it&apos;s made.
                </p>
              )
            }
          />

          {busy && status ? (
            <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[12.5px] font-medium shadow-sm">
              <span className="dz-dot" />
              {status}
            </div>
          ) : null}

          {selected && !busy ? (
            <div
              className="absolute bottom-4 left-1/2 flex w-[min(520px,calc(100%-24px))] -translate-x-1/2 items-end gap-1.5 rounded-xl border border-line bg-panel p-1.5 shadow-lg"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {selected.type === "text" ? (
                <textarea
                  aria-label="Edit text"
                  value={(selected as TextLayer).text}
                  rows={Math.min(4, (selected as TextLayer).text.split("\n").length)}
                  onChange={(e) => updateLayer(selected.id, { text: e.target.value || " " } as Partial<Layer>)}
                  onKeyDown={(e) => e.key === "Escape" && setSelectedId(null)}
                  className="min-h-9 min-w-0 flex-1 resize-none rounded-lg bg-soft px-2.5 py-2 text-[16px] leading-snug outline-none md:text-[13px]"
                />
              ) : (
                <span className="flex h-9 flex-1 items-center truncate px-2 text-[13px] text-muted">
                  {selected.name || selected.id} · drag to move
                </span>
              )}
              <button type="button" title="Send backward" aria-label="Send backward" onClick={() => shiftLayer(selected.id, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
                <ArrowDown size={16} />
              </button>
              <button type="button" title="Bring forward" aria-label="Bring forward" onClick={() => shiftLayer(selected.id, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
                <ArrowUp size={16} />
              </button>
              <button type="button" title="Delete layer" aria-label="Delete layer" onClick={() => removeLayer(selected.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {paywall && account ? (
        <Paywall account={account} next={`/studio/${projectId}`} onClose={() => setPaywall(false)} onCredits={setCredits} />
      ) : null}
    </div>
  );
}
