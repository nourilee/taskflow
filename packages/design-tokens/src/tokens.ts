// The accent hues fall below 4.5:1 on white, so they are fills, not text. Each
// theme below has text shades of the same hues. See docs/DESIGN_SYSTEM.md.
export const brand = {
  violet: '#7955E8',
  coral: '#FF718B',
  teal: '#21BFA6',
  amber: '#FFBD59',
  blue: '#5B9CF5',
} as const;

export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  border: string;
  borderControl: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  primaryTint: string;
  primaryText: string;
  pending: string;
  pendingTint: string;
  inProgress: string;
  inProgressTint: string;
  completed: string;
  completedTint: string;
  danger: string;
  dangerTint: string;
  dangerSolid: string;
  onDanger: string;
  scrim: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    background: '#F7F6FC',
    surface: '#FFFFFF',
    surfaceHover: '#F1EEFA',
    text: '#29243B',
    textMuted: '#625C78',
    border: '#E9E5F3',
    borderControl: '#8A84A0',
    primary: brand.violet,
    primaryHover: '#6A45DE',
    onPrimary: '#FFFFFF',
    primaryTint: '#EFEAFD',
    primaryText: '#6A45DE',
    pending: '#8F5A00',
    pendingTint: '#FFF3DF',
    inProgress: '#2A62BE',
    inProgressTint: '#E9F2FE',
    completed: '#0B7566',
    completedTint: '#E2F7F3',
    danger: '#B4254B',
    dangerTint: '#FFEDF1',
    dangerSolid: '#B4254B',
    onDanger: '#FFFFFF',
    scrim: 'rgba(41, 36, 59, 0.55)',
  },
  dark: {
    background: '#171624',
    surface: '#242235',
    surfaceHover: '#2E2B42',
    text: '#F3F0FA',
    textMuted: '#ADA7C2',
    border: '#39354C',
    borderControl: '#8A84A0',
    primary: '#A58BFF',
    primaryHover: '#B7A2FF',
    onPrimary: '#171624',
    primaryTint: '#322C55',
    primaryText: '#A58BFF',
    pending: '#FFCF85',
    pendingTint: '#3B3026',
    inProgress: '#93BEFA',
    inProgressTint: '#26304A',
    completed: '#5FDCC6',
    completedTint: '#1E3A3C',
    danger: '#FF9DB0',
    dangerTint: '#3D2636',
    dangerSolid: '#FF9DB0',
    onDanger: '#171624',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, pill: 999 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const lineHeight = { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 } as const;
export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export const touchTarget = 44;

// Dark surfaces separate by border and tone, so only the light theme has a shadow.
export const shadows: Record<ThemeName, string> = {
  light: '0 1px 2px rgb(41 36 59 / 5%), 0 6px 20px rgb(121 85 232 / 7%)',
  dark: 'none',
};
