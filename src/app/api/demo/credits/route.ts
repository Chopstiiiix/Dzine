import { isDemo } from "@/lib/config";
import { json, notFound } from "@/lib/http";
import { grantCredits } from "@/lib/store";

/** Demo mode only: tops up the in-memory balance so the paywall flow can be tried end to end. */
export async function POST() {
  if (!isDemo) return notFound();
  const credits = await grantCredits("demo", 5, "demo", `demo:${Date.now()}`);
  return json({ credits });
}
