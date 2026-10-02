import { imageSize } from "@/lib/agent/images";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/store";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const LABELS = ["photo", "logo", "reference"];
const MAX_BYTES = 4.4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB. The browser downsizes before upload.

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const projectId = String(form?.get("projectId") ?? "");
  if (!(file instanceof Blob) || !projectId) return badRequest("file and projectId are required.");
  if (!ALLOWED.includes(file.type)) return badRequest("Only PNG, JPEG and WebP images are supported.");
  if (file.size > MAX_BYTES) return badRequest("Image is too large.");

  const project = await session.store.getProject(projectId);
  if (!project) return notFound();

  const data = Buffer.from(await file.arrayBuffer());
  const size = imageSize(data, file.type);
  if (!size) return badRequest("That file does not look like a valid image.");

  const label = String(form?.get("label") ?? "photo");
  const asset = await session.store.addAsset(projectId, {
    kind: "upload",
    label: LABELS.includes(label) ? label : "photo",
    name: String(form?.get("name") ?? "upload").slice(0, 80),
    mime: file.type,
    width: size.width,
    height: size.height,
    data,
  });
  return json({ asset });
}
