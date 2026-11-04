import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Target of the email sign-in link: swaps the one-time code for a session cookie.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/schedule";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/schedule";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=1", url.origin));
}
