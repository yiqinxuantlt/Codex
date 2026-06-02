export type ThemeName = "paper" | "night";

export const THEME_STORAGE_KEY = "reading-note-reviewer-theme";

export function getStoredTheme(): ThemeName {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "night" ? "night" : "paper";
  } catch {
    return "paper";
  }
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";
}

export function storeTheme(theme: ThemeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme storage is nice to have; the app should still render without it.
  }

  applyTheme(theme);
}
