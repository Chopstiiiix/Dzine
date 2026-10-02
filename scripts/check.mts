// Quick self-checks for the logic that guards model output and user links. Run: npm run check
import assert from "node:assert";
import { findLinks, imageFromLink } from "@/lib/agent/links";
import { normalizeLayer } from "@/lib/design/normalize";
import { findFont, searchFonts } from "@/lib/fonts";
import { getRatio } from "@/lib/ratios";
import { TREATMENTS, pickTreatments } from "@/lib/agent/type-treatments";
import { composeDesign, splitLines } from "@/lib/design/compose";

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

assert.deepEqual(text(-120, 300, 1320, 620).at, [-120, 300]); // giant cropped type bleeds on purpose
for (const t of TREATMENTS) for (const l of t.layers) {
  if (typeof l.font === "string") assert.equal(findFont(l.font).family, l.font, `${t.id}: font ${l.font} not in library`);
}
assert.equal(pickTreatments("church gospel worship night")[0].id, "gospel");
assert.equal(pickTreatments("a hip hop mixtape cover").length, 3);

assert.deepEqual(splitLines("MIDNIGHT LAGOS", 2), ["MIDNIGHT", "LAGOS"]);
assert.deepEqual(splitLines("A NIGHT OF WORSHIP AND PRAISE", 3).length, 3);
const overlaps: string[] = [];
// Template mode: every fact reaches the canvas, in every treatment and position, and nothing leaves it.
for (const t of TREATMENTS) for (const position of ["top", "middle", "bottom"] as const) {
  const { design } = composeDesign(
    {
      treatment: t.id, position, headline: "MIDNIGHT LAGOS", kicker: "CLUB EKO PRESENTS", subhead: "DJs Tobi Beats + Ama K",
      details: ["SAT 14 NOV", "10PM TILL LATE"], date: "SAT 14 NOV", host: "Pastor Ade", price: "₦5,000", items: ["Jollof Rice — ₦3,500", "Small Chops — ₦2,000"],
    },
    r,
  );
  const all = JSON.stringify(design.layers).toUpperCase();
  for (const fact of ["MIDNIGHT", "LAGOS", "TOBI BEATS", "SAT 14 NOV", "10PM TILL LATE", "CLUB EKO", "PASTOR ADE", "₦5,000", "JOLLOF RICE", "₦3,500", "SMALL CHOPS"]) {
    assert.ok(all.includes(fact), `${t.id}/${position}: "${fact}" missing`);
  }
  type Box = { id: string; type: string; x: number; y: number; h: number; w: number; rotate?: number; opacity?: number };
  const boxes = design.layers as Box[];
  for (const l of boxes) {
    if (l.type === "text" && l.w <= r.w) assert.ok(l.y >= 0 && l.y + l.h <= r.h + 1, `${t.id}/${position}: ${l.id} off canvas`);
  }
  // No two upright, solid text blocks may overlap (deliberate overlaps are tilted, faint or a known lockup).
  const solid = boxes.filter((l) => l.type === "text" && !l.rotate && (l.opacity ?? 1) === 1);
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const a = solid[i], b = solid[j];
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ix > 2 && iy > 2) overlaps.push(`${t.id}/${position}: "${a.id}" overlaps "${b.id}"`);
  }
}

assert.deepEqual(overlaps, [], overlaps.join("\n"));

// Fixtures split into two sides; menus split dish and price.
{
  const { design } = composeDesign({ treatment: "matchday", headline: "DERBY DAY", subhead: "Eagles vs Lions", details: ["SAT 4PM"] }, r);
  const byId = Object.fromEntries((design.layers as { id: string; text?: string }[]).map((l) => [l.id, l.text]));
  assert.equal(byId.teamA, "Eagles");
  assert.equal(byId.teamB, "Lions");
  const menu = composeDesign({ treatment: "menu-list", headline: "MENU", items: ["Jollof Rice — ₦3,500", "Suya: ₦2,000", "Chapman $4"] }, r).design;
  const m = Object.fromEntries((menu.layers as { id: string; text?: string }[]).map((l) => [l.id, l.text]));
  assert.equal(m.names, "Jollof Rice\nSuya\nChapman");
  assert.equal(m.prices, "₦3,500\n₦2,000\n$4");
}

console.log("checks passed");
