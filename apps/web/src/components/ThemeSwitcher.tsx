import {
  THEME_PREFERENCE_LABELS,
  THEME_PREFERENCES,
  type ThemePreference,
} from '@taskflow/design-tokens';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from '../lib/use-theme';

const ICONS: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset className="theme-switcher" data-testid="theme-switcher">
      <legend className="sr-only">Appearance</legend>
      {THEME_PREFERENCES.map((option) => {
        const Icon = ICONS[option];
        return (
          <label key={option} className="theme-option" title={THEME_PREFERENCE_LABELS[option]}>
            <input
              type="radio"
              className="sr-only"
              name="theme"
              checked={preference === option}
              onChange={() => setPreference(option)}
              data-testid={`theme-option-${option}`}
            />
            <Icon aria-hidden size={16} />
            <span className="sr-only">{THEME_PREFERENCE_LABELS[option]}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
