"use client";

import { useTranslations } from "next-intl";
import { isLocale, locales } from "@/i18n/config";
import { useChangeLocale } from "@/lib/use-change-locale";
import { ChevronDownIcon } from "./Icons";

/** Compact "ID ⌄" picker in the home screen's top bar. */
export default function LanguageSelect() {
  const t = useTranslations("home");
  const { active, change, busy } = useChangeLocale();
  return (
    <label className="lang-select">
      <span className="sr-only">{t("languageMenu")}</span>
      <select value={active} disabled={busy} onChange={(e) => isLocale(e.target.value) && change(e.target.value)}>
        {locales.map((l) => (
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>
      <ChevronDownIcon size={16} />
    </label>
  );
}
