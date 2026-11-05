import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themes,
  type ThemeColors,
  type ThemeName,
  type ThemePreference,
} from '@taskflow/design-tokens';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

interface ThemeValue {
  preference: ThemePreference;
  setPreference(preference: ThemePreference): void;
  theme: ThemeName;
  colors: ThemeColors;
  // False until the stored preference has been read.
  ready: boolean;
  appearanceOpen: boolean;
  setAppearanceOpen(open: boolean): void;
}

const ThemeContext = createContext<ThemeValue>({
  preference: 'system',
  setPreference: () => {},
  theme: 'light',
  colors: themes.light,
  ready: true,
  appearanceOpen: false,
  setAppearanceOpen: () => {},
});

// A mode set during launch does not reach the Android activity, and setting the
// same mode again is ignored. Cycling it once the app is visible applies it.
export function refreshNativeAppearance(preference: ThemePreference) {
  if (Platform.OS === 'android' && preference !== 'system') {
    Appearance.setColorScheme('unspecified');
    Appearance.setColorScheme(preference);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => setPreferenceState(parseThemePreference(stored)))
      .catch(() => setPreferenceState('system'))
      .finally(() => setReady(true));
  }, []);

  // Native alerts and pickers read the app-wide appearance, not React state. Wait
  // for the stored preference, so startup never overrides it with a default.
  useEffect(() => {
    if (ready) {
      Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
    }
  }, [preference, ready]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    // A failed write only loses the choice for later sessions.
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const theme = resolveTheme(preference, scheme === 'dark' ? 'dark' : 'light');
    return {
      preference,
      setPreference,
      theme,
      colors: themes[theme],
      ready,
      appearanceOpen,
      setAppearanceOpen,
    };
  }, [preference, setPreference, scheme, ready, appearanceOpen]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
