import {
  fontSize,
  lineHeight,
  radius,
  shadows,
  spacing,
  themes,
  brand,
  type ThemeName,
} from './tokens.js';

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function group(prefix: string, values: Record<string, string | number>, unit = ''): string[] {
  return Object.entries(values).map(
    ([name, value]) => `  --${prefix}-${kebab(name)}: ${value}${unit};`,
  );
}

function theme(name: ThemeName): string[] {
  return [
    `  color-scheme: ${name};`,
    ...group('color', { ...themes[name] }),
    `  --shadow-card: ${shadows[name]};`,
  ];
}

export function toCss(): string {
  const scales = [
    ...group('brand', brand),
    ...group('space', spacing, 'px'),
    ...group('radius', radius, 'px'),
    ...group('font-size', fontSize, 'px'),
    ...group('line-height', lineHeight, 'px'),
  ];
  return [
    ':root {',
    ...scales,
    ...theme('light'),
    '}',
    '',
    ":root[data-theme='dark'] {",
    ...theme('dark'),
    '}',
    '',
  ].join('\n');
}
