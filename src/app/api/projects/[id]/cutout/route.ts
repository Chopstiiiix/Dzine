import { removeBackground } from "@/lib/agent/images";
import { serverConfig } from "@/lib/config";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/store";

/** The canvas "Remove background" tool: cuts the subject out of an asset into a new transparent asset. */
export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/cutout">) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;
  const project = await session.store.getProject(id);
  if (!project) return notFound();
  // Without fal, removeBackground hands back the original, which would look like a silent failure here.
  if (!serverConfig.hasFal) return json({ error: "Background removal needs an image API key (FAL_KEY)." }, 501);

  const body = await req.json().catch(() => ({}));
  const source = (await session.store.listAssets(id)).find((a) => a.id === body.assetId);
  if (!source) return badRequest("Unknown image.");

  try {
    const img = await removeBackground(session.store, source);
    const asset = await session.store.addAsset(id, {
      kind: "cutout",
      label: source.label === "logo" ? "logo" : "cutout",
      name: `${source.name} (cutout)`.slice(0, 80),
      mime: img.mime,
      width: img.width,
      height: img.height,
      data: img.data,
    });
    return json({ asset });
  } catch (err) {
    console.error("[dzine] cutout failed", err);
    return json({ error: "Background removal failed. Please try again." }, 502);
  }
}
