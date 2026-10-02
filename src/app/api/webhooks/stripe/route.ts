import type Stripe from "stripe";
import { json } from "@/lib/http";
import { fulfilStripeSession, stripe } from "@/lib/payments";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return json({ error: "not_configured" }, 400);

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return json({ error: "bad_signature" }, 400);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await fulfilStripeSession(event.data.object as Stripe.Checkout.Session);
  }
  return json({ received: true });
}
