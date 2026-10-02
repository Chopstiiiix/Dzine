import { notFound } from "next/navigation";
import { TREATMENTS } from "@/lib/agent/type-treatments";
import { composeDesign } from "@/lib/design/compose";
import { normalizeDesign } from "@/lib/design/normalize";
import { getRatio } from "@/lib/ratios";
import { TreatmentGallery } from "./TreatmentGallery";

// Preview of the typography playbook, rendered by the real canvas. Development only.
// ?brief=raw shows the treatments as authored; by default they go through the template-mode
// composer with real flyer content, which is exactly what the designer produces.
export default async function TypeGallery({ searchParams }: PageProps<"/dev/type">) {
  if (process.env.NODE_ENV === "production") notFound();
  const raw = (await searchParams).brief === "raw";
  const ratio = getRatio("ig-portrait");
  const positions = ["middle", "top", "bottom"] as const;
  const items = TREATMENTS.map((t, i) => {
    const input = raw
      ? { background: t.preview, layers: t.layers }
      : composeDesign(
          {
            treatment: t.id,
            position: positions[i % 3],
            headline: "MIDNIGHT LAGOS",
            kicker: "CLUB EKO PRESENTS",
            subhead: "DJs Tobi Beats + Ama K",
            details: ["SAT 14 NOV", "10PM TILL LATE"],
            details2: "Club Eko, Lagos",
            accent: t.id === "swiss" ? "14.11" : t.id === "kids" ? "5" : undefined,
          },
          ratio,
        ).design;
    return { id: t.id, name: raw ? t.name : `${t.name} · ${positions[i % 3]}`, use: t.use, design: normalizeDesign(input, ratio, new Set()).design };
  });
  return <TreatmentGallery items={items} />;
}
