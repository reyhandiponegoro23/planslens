import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Target of the email sign-in link: swaps the one-time code for a session cookie.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Set by EmailLogin before sending the link (the link itself carries no query string).
  const cookieStore = await cookies();
  const saved = decodeURIComponent(cookieStore.get("plantlens_next")?.value ?? "");
  const next = saved.startsWith("/") && !saved.startsWith("//") ? saved : "/schedule";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(new URL(next, url.origin));
      res.cookies.delete("plantlens_next");
      return res;
    }
  }
  return NextResponse.redirect(new URL("/login?error=1", url.origin));
}
