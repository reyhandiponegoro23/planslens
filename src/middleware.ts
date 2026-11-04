import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Keeps the Supabase session cookie fresh. No-op until Supabase is configured.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = supabaseUrl;
  const key = supabaseKey;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/schedule/:path*", "/profile/:path*", "/login", "/auth/:path*"],
};
