import { NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

// Saves the language on this device (cookie the server reads when rendering).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isLocale(body?.locale)) {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }
  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
