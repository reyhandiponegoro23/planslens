export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];
export const THEME_STORAGE_KEY = "plantlens.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (themes as readonly string[]).includes(value);
}

/** Applies the theme to <html>; "system" removes the override so the OS setting applies. */
export function applyTheme(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

/** Runs before first paint (inlined in <head>) to avoid a flash of the wrong theme. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
