"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export function useStoredTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (isTheme(stored)) setTheme(stored);
    } catch {}
  }, []);
  return [theme, setTheme] as const;
}

export const themeLabelKey = { light: "themeLight", dark: "themeDark", system: "themeSystem" } as const;

/** Current theme name shown on the Profile "Tema" row. */
export default function ThemeValue() {
  const t = useTranslations("profile");
  const [theme] = useStoredTheme();
  return <span className="value">{t(themeLabelKey[theme])}</span>;
}
