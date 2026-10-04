"use client";

import { toBlob, toJpeg } from "html-to-image";
import type { Design } from "@/lib/design/types";
import { fontEmbedCss } from "./fonts";

// Renders the live canvas node to an image. The node is laid out at design-space size
// and only scaled down on screen with a CSS transform, so the export undoes the transform
// and multiplies by pixelRatio to reach the output size.

async function settle(node: HTMLElement) {
  await document.fonts.ready;
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? null
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
    ),
  );
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function options(node: HTMLElement, design: Design, pixelRatio: number) {
  await settle(node);
  return {
    width: design.width,
    height: design.height,
    pixelRatio,
    style: { transform: "none" },
    fontEmbedCSS: await fontEmbedCss(design),
    filter: (el: HTMLElement) => !(el instanceof HTMLElement && el.dataset?.dzUi !== undefined),
  };
}

/** Full-resolution PNG for download. */
export async function renderPng(node: HTMLElement, design: Design, scale: number): Promise<Blob> {
  const opts = await options(node, design, scale);
  // html-to-image needs one warm-up pass before images are reliably painted in some browsers.
  await toBlob(node, { ...opts, pixelRatio: 0.2 }).catch(() => null);
  const blob = await toBlob(node, opts);
  if (!blob) throw new Error("Export failed.");
  return blob;
}

/** Small JPEG for the agent's review pass and for thumbnails. */
export async function renderPreview(node: HTMLElement, design: Design, targetWidth: number, quality = 0.85): Promise<string> {
  const opts = await options(node, design, targetWidth / design.width);
  await toJpeg(node, { ...opts, quality: 0.3, pixelRatio: 0.1 }).catch(() => null);
  return toJpeg(node, { ...opts, quality, backgroundColor: "#ffffff" });
}

export async function download(blob: Blob, filename: string) {
  // On phones the share sheet is how a picture reaches Photos; a download link only reaches Files.
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try {
      return await navigator.share({ files: [file] });
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // They closed the sheet.
      // Otherwise (e.g. the tap "expired" during rendering) fall back to a plain download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
