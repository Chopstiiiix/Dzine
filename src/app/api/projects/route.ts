import { badRequest, json, unauthorized } from "@/lib/http";
import { RATIOS } from "@/lib/ratios";
import { getSession } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return json({ projects: await session.store.listProjects() });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const ratio = RATIOS.find((r) => r.id === body.ratio);
  if (!ratio) return badRequest("Unknown format.");
  const project = await session.store.createProject({ ratio: ratio.id });
  return json({ id: project.id });
}
