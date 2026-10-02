import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { imageSize } from "./images";

// Inspiration links pasted into the chat (Pinterest, Dribbble, Are.na, Behance...). The server
// fetches only the page the user chose and keeps its preview image as a style reference.
// The URL comes from the user, so every hop is checked against private and internal addresses.

const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function findLinks(text: string): string[] {
  return [...new Set(text.match(/https:\/\/[^\s<>"')]+/g) ?? [])].slice(0, 3);
}

function privateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

// ponytail: checks the resolved address before fetching; a DNS answer that changes between the
// check and the fetch (rebinding) is not covered. Pin the IP in a custom agent if that matters.
async function safeFetch(url: string, accept: string): Promise<Response> {
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error("Only https links are supported.");
    const host = u.hostname.replace(/^\[|\]$/g, "");
    const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new Error("That address is not allowed.");
    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { accept, "user-agent": "Mozilla/5.0 (compatible; DzineBot/1.0; +https://dzine.app)" },
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      url = new URL(next, u).toString();
      continue;
    }
    if (!res.ok) throw new Error(`The page answered ${res.status}.`);
    return res;
  }
  throw new Error("Too many redirects.");
}

async function readCapped(res: Response): Promise<Buffer> {
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("The image is too large.");
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Empty response.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("The image is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function metaImage(html: string, base: string): string | null {
  for (const key of ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]) {
    const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"))?.[0];
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return new URL(content.replace(/&amp;/g, "&"), base).toString();
  }
  return null;
}

/** The image a link points to: the file itself, or the page's preview image. */
export async function imageFromLink(url: string): Promise<{ data: Buffer; mime: string; width: number | null; height: number | null }> {
  let res = await safeFetch(url, "text/html,image/*;q=0.9");
  let mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (mime === "text/html") {
    const html = (await readCapped(res)).toString("utf8");
    const img = metaImage(html, res.url || url);
    if (!img) throw new Error("No preview image found on that page.");
    res = await safeFetch(img, "image/*");
    mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  }
  if (!IMAGE_TYPES.has(mime)) throw new Error(`Unsupported image type ${mime || "unknown"}.`);
  const data = await readCapped(res);
  const size = imageSize(data, mime);
  return { data, mime, width: size?.width ?? null, height: size?.height ?? null };
}
