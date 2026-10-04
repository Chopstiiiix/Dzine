"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { type Pack, formatPrice } from "@/lib/config";

export type Account = {
  /** null while credits are switched off for testing. */
  credits: number | null;
  demo: boolean;
  packs: Pack[];
  providers: { stripe: boolean; paystack: boolean };
};

export function Paywall({
  account,
  next,
  onClose,
  onCredits,
}: {
  account: Account;
  /** Path to return to after paying. */
  next: string;
  onClose: () => void;
  onCredits: (credits: number) => void;
}) {
  const { providers, packs, demo } = account;
  const [provider, setProvider] = useState<"stripe" | "paystack">(providers.stripe || !providers.paystack ? "stripe" : "paystack");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = providers.stripe || providers.paystack;
  const out = account.credits !== null && account.credits <= 0;

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  const buy = async (pack: Pack) => {
    setBusy(pack.id);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id, provider, next }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || "Could not start checkout.");
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(null);
    }
  };

  const demoTopUp = async () => {
    setBusy("demo");
    const res = await fetch("/api/demo/credits", { method: "POST" });
    const body = await res.json();
    setBusy(null);
    if (typeof body.credits === "number") {
      onCredits(body.credits);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative w-full max-w-[560px] rounded-t-2xl border border-line bg-panel p-6 shadow-2xl sm:rounded-2xl sm:p-7"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1.5 text-muted hover:bg-soft">
          <X size={16} />
        </button>

        <h2 id="paywall-title" className="text-[20px] font-semibold tracking-[-0.02em]">
          {out ? "You've used your free designs" : "Get more credits"}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          One credit is one generation or revision. Editing text and moving things by hand is always free.
        </p>

        {providers.stripe && providers.paystack ? (
          <div className="mt-5 inline-flex rounded-lg border border-line p-0.5 text-[13px] font-medium">
            {(["stripe", "paystack"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`h-8 rounded-md px-3 transition ${provider === p ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
              >
                {p === "stripe" ? "Card · USD" : "Paystack · NGN"}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={!configured || !!busy}
              onClick={() => buy(pack)}
              className={`group relative rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                pack.popular ? "border-ink" : "border-line hover:border-faint"
              }`}
            >
              {pack.popular ? (
                <span className="absolute -top-2 left-3 rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-bg">
                  Popular
                </span>
              ) : null}
              <span className="block text-[13px] font-medium text-muted">{pack.name}</span>
              <span className="mt-1 block text-[22px] font-semibold tracking-[-0.02em] tabular-nums">{pack.credits}</span>
              <span className="block text-[12.5px] text-muted">credits</span>
              <span className="mt-3 block text-[14px] font-medium tabular-nums">
                {busy === pack.id ? "Opening…" : formatPrice(pack, provider === "stripe" ? "usd" : "ngn")}
              </span>
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-[13px] text-danger">{error}</p> : null}

        {demo ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
            <p className="text-[13px] leading-snug text-muted">Demo mode: payments are switched off.</p>
            <button type="button" onClick={demoTopUp} disabled={!!busy} className="h-8 rounded-lg bg-ink px-3 text-[13px] font-medium text-bg disabled:opacity-60">
              {busy === "demo" ? "Adding…" : "Add 5 demo credits"}
            </button>
          </div>
        ) : !configured ? (
          <p className="mt-4 text-[13px] text-muted">Payments are not set up yet. Add your Stripe or Paystack keys to enable checkout.</p>
        ) : null}
      </div>
    </div>
  );
}
