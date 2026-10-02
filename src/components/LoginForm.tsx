"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { FREE_CREDITS } from "@/lib/config";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Logo } from "./Logo";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sent, setSent] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.assign(next);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback() } });
      if (error) setError(error.message);
      else if (data.session) window.location.assign(next);
      else setSent(true); // Email confirmation is switched on.
    }
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Link href="/" aria-label="Dzine home">
        <Logo size={22} />
      </Link>

      <div className="mt-8 w-full max-w-[360px]">
        {sent ? (
          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Check your email</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              We sent a confirmation link to {email}. Open it on this device to start designing.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-center text-[22px] font-semibold tracking-[-0.02em]">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-center text-[14.5px] text-muted">
              {mode === "signup" ? `Your first ${FREE_CREDITS} designs are free.` : "Sign in to pick up where you left off."}
            </p>

            <button
              type="button"
              onClick={() => void google()}
              className="mt-7 h-11 w-full rounded-xl border border-line bg-panel text-[14.5px] font-medium transition hover:bg-soft"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[12px] text-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border border-line bg-panel px-3.5 text-[15px] font-normal outline-none transition focus:border-faint"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border border-line bg-panel px-3.5 text-[15px] font-normal outline-none transition focus:border-faint"
                />
              </label>
              {error ? (
                <p role="alert" className="text-[13px] text-danger">
                  {error}
                </p>
              ) : null}
              <button type="submit" disabled={busy} className="mt-1 h-11 rounded-xl bg-ink text-[14.5px] font-medium text-bg transition disabled:opacity-50">
                {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-[13.5px] text-muted">
              {mode === "signup" ? "Already have an account?" : "New to Dzine?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setError(null);
                }}
                className="font-medium text-ink underline underline-offset-2"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
