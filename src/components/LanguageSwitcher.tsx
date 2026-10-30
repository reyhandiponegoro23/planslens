"use client";

import { useTranslations } from "next-intl";
import { localeMeta, locales } from "@/i18n/config";
import { useChangeLocale } from "@/lib/use-change-locale";
import { CheckIcon } from "./Icons";

/** Full list used on the Language settings page. */
export default function LanguageSwitcher() {
  const t = useTranslations("profile");
  const { active, change, busy, saving } = useChangeLocale();

  return (
    <ul className="list" role="radiogroup" aria-label={t("language")}>
      {locales.map((locale) => {
        const isActive = locale === active;
        return (
          <li key={locale}>
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`list-row${isActive ? " is-active" : ""}`}
              disabled={busy}
              onClick={() => change(locale)}
              lang={locale}
            >
              <span className="flag" aria-hidden>{localeMeta[locale].flag}</span>
              <span className="label">{localeMeta[locale].label}</span>
              {saving === locale && <span className="spinner" aria-hidden />}
              {isActive && <CheckIcon />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
