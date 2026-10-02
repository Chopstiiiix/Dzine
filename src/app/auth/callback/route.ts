import { NextResponse } from "next/server";
import { isDemo, serverConfig } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";

/** Lands here from Google sign-in and from email confirmation links. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next") ?? "";
  const next = /^\/studio(\/[\w-]+)?$/.test(nextParam) ? nextParam : "/studio";
  const code = url.searchParams.get("code");

  if (!isDemo && code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${serverConfig.appUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
  return NextResponse.redirect(`${serverConfig.appUrl}${next}`);
}
