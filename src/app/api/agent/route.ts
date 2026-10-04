import { runMockAgent } from "@/lib/agent/mock";
import { type AgentEvent, type AgentInput, runAgent } from "@/lib/agent/run";
import { TREATMENTS } from "@/lib/agent/type-treatments";
import { UNLIMITED_CREDITS, serverConfig } from "@/lib/config";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { RATIOS, getRatio } from "@/lib/ratios";
import { NoCreditsError, getSession, grantCredits } from "@/lib/store";

// One design turn can take a few minutes: image generation plus layout plus a review pass.
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { store, userId } = session;

  const problem = store.configProblem();
  if (problem) return json({ error: problem }, 503);

  const body = await req.json().catch(() => null);
  if (!body?.projectId) return badRequest("projectId is required.");
  const project = await store.getProject(String(body.projectId));
  if (!project) return notFound();

  let input: AgentInput;
  let charged = false;
  let credits: number | null = null;

  if (body.review) {
    // Continuation of a turn that is already paid for.
    const image = typeof body.review.image === "string" && body.review.image.length < 3_000_000 ? body.review.image : null;
    input = { kind: "review", image };
  } else {
    const text = String(body.text ?? "").trim().slice(0, 8000);
    const attachmentIds: string[] = Array.isArray(body.attachmentIds) ? body.attachmentIds.map(String).slice(0, 12) : [];
    if (!text && !attachmentIds.length) return badRequest("Say what you would like to make.");

    if (typeof body.ratio === "string" && body.ratio !== project.ratio) {
      if (!RATIOS.some((r) => r.id === body.ratio)) return badRequest("Unknown format.");
      project.ratio = body.ratio;
      await store.updateProject(project.id, { ratio: project.ratio });
    }

    if (!UNLIMITED_CREDITS) {
      try {
        credits = await store.spendCredit(project.id);
        charged = true;
      } catch (err) {
        if (err instanceof NoCreditsError) return json({ error: "no_credits" }, 402);
        throw err;
      }
    }
    await store.addMessage(project.id, { role: "user", content: text, attachments: attachmentIds });
    const style = TREATMENTS.some((t) => t.id === body.style) ? String(body.style) : undefined;
    input = { kind: "user", text, attachmentIds, style };
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (e: AgentEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          open = false; // The browser went away. The turn still runs to completion and saves.
        }
      };
      const progress = { produced: false };
      if (credits !== null) emit({ type: "credits", credits });

      try {
        const run = { store, project, ratio: getRatio(project.ratio), input, emit, progress };
        await (serverConfig.hasAnthropic ? runAgent(run) : runMockAgent(run));
      } catch (err) {
        console.error("[dzine] agent turn failed", err);
        let refunded = false;
        if (charged && !progress.produced) {
          // Nothing was delivered: give the credit back.
          const balance = await grantCredits(userId, 1, "refund", `refund:${crypto.randomUUID()}`).catch(() => null);
          if (balance !== null) {
            refunded = true;
            emit({ type: "credits", credits: balance });
          }
        }
        emit({ type: "status", text: null });
        emit({
          type: "error",
          message: `Something went wrong while designing${refunded ? ", so your credit was refunded" : ""}. Please try again.`,
        });
      } finally {
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
