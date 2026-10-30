"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLocale, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";

/**
 * Keeps localStorage equal to the active locale, and restores the last choice from
 * localStorage if the cookie was cleared.
 */
export default function LocaleSync({ active }: { active: Locale }) {
  const router = useRouter();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {}
    const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(`${LOCALE_COOKIE}=`));

    if (!hasCookie && isLocale(stored) && stored !== active) {
      fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: stored }),
      }).then(() => router.refresh());
      return;
    }
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, active);
    } catch {}
    if (!hasCookie) {
      document.cookie = `${LOCALE_COOKIE}=${active}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [active, router]);

  return null;
}
