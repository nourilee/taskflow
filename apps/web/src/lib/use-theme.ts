import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themes,
  type ThemePreference,
} from '@taskflow/design-tokens';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function subscribeToSystem(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

// Changing theme only swaps CSS variables, so nothing remounts and forms keep their values.
export function useTheme() {
  const [preference, setPreferenceState] = useState(readPreference);
  const systemDark = useSyncExternalStore(
    subscribeToSystem,
    () => window.matchMedia(DARK_QUERY).matches,
  );
  const theme = resolveTheme(preference, systemDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themes[theme].background);
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit when storage is blocked.
    }
  }, []);

  return { preference, setPreference };
}
