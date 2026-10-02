import { isDemo, serverConfig } from "@/lib/config";
import { badRequest, json, unauthorized } from "@/lib/http";
import { findPack, startPaystackCheckout, startStripeCheckout } from "@/lib/payments";
import { getSession } from "@/lib/store";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (isDemo) return badRequest("Payments are off in demo mode.");

  const body = await req.json().catch(() => ({}));
  const pack = findPack(body.packId);
  if (!pack) return badRequest("Unknown pack.");

  // Only ever send people back to a page inside the app.
  const next = typeof body.next === "string" && /^\/studio(\/[\w-]+)?$/.test(body.next) ? body.next : "/studio";
  const input = { userId: session.userId, email: session.email, pack, next };

  try {
    if (body.provider === "stripe" && serverConfig.hasStripe) return json({ url: await startStripeCheckout(input) });
    if (body.provider === "paystack" && serverConfig.hasPaystack) return json({ url: await startPaystackCheckout(input) });
  } catch (err) {
    console.error("[dzine] checkout failed", err);
    return json({ error: err instanceof Error ? err.message : "Checkout failed." }, 502);
  }
  return badRequest("That payment method is not available.");
}
