import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/config";
import { fulfilPaystackTx, fulfilStripeSession, stripe, verifyPaystackReference } from "@/lib/payments";

/**
 * Where Stripe and Paystack send the buyer after paying. The payment is re-checked with the
 * provider here, so credits show up at once even if the webhook is slow.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next") ?? "";
  const next = /^\/studio(\/[\w-]+)?$/.test(nextParam) ? nextParam : "/studio";
  let paid = false;

  try {
    if (url.searchParams.get("provider") === "stripe") {
      const id = url.searchParams.get("session_id");
      if (id) paid = await fulfilStripeSession(await stripe().checkout.sessions.retrieve(id));
    } else if (url.searchParams.get("provider") === "paystack") {
      const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
      if (reference) paid = await fulfilPaystackTx(await verifyPaystackReference(reference));
    }
  } catch (err) {
    console.error("[dzine] payment confirmation failed", err);
  }

  return NextResponse.redirect(`${serverConfig.appUrl}${next}?paid=${paid ? "1" : "0"}`);
}
