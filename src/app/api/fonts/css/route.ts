import { fontCssUrl, lookupFont } from "@/lib/fonts";

// Stylesheet for one catalogue font. Keeps the font library server-side and gives the canvas
// and the exporter one CSS shape: absolute https URLs, unquoted.
export async function GET(req: Request) {
  const family = new URL(req.url).searchParams.get("family");
  const font = lookupFont(family);
  if (!font) return new Response("Unknown font.", { status: 404 });
  // Google serves woff2 only to browsers it recognises, so pass the browser's user agent through.
  const res = await fetch(fontCssUrl(font.family), { headers: { "user-agent": req.headers.get("user-agent") ?? "" } });
  if (!res.ok) return new Response("Font stylesheet unavailable.", { status: 502 });
  const css = (await res.text()).replace(/url\(\s*['"]?(?:https:)?\/\/([^'")]+)['"]?\s*\)/g, "url(https://$1)");
  return new Response(css, {
    headers: { "content-type": "text/css; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
