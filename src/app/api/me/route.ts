import { PACKS, UNLIMITED_CREDITS, isDemo, serverConfig } from "@/lib/config";
import { json, unauthorized } from "@/lib/http";
import { getSession } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return json({
    email: session.email,
    credits: UNLIMITED_CREDITS ? null : await session.store.getCredits(),
    demo: isDemo,
    packs: PACKS,
    providers: { stripe: serverConfig.hasStripe, paystack: serverConfig.hasPaystack },
  });
}
