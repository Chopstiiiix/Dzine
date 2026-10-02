import crypto from "node:crypto";
import Stripe from "stripe";
import { PACKS, type Pack, serverConfig } from "@/lib/config";
import { grantCredits } from "@/lib/store";

// Credit packs through Stripe (cards, USD) and Paystack (NGN).
// Credits are granted from the pack recorded on the payment, never from anything the browser sends,
// and every grant is keyed on the payment reference so webhooks and return-page checks cannot double-pay.

export type Provider = "stripe" | "paystack";

export const findPack = (id: unknown): Pack | undefined => PACKS.find((p) => p.id === id);

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

const returnUrl = (provider: Provider, next: string) =>
  `${serverConfig.appUrl}/api/checkout/confirm?provider=${provider}&next=${encodeURIComponent(next)}`;

export async function startStripeCheckout(input: { userId: string; email: string | null; pack: Pack; next: string }) {
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email ?? undefined,
    client_reference_id: input.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.pack.usd,
          product_data: { name: `Dzine ${input.pack.name}: ${input.pack.credits} credits` },
        },
      },
    ],
    metadata: { user_id: input.userId, pack_id: input.pack.id },
    success_url: `${returnUrl("stripe", input.next)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${serverConfig.appUrl}${input.next}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

/** Grants the credits for a paid Stripe session. Safe to call more than once. */
export async function fulfilStripeSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false;
  const pack = findPack(session.metadata?.pack_id);
  const userId = session.metadata?.user_id;
  if (!pack || !userId) return false;
  if (session.amount_total !== null && session.amount_total < pack.usd) return false;
  await grantCredits(userId, pack.credits, `purchase:stripe:${pack.id}`, `stripe:${session.id}`);
  return true;
}

// ------------------------------------------------------------------ Paystack

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured.");
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || !body.data) throw new Error(body?.message || `Paystack error ${res.status}`);
  return body.data;
}

export async function startPaystackCheckout(input: { userId: string; email: string | null; pack: Pack; next: string }) {
  if (!input.email) throw new Error("Paystack needs an email address on the account.");
  const data = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.pack.ngn,
      currency: "NGN",
      reference: `dzine_${crypto.randomUUID().replace(/-/g, "")}`,
      callback_url: returnUrl("paystack", input.next),
      metadata: { user_id: input.userId, pack_id: input.pack.id },
    }),
  });
  return data.authorization_url;
}

type PaystackTx = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: { user_id?: string; pack_id?: string } | string | null;
};

/** Grants the credits for a successful Paystack transaction. Safe to call more than once. */
export async function fulfilPaystackTx(tx: PaystackTx): Promise<boolean> {
  if (tx.status !== "success" || tx.currency !== "NGN") return false;
  const meta = typeof tx.metadata === "string" ? safeJson(tx.metadata) : tx.metadata;
  const pack = findPack(meta?.pack_id);
  const userId = meta?.user_id;
  if (!pack || !userId || tx.amount < pack.ngn) return false;
  await grantCredits(userId, pack.credits, `purchase:paystack:${pack.id}`, `paystack:${tx.reference}`);
  return true;
}

export const verifyPaystackReference = (reference: string) =>
  paystack<PaystackTx>(`/transaction/verify/${encodeURIComponent(reference)}`);

export function validPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function safeJson(s: string): { user_id?: string; pack_id?: string } | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
