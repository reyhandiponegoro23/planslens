// Single source of truth for supported languages.
// To add a language: add its code here, a label/flag below, and messages/<code>.json.
export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

export const localeMeta: Record<Locale, { label: string; flag: string; aiName: string }> = {
  id: { label: "Bahasa Indonesia", flag: "🇮🇩", aiName: "Indonesian (Bahasa Indonesia)" },
  en: { label: "English", flag: "🇬🇧", aiName: "English" },
};

// Cookie read by the server; localStorage key mirrors it on the device.
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "plantlens.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
