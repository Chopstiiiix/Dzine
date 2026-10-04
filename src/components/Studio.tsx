"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Download, Layers, Redo2, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent/run";
import { download, renderPng, renderPreview } from "@/lib/client/export";
import { prepareImage } from "@/lib/client/upload";
import type { Asset, Design, Layer, ShapeKind, TextLayer } from "@/lib/design/types";
import { type Ratio, getRatio } from "@/lib/ratios";
import type { ChatMessage } from "@/lib/store/types";
import { CanvasTools } from "./CanvasTools";
import { LayersPanel, layerName } from "./LayersPanel";
import { type Attachment, ChatPanel } from "./ChatPanel";
import { PaintingLoader } from "./PaintingLoader";
import type { Style } from "./StylePicker";
import { type CanvasTool, DesignCanvas } from "./DesignCanvas";
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

const ICON_BTN = "flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-soft hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

const SHAPE_NAMES: Record<ShapeKind | "rounded", string> = {
  rect: "Rectangle", rounded: "Rounded rectangle", ellipse: "Circle", triangle: "Triangle", diamond: "Diamond", hexagon: "Hexagon", star: "Star",
};

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<CanvasTool>("select");
  const [layersOpen, setLayersOpen] = useState(false);
  const [resumeOnLoad, setResumeOnLoad] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cutting, setCutting] = useState(false);
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
      if (data.running || data.project.awaitingReview) setResumeOnLoad(true);

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

  const scheduleSave = useCallback(
    (next: Design) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void patchProject({ design: next }), 500);
    },
    [patchProject],
  );

  // Undo history of committed designs. An agent turn counts as one step.
  const hist = useRef({ past: [] as Design[], future: [] as Design[], committed: null as Design | null, last: 0 });
  const [steps, setSteps] = useState({ undo: 0, redo: 0 });
  const syncSteps = () => setSteps({ undo: hist.current.past.length, redo: hist.current.future.length });

  const record = (before: Design | null, after: Design | null) => {
    if (before && after && before !== after) {
      // Rapid commits (a colour picker or slider being dragged) collapse into one step.
      if (Date.now() - hist.current.last > 600) hist.current.past = [...hist.current.past, before].slice(-100);
      hist.current.last = Date.now();
      hist.current.future = [];
    }
    hist.current.committed = after;
    syncSteps();
  };

  const editDesign = (next: Design, commit: boolean) => {
    // The first edit after loading starts the history from the design as it was.
    if (!hist.current.committed) hist.current.committed = designRef.current;
    setDesign(next);
    if (!commit) return;
    record(hist.current.committed, next);
    scheduleSave(next);
  };

  const travel = (dir: "undo" | "redo") => {
    const from = dir === "undo" ? hist.current.past : hist.current.future;
    const target = from.at(-1);
    if (!target || !hist.current.committed || busy) return;
    if (dir === "undo") {
      hist.current.past = hist.current.past.slice(0, -1);
      hist.current.future = [...hist.current.future, hist.current.committed];
    } else {
      hist.current.future = hist.current.future.slice(0, -1);
      hist.current.past = [...hist.current.past, hist.current.committed];
    }
    hist.current.committed = target;
    hist.current.last = 0;
    syncSteps();
    setDesign(target);
    setSelectedIds((ids) => ids.filter((id) => target.layers.some((l) => l.id === id)));
    scheduleSave(target);
  };
  const undo = () => travel("undo");
  const redo = () => travel("redo");

  // ---------------------------------------------------------------- agent turns

  /** Plays one response stream into the UI. Returns true when the agent paused for a review. Throws if the stream was cut. */
  const consume = async (res: Response): Promise<boolean> => {
    let wantsReview = false;
    let ended = false;
    for await (const ev of readEvents(res)) {
      if (ev.type === "done" || ev.type === "error" || ev.type === "review") ended = true;
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
    // A cut connection can end the body quietly instead of throwing.
    if (!ended) throw new Error("stream_dropped");
    return wantsReview;
  };

  const post = (body: Record<string, unknown>) =>
    fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...body }),
    });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Sends the agent a snapshot of the canvas so a paused turn can carry on. */
  const postReview = async () => {
    await sleep(350);
    let image: string | null = null;
    try {
      if (nodeRef.current && designRef.current) image = await renderPreview(nodeRef.current, designRef.current, 900, 0.82);
    } catch {
      image = null;
    }
    const res = await post({ review: { image } });
    if (!res.ok || !res.body) throw new Error("request_failed");
    return res;
  };

  /** Follows a turn to the end, answering the agent's review pauses with a snapshot. */
  const drive = async (first: Response) => {
    let res = first;
    for (let pass = 0; pass < 4; pass++) {
      if (!(await consume(res))) return;
      res = await postReview();
    }
  };

  /**
   * The stream was lost (a proxy cut it, the network blinked, the page was reloaded) but the
   * turn keeps running on the server. Watch the project until it finishes, show what it made,
   * and if it is waiting for a review snapshot, send one so it can finish.
   */
  const reattach = async () => {
    setDraft("");
    setStatus("Reconnecting…");
    const until = Date.now() + 15 * 60_000;
    while (Date.now() < until) {
      await sleep(3000);
      try {
        const r = await fetch(`/api/projects/${projectId}`);
        if (!r.ok) continue;
        const data = await r.json();
        if (data.project.design) setDesign(data.project.design);
        setAssets(data.assets);
        setTitle(data.project.title);
        if (data.running) {
          setStatus("Still designing…");
          continue;
        }
        if (data.project.awaitingReview) {
          setStatus("Checking the details");
          await drive(await postReview());
        } else {
          setMessages(data.messages);
        }
        return;
      } catch {
        setStatus("Reconnecting…"); // offline or cut again: keep trying
      }
    }
    setError("Lost touch with the designer. Reload the page to see the latest version.");
  };

  /** Runs one agent turn. `onAccepted` fires as soon as the server takes (or refuses) the message. */
  const runTurn = async (body: Record<string, unknown>, onAccepted: (accepted: boolean) => void): Promise<void> => {
    setBusy(true);
    setError(null);
    setStatus(null);
    setSelectedIds([]);
    const before = hist.current.committed ?? designRef.current;
    let accepted = false;
    try {
      const res = await post(body);
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
      accepted = true;
      onAccepted(true);
      await drive(res);
    } catch {
      if (accepted) await reattach();
      else {
        // The request never reached the server.
        setError("Couldn't reach Dzine. Check your connection and try again.");
        onAccepted(false);
      }
    } finally {
      setBusy(false);
      setStatus(null);
      hist.current.last = 0;
      record(before, designRef.current);
      setTimeout(() => void saveThumb(), 600);
    }
  };

  /** After a reload mid-turn: show the turn as in progress and follow it to the end. */
  const resume = async () => {
    setBusy(true);
    try {
      await reattach();
    } finally {
      setBusy(false);
      setStatus(null);
      setTimeout(() => void saveThumb(), 600);
    }
  };

  useEffect(() => {
    if (!resumeOnLoad) return;
    const t = setTimeout(() => void resume(), 0); // after the canvas has rendered, so a snapshot works
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeOnLoad]);

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
          // A proxy in front of us (e.g. a firewall) can answer with an HTML page instead of JSON.
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.asset) throw new Error(body.error || `Upload failed (${res.status}). Please try again.`);
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

  const selection = design?.layers.filter((l) => selectedIds.includes(l.id)) ?? [];
  const selected = selection.length === 1 ? selection[0] : null;

  const updateLayer = (id: string, props: Partial<Layer>, commit = true) => {
    const d = designRef.current;
    if (!d) return;
    editDesign({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...props } as Layer) : l)) }, commit);
  };

  /** Applies a change to every selected layer; return null to leave one alone. */
  const patchSelected = (fn: (l: Layer) => Partial<Layer> | null) => {
    const d = designRef.current;
    if (!d || !selectedIds.length) return;
    editDesign({ ...d, layers: d.layers.map((l) => (selectedIds.includes(l.id) ? ({ ...l, ...fn(l) } as Layer) : l)) }, true);
  };

  const removeSelected = () => {
    const d = designRef.current;
    if (!d || !selectedIds.length) return;
    editDesign({ ...d, layers: d.layers.filter((l) => !selectedIds.includes(l.id)) }, true);
    setSelectedIds([]);
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

  const setBackground = (background: string) => {
    const d = designRef.current;
    if (d) editDesign({ ...d, background }, true);
  };

  const addLayer = (kind: "text" | ShapeKind | "rounded") => {
    const d = designRef.current;
    if (!d) return;
    const id = `${kind}-${Math.random().toString(36).slice(2, 7)}`;
    const W = d.width;
    const H = d.height;
    const near = d.layers.find((l): l is TextLayer => l.type === "text");
    const side = Math.round(Math.min(W, H) * 0.3);
    const layer: Layer =
      kind === "text"
        ? {
            id, type: "text", name: "Text", text: "Your text", font: near?.font ?? "Inter", weight: near?.weight,
            size: Math.round(W * 0.09), sizing: "fit", color: near?.color ?? "#111111", align: "center", valign: "middle",
            x: Math.round(W * 0.15), y: Math.round(H * 0.42), w: Math.round(W * 0.7), h: Math.round(H * 0.16),
          }
        : {
            id, type: "shape", name: SHAPE_NAMES[kind], shape: kind === "rounded" ? "rect" : kind, fill: "#e2554f",
            radius: kind === "rounded" ? Math.round(side * 0.15) : undefined,
            x: Math.round((W - side) / 2), y: Math.round((H - side) / 2), w: side, h: side,
          };
    editDesign({ ...d, layers: [...d.layers, layer] }, true);
    setSelectedIds([id]);
    setTool("select");
  };

  const cutout = async () => {
    const layer = selected;
    if (!layer || layer.type !== "image" || cutting) return;
    setCutting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cutout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: layer.asset }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.asset) throw new Error(body.error || `Background removal failed (${res.status}).`);
      setAssets((a) => [...a, body.asset]);
      updateLayer(layer.id, { asset: body.asset.id } as Partial<Layer>);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Background removal failed.");
    } finally {
      setCutting(false);
    }
  };

  // Re-bound every render so the handler always sees the current selection and history.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]") || busy || !designRef.current) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const step = e.shiftKey ? 10 : 1;
      const nudge = (dx: number, dy: number) => patchSelected((l) => ({ x: l.x + dx, y: l.y + dy }));

      if (mod && key === "z") travel(e.shiftKey ? "redo" : "undo");
      else if (mod && key === "y") redo();
      else if (mod && key === "a") setSelectedIds(designRef.current.layers.map((l) => l.id));
      else if (mod) return;
      else if (key === "v") setTool("move");
      else if (key === "a") setTool("select");
      else if (key === "m") setTool("marquee");
      else if (!selectedIds.length) return;
      else if (e.key === "Escape") setSelectedIds([]);
      else if (e.key === "Delete" || e.key === "Backspace") removeSelected();
      else if (e.key === "ArrowLeft") nudge(-step, 0);
      else if (e.key === "ArrowRight") nudge(step, 0);
      else if (e.key === "ArrowUp") nudge(0, -step);
      else if (e.key === "ArrowDown") nudge(0, step);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------------------------------------------------------------- export

  const exportPng = async () => {
    if (!nodeRef.current || !design || exporting) return;
    setExporting(true);
    setSelectedIds([]);
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
          <Link href="/studio" aria-label="Back to your designs" data-tip="Your designs" data-tip-desc="Back to all your designs. This one is saved automatically." className="-ml-1.5 rounded-md p-2 text-muted transition hover:bg-soft hover:text-ink">
            <ArrowLeft size={17} />
          </Link>
          <Logo size={17} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted" data-tip={loaded ? title : undefined} data-tip-desc="Dzine names the design from your brief.">
            {loaded ? title : ""}
          </span>
          {credits !== null ? (
            <button
              type="button"
              onClick={() => setPaywall(true)}
              className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[12px] font-medium tabular-nums transition hover:bg-soft"
              data-tip="Credits"
              data-tip-desc="Each design or change from the agent uses 1 credit. Click to get more. Your own edits on the canvas are free."
            >
              {credits} {credits === 1 ? "credit" : "credits"}
            </button>
          ) : null}
        </header>

        {notice ? (
          <button type="button" onClick={() => setNotice(null)} data-tip="Click to dismiss" className="border-b border-line bg-soft px-5 py-2.5 text-left text-[13px] text-ink">
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
          <div className="ml-1 flex items-center">
            <button type="button" data-tip="Undo (⌘Z)" data-tip-desc="Step back one change. A whole reply from the agent counts as one step." aria-label="Undo" onClick={undo} disabled={busy || !steps.undo} className={ICON_BTN}>
              <Undo2 size={16} />
            </button>
            <button type="button" data-tip="Redo (⇧⌘Z)" data-tip-desc="Bring back the change you just undid." aria-label="Redo" onClick={redo} disabled={busy || !steps.redo} className={ICON_BTN}>
              <Redo2 size={16} />
            </button>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            data-tip="Layers"
            data-tip-desc="Every layer in the design, top first. Pick ones hidden under others, Shift-click for several, or hide one with the eye."
            aria-label="Layers"
            aria-pressed={layersOpen}
            onClick={() => setLayersOpen((o) => !o)}
            disabled={!design}
            className={`${ICON_BTN} ${layersOpen ? "bg-soft text-ink" : ""}`}
          >
            <Layers size={16} />
          </button>
          <span className="hidden text-[12px] tabular-nums text-muted sm:inline" data-tip="Export size" data-tip-desc="The size in pixels of the PNG you'll download.">
            {outW} × {outH} px
          </span>
          <button
            type="button"
            onClick={() => void exportPng()}
            disabled={!design || busy || exporting}
            data-tip="Download"
            data-tip-desc="Save the design as a full-resolution PNG. On a phone this opens the share sheet so you can save it to Photos."
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
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            tool={tool}
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

          <CanvasTools
            design={design}
            selection={selection}
            tool={tool}
            onTool={setTool}
            onPatch={patchSelected}
            onBackground={setBackground}
            onAdd={addLayer}
            onCutout={() => void cutout()}
            cutting={cutting}
            disabled={busy || exporting || !loaded}
          />

          {busy && status ? (
            <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[12.5px] font-medium shadow-sm">
              <span className="dz-dot" />
              {status}
            </div>
          ) : null}

          {layersOpen && design ? (
            <LayersPanel
              layers={design.layers}
              assets={assets}
              selectedIds={selectedIds}
              onSelect={setSelectedIds}
              onToggleVisible={(l) => updateLayer(l.id, { opacity: l.opacity === 0 ? undefined : 0 })}
              onClose={() => setLayersOpen(false)}
            />
          ) : null}

          {selection.length && !busy ? (
            <div
              className="absolute bottom-4 left-1/2 flex w-[min(520px,calc(100%-24px))] -translate-x-1/2 items-end gap-1.5 rounded-xl border border-line bg-panel p-1.5 shadow-lg"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {selected?.type === "text" ? (
                <textarea
                  aria-label="Edit text"
                  value={selected.text}
                  rows={Math.min(4, selected.text.split("\n").length)}
                  onChange={(e) => updateLayer(selected.id, { text: e.target.value || " " } as Partial<Layer>)}
                  onKeyDown={(e) => e.key === "Escape" && setSelectedIds([])}
                  className="min-h-9 min-w-0 flex-1 resize-none rounded-lg bg-soft px-2.5 py-2 text-[16px] leading-snug outline-none md:text-[13px]"
                />
              ) : (
                <span className="flex h-9 flex-1 items-center truncate px-2 text-[13px] text-muted">
                  {selected ? `${layerName(selected)} · drag to move` : `${selection.length} layers selected · drag to move them together`}
                </span>
              )}
              {selected ? (
                <>
                  <button type="button" data-tip="Send backward" data-tip-desc="Move this layer one step behind the others." data-tip-side="top" aria-label="Send backward" onClick={() => shiftLayer(selected.id, -1)} className={ICON_BTN}>
                    <ArrowDown size={16} />
                  </button>
                  <button type="button" data-tip="Bring forward" data-tip-desc="Move this layer one step in front of the others." data-tip-side="top" aria-label="Bring forward" onClick={() => shiftLayer(selected.id, 1)} className={ICON_BTN}>
                    <ArrowUp size={16} />
                  </button>
                </>
              ) : null}
              <button type="button" data-tip="Delete" data-tip-desc="Remove the selected layers. Undo brings them back." data-tip-side="top" aria-label="Delete selected" onClick={removeSelected} className={`${ICON_BTN} hover:text-danger`}>
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
