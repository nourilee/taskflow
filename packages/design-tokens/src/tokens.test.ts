import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.js';
import { toCss } from './css.js';
import { parseThemePreference, resolveTheme } from './theme-preference.js';
import { themes, type ThemeColors, type ThemeName } from './tokens.js';

const TEXT_PAIRS: [keyof ThemeColors, keyof ThemeColors][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceHover'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['textMuted', 'surfaceHover'],
  ['onPrimary', 'primary'],
  ['primaryText', 'surface'],
  ['primaryText', 'primaryTint'],
  ['pending', 'pendingTint'],
  ['pending', 'surface'],
  ['inProgress', 'inProgressTint'],
  ['inProgress', 'surface'],
  ['completed', 'completedTint'],
  ['completed', 'surface'],
  ['danger', 'dangerTint'],
  ['danger', 'surface'],
  ['danger', 'background'],
  ['onDanger', 'dangerSolid'],
];

const THEME_NAMES: ThemeName[] = ['light', 'dark'];

describe.each(THEME_NAMES)('%s theme contrast', (name) => {
  const colors = themes[name];

  it.each(TEXT_PAIRS)('%s on %s meets 4.5:1', (foreground, background) => {
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('gives input borders 3:1 against surfaces', () => {
    expect(contrastRatio(colors.borderControl, colors.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('contrastRatio', () => {
  it('matches the known black on white ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
  });
});

describe('theme preference', () => {
  it('defaults missing and unknown values to system', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('sepia')).toBe('system');
  });

  it('keeps a stored preference', () => {
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('follows the system only in system mode', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('light', 'dark')).toBe('light');
  });
});

describe('toCss', () => {
  it('defines the same variables for both themes', () => {
    const css = toCss();
    const [root = '', dark = ''] = css.split(":root[data-theme='dark']");
    const names = (block: string) => block.match(/--color-[\w-]+/g) ?? [];
    expect(names(dark).length).toBeGreaterThan(0);
    expect(names(root)).toEqual(names(dark));
    expect(css).toContain(`--color-surface-hover: ${themes.light.surfaceHover};`);
  });
});
