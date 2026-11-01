import type { ThemeName } from './tokens.js';

export const THEME_STORAGE_KEY = 'taskflow.theme';
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function parseThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'system';
}

export function resolveTheme(preference: ThemePreference, systemTheme: ThemeName): ThemeName {
  return preference === 'system' ? systemTheme : preference;
}
