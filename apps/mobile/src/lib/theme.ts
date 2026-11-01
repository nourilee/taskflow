import {
  brand,
  fontSize,
  lineHeight,
  radius,
  spacing,
  themes,
  touchTarget,
  type ThemeColors,
  type ThemeName,
} from '@taskflow/design-tokens';
import type { TaskStatus } from '@taskflow/shared';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './theme-context';

// Android ignores fontWeight on custom fonts, so each weight is its own family.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function statusColors(colors: ThemeColors, status: TaskStatus) {
  return {
    PENDING: { color: colors.pending, tint: colors.pendingTint },
    IN_PROGRESS: { color: colors.inProgress, tint: colors.inProgressTint },
    COMPLETED: { color: colors.completed, tint: colors.completedTint },
  }[status];
}

// Light surfaces lift with a violet-tinted shadow. Dark surfaces rely on their border.
export function cardShadow(theme: ThemeName) {
  return theme === 'light'
    ? {
        shadowColor: brand.violet,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }
    : {};
}

type Style = ViewStyle & TextStyle;

// Styles are built once per theme, so switching theme never remounts a screen.
export function makeStyles<Name extends string>(
  build: (colors: ThemeColors, theme: ThemeName) => Record<Name, Style>,
) {
  const cache = new Map<ThemeName, Record<Name, Style>>();
  return function useStyles(): Record<Name, Style> {
    const { theme } = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      styles = StyleSheet.create(build(themes[theme], theme));
      cache.set(theme, styles);
    }
    return styles;
  };
}

export const useSharedStyles = makeStyles((colors, theme) => ({
  notice: {
    gap: spacing.md,
    alignItems: 'flex-start',
    margin: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...cardShadow(theme),
  },
  heading: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  body: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  muted: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  input: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
}));
