import { running } from "@/lib/agent/running";
import { revalidateDesign } from "@/lib/design/normalize";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { RATIOS, getRatio } from "@/lib/ratios";
import { getSession } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const project = await session.store.getProject(id);
  if (!project) return notFound();
  const [messages, assets, credits] = await Promise.all([
    session.store.listMessages(id),
    session.store.listAssets(id),
    session.store.getCredits(),
  ]);
  return json({
    project: { id: project.id, title: project.title, ratio: project.ratio, design: project.design, awaitingReview: !!project.pending },
    /** An agent turn is in flight right now. */
    running: running.has(id),
    messages,
    assets,
    credits,
  });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const project = await session.store.getProject(id);
  if (!project) return notFound();
  const body = await req.json().catch(() => ({}));

  const patch: Parameters<typeof session.store.updateProject>[1] = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 80);
  if (typeof body.ratio === "string") {
    if (!RATIOS.some((r) => r.id === body.ratio)) return badRequest("Unknown format.");
    patch.ratio = body.ratio;
  }
  if (body.design) {
    // Manual edits from the canvas: same validation as the agent's output.
    const assets = await session.store.listAssets(id);
    const ratio = getRatio(project.design?.ratio ?? project.ratio);
    patch.design = revalidateDesign(body.design, ratio, new Set(assets.map((a) => a.id)));
  }
  if (typeof body.thumb === "string") {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.thumb) || body.thumb.length > 120_000) {
      return badRequest("Invalid thumbnail.");
    }
    patch.thumb = body.thumb;
  }
  await session.store.updateProject(id, patch);
  return json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  await session.store.deleteProject(id);
  return json({ ok: true });
}
