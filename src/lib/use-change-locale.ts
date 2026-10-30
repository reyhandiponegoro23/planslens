"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localeMeta, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";
import { toast } from "@/lib/toast";

/** Switches the UI language: cookie (server) + localStorage (device), then re-renders. */
export function useChangeLocale() {
  const active = useLocale();
  const tErr = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState<Locale | null>(null);

  async function change(locale: Locale) {
    if (locale === active || saving) return;
    setSaving(locale);
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {}
      // Confirm in the newly chosen language, since the whole UI is about to switch to it.
      const next = (await import(`../../messages/${locale}.json`)).default.profile as Record<string, string>;
      startTransition(() => router.refresh());
      toast(next.languageSaved.replace("{language}", localeMeta[locale].label), "success");
    } catch {
      toast(tErr("network"), "error");
    } finally {
      setSaving(null);
    }
  }

  return { active, change, busy: pending || saving !== null, saving };
}
