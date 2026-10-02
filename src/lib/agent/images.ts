import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fal } from "@fal-ai/client";
import { serverConfig } from "@/lib/config";
import type { Asset } from "@/lib/design/types";
import type { Store } from "@/lib/store/types";

// AI imagery: generation, photo transformation and background removal through fal.ai,
// or generation on this Mac through mflux (DZINE_LOCAL_IMAGES=1, no API key).
// With neither, every call returns a labelled placeholder so the rest of the app still works.

export type ImageResult = { data: Buffer; mime: string; width: number | null; height: number | null };

let configured = false;
function client() {
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
  return fal;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the generated image (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

/** Pixel size of a PNG, JPEG or WebP, read from its header. */
export function imageSize(buf: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime === "image/png" && buf.length > 24) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) return null;
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        i += 2 + len;
      }
      return null;
    }
    if (mime === "image/webp" && buf.length > 30) {
      const kind = buf.toString("ascii", 12, 16);
      if (kind === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (kind === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (kind === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

function aspectSize(aspect: string, long = 1600) {
  const [a, b] = aspect.split(":").map(Number);
  // Diffusion models want sides that are multiples of 16.
  const r16 = (n: number) => Math.round(n / 16) * 16;
  if (!a || !b) return { width: r16(long), height: r16(long) };
  return a >= b ? { width: r16(long), height: r16((long * b) / a) } : { width: r16((long * a) / b), height: r16(long) };
}

const run = promisify(execFile);
const mime2ext: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// ponytail: one mflux process per image (model reloads each call, ~10s overhead). Keep a warm python server if that hurts.
async function generateLocal(input: { store: Store; prompt: string; aspect: string; sources: Asset[] }): Promise<ImageResult> {
  const dir = await mkdtemp(join(tmpdir(), "dzine-"));
  try {
    const { width, height } = aspectSize(input.aspect, serverConfig.localImageSize);
    const out = join(dir, "out.png");
    const args = ["--prompt", input.prompt, "--width", String(width), "--height", String(height), "--output", out, "-q", "8"];
    let bin = "mflux-generate-z-image-turbo";
    if (input.sources.length) {
      bin = "mflux-generate-flux2-edit";
      const paths = await Promise.all(
        input.sources.map(async (a, i) => {
          const raw = await input.store.getAssetData(a.id);
          if (!raw || !mime2ext[raw.mime]) throw new Error(`Asset ${a.id} can't be used as a local edit source.`);
          const p = join(dir, `src${i}.${mime2ext[raw.mime]}`);
          await writeFile(p, raw.data);
          return p;
        }),
      );
      args.push("--model", "flux2-klein-4b", "--image-paths", ...paths);
    } else {
      args.push("--steps", "9");
    }
    await run(join(serverConfig.mfluxDir, bin), args, { timeout: 15 * 60_000, maxBuffer: 64 * 1024 * 1024 });
    const data = await readFile(out);
    const size = imageSize(data, "image/png");
    return { data, mime: "image/png", width: size?.width ?? width, height: size?.height ?? height };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function placeholder(prompt: string, aspect: string): ImageResult {
  const { width, height } = aspectSize(aspect);
  const h = hash(prompt);
  const hue = h % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 70% 22%)"/><stop offset="0.55" stop-color="hsl(${(hue + 40) % 360} 75% 42%)"/><stop offset="1" stop-color="hsl(${(hue + 95) % 360} 85% 62%)"/>
</linearGradient>
<radialGradient id="r" cx="0.7" cy="0.3" r="0.6"><stop offset="0" stop-color="hsl(${(hue + 150) % 360} 90% 70%)" stop-opacity="0.75"/><stop offset="1" stop-color="hsl(${hue} 90% 50%)" stop-opacity="0"/></radialGradient>
</defs>
<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#r)"/>
<circle cx="${width * 0.28}" cy="${height * 0.72}" r="${Math.min(width, height) * 0.22}" fill="hsl(${(hue + 200) % 360} 80% 60%)" opacity="0.35"/>
</svg>`;
  return { data: Buffer.from(svg), mime: "image/svg+xml", width, height };
}

/** A URL the image model can fetch. Demo-store assets are private, so they go through fal storage. */
async function publicUrl(store: Store, asset: Asset): Promise<string> {
  if (/^https?:\/\//.test(asset.url) && !store.demo) return asset.url;
  const raw = await store.getAssetData(asset.id);
  if (!raw) throw new Error(`Asset ${asset.id} is not available.`);
  return client().storage.upload(new Blob([new Uint8Array(raw.data)], { type: raw.mime }));
}

export async function generateImage(input: {
  store: Store;
  prompt: string;
  aspect: string;
  sources: Asset[];
}): Promise<ImageResult & { placeholder?: boolean }> {
  if (serverConfig.localImages) return generateLocal(input);
  if (!serverConfig.hasFal) return { ...placeholder(input.prompt, input.aspect), placeholder: true };

  const sourceUrls = await Promise.all(input.sources.map((a) => publicUrl(input.store, a)));
  const endpoint = sourceUrls.length ? `${serverConfig.imageModel}/edit` : serverConfig.imageModel;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await client().subscribe(endpoint, {
    input: {
      prompt: input.prompt,
      aspect_ratio: input.aspect,
      resolution: serverConfig.imageResolution,
      num_images: 1,
      output_format: "jpeg",
      ...(sourceUrls.length ? { image_urls: sourceUrls } : {}),
    },
  });
  const img = res?.data?.images?.[0];
  if (!img?.url) throw new Error("The image model returned no image.");
  const data = await download(img.url);
  const mime = img.content_type || "image/jpeg";
  const size = imageSize(data, mime);
  return { data, mime, width: size?.width ?? img.width ?? null, height: size?.height ?? img.height ?? null };
}

export async function removeBackground(store: Store, asset: Asset): Promise<ImageResult & { placeholder?: boolean }> {
  if (!serverConfig.hasFal) {
    const raw = await store.getAssetData(asset.id);
    if (!raw) throw new Error("Background removal needs FAL_KEY.");
    return { data: raw.data, mime: raw.mime, width: asset.width, height: asset.height, placeholder: true };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await client().subscribe(serverConfig.cutoutModel, {
    input: {
      image_url: await publicUrl(store, asset),
      model: "General Use (Heavy)",
      operating_resolution: "2048x2048",
      output_format: "png",
      refine_foreground: true,
    },
  });
  const img = res?.data?.image;
  if (!img?.url) throw new Error("Background removal returned no image.");
  const data = await download(img.url);
  const size = imageSize(data, "image/png");
  return { data, mime: "image/png", width: size?.width ?? img.width ?? null, height: size?.height ?? img.height ?? null };
}
