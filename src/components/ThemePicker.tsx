"use client";

import { useTranslations } from "next-intl";
import { applyTheme, THEME_STORAGE_KEY, themes } from "@/lib/theme";
import { CheckIcon } from "./Icons";
import { themeLabelKey, useStoredTheme } from "./ThemeValue";

export default function ThemePicker() {
  const t = useTranslations("profile");
  const [theme, setTheme] = useStoredTheme();

  return (
    <ul className="list" role="radiogroup" aria-label={t("theme")}>
      {themes.map((option) => {
        const active = option === theme;
        return (
          <li key={option}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              className={`list-row${active ? " is-active" : ""}`}
              onClick={() => {
                setTheme(option);
                applyTheme(option);
                try {
                  localStorage.setItem(THEME_STORAGE_KEY, option);
                } catch {}
              }}
            >
              <span className="label">{t(themeLabelKey[option])}</span>
              {active && <CheckIcon />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
