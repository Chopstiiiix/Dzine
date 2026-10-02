// Quick self-checks for the logic that guards model output and user links. Run: npm run check
import assert from "node:assert";
import { findLinks, imageFromLink } from "@/lib/agent/links";
import { normalizeLayer } from "@/lib/design/normalize";
import { findFont, searchFonts } from "@/lib/fonts";
import { getRatio } from "@/lib/ratios";

const r = getRatio("ig-portrait"); // 1080 x 1350
const text = (x: number, y: number, w: number, h: number, extra = {}) => {
  const warnings: string[] = [];
  const l = normalizeLayer({ type: "text", text: "A\\nB", x, y, w, h, ...extra }, r, new Set(), warnings, "t")!;
  return { at: [l.x, l.y], warned: warnings.length > 0, text: l.type === "text" ? l.text : "" };
};
assert.deepEqual(text(540, 400, 1080, 300).at, [0, 400]); // centre-anchored full width
assert.deepEqual(text(540, 80, 600, 50).at, [240, 80]); // centre-anchored
assert.deepEqual(text(100, 100, 500, 100), { at: [100, 100], warned: false, text: "A\nB" }); // untouched, \n unescaped
assert.deepEqual(text(900, 1300, 400, 200).at, [680, 1150]); // clamped inside
assert.deepEqual(text(900, 100, 400, 100, { rotate: 90 }).at, [900, 100]); // rotated: left alone

assert.deepEqual(findLinks("see https://a.com/x and http://b.com, https://a.com/x"), ["https://a.com/x"]);
for (const bad of ["https://localhost/", "https://127.0.0.1/", "https://169.254.169.254/latest", "https://[::1]/", "http://example.com/"]) {
  await assert.rejects(imageFromLink(bad), Error, bad);
}
assert.ok(searchFonts("graffiti").length > 3); // designer vocabulary maps onto library tags
assert.ok(searchFonts("luxury", "serif").every((f) => f.category === "serif"));
assert.equal(findFont("clash display").source, "fontshare"); // library fonts resolve, case-insensitive
assert.equal(findFont("Not A Font").family, "Inter"); // unknown falls back

console.log("checks passed");
