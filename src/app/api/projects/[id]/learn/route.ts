import { learnFromDesign } from "@/lib/agent/examples";
import { json, notFound, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/store";

/** Called when a design is downloaded: a kept design becomes a reference for future briefs. */
export async function POST(_req: Request, ctx: RouteContext<"/api/projects/[id]/learn">) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const project = await session.store.getProject(id);
  if (!project) return notFound();
  if (!project.design) return json({ learned: false });
  const briefs = (await session.store.listMessages(id)).filter((m) => m.role === "user").map((m) => m.content);
  return json({ learned: await learnFromDesign({ projectId: id, ratio: project.ratio, briefs, design: project.design }) });
}
