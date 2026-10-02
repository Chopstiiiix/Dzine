import { json } from "@/lib/http";
import { fulfilPaystackTx, validPaystackSignature, verifyPaystackReference } from "@/lib/payments";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!validPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    return json({ error: "bad_signature" }, 400);
  }
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    // Re-fetch from Paystack rather than trusting the payload's amounts.
    await fulfilPaystackTx(await verifyPaystackReference(event.data.reference));
  }
  return json({ received: true });
}
