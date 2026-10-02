"use client";

// Images are resized in the browser before upload: faster, cheaper for the AI models,
// and it keeps each request under the 4.5 MB limit of serverless functions.

const MAX_SIDE = 2048;
const MAX_BYTES = 4.2 * 1024 * 1024;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (file.type !== "image/svg+xml" && "createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const source = await decode(file);
  const sw = "naturalWidth" in source ? source.naturalWidth || 1024 : source.width;
  const sh = "naturalHeight" in source ? source.naturalHeight || 1024 : source.height;
  const keepAlpha = /png|webp|svg|gif/.test(file.type);

  let side = MAX_SIDE;
  for (let attempt = 0; attempt < 4; attempt++) {
    const k = Math.min(1, side / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * k));
    const height = Math.max(1, Math.round(sh * k));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);

    let blob: Blob | null = null;
    if (keepAlpha) {
      blob = await toBlob(canvas, "image/webp", 0.95);
      // Safari cannot encode WebP and silently returns PNG, which is fine.
      if (!blob || !/webp|png/.test(blob.type)) blob = await toBlob(canvas, "image/png", 1);
    } else {
      blob = await toBlob(canvas, "image/jpeg", 0.9);
    }
    if (blob && blob.size <= MAX_BYTES) return { blob, width, height };
    side = Math.round(side * 0.75);
  }
  throw new Error("That image is too large to upload.");
}
