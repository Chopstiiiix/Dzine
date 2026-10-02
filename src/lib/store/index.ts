import { isDemo } from "@/lib/config";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";
import { MemoryStore, demoAddCredits } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

export type Session = { store: Store; userId: string; email: string | null };

/** The data store for the current request, or null when nobody is signed in. */
export async function getSession(): Promise<Session | null> {
  if (isDemo) return { store: new MemoryStore(), userId: "demo", email: "demo@dzine.local" };
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    store: new SupabaseStore(supabase, data.user.id, createAdminSupabase()),
    userId: data.user.id,
    email: data.user.email ?? null,
  };
}

/**
 * Adds credits to an account (purchases and refunds). Idempotent per `ref`.
 * Needs SUPABASE_SERVICE_ROLE_KEY outside demo mode.
 */
export async function grantCredits(userId: string, credits: number, reason: string, ref: string): Promise<number | null> {
  if (isDemo) return demoAddCredits(credits);
  const admin = createAdminSupabase();
  if (!admin) {
    console.error(`[dzine] SUPABASE_SERVICE_ROLE_KEY is not set: could not grant ${credits} credits to ${userId} (${reason}).`);
    return null;
  }
  const { data, error } = await admin.rpc("dzine_grant_credits", {
    p_user: userId,
    p_credits: credits,
    p_reason: reason,
    p_ref: ref,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export * from "./types";
