import { TREATMENTS } from "@/lib/agent/type-treatments";
import { composeDesign } from "@/lib/design/compose";
import { normalizeDesign } from "@/lib/design/normalize";
import { getRatio } from "@/lib/ratios";

// The typography styles a user can pick, each filled with sample words at the project's format.
export async function GET(req: Request) {
  const ratio = getRatio(new URL(req.url).searchParams.get("ratio"));
  const styles = TREATMENTS.map((t) => ({
    id: t.id,
    name: t.name,
    use: t.use,
    design: normalizeDesign(
      composeDesign(
        {
          treatment: t.id,
          position: "middle",
          headline: "Your Title",
          kicker: "Presents",
          details: ["Sat 14 Nov", "10PM"],
          accent: t.id === "swiss" ? "14.11" : t.id === "sale-burst" ? "50%" : undefined,
        },
        ratio,
      ).design,
      ratio,
      new Set(),
    ).design,
  }));
  return Response.json({ styles }, { headers: { "cache-control": "public, max-age=3600" } });
}
