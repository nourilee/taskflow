import { fontSize, radius, spacing, touchTarget } from '@taskflow/design-tokens';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { fonts, makeStyles } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

interface ButtonProps {
  label: string;
  testID: string;
  onPress(): void;
  variant?: 'solid' | 'quiet' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  icon?: LucideIcon;
}

export function Button({
  label,
  testID,
  onPress,
  variant = 'solid',
  disabled,
  busy,
  icon: Icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = {
    solid: colors.onPrimary,
    quiet: colors.text,
    danger: colors.danger,
  }[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'quiet' && styles.quiet,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {busy && <ActivityIndicator size="small" color={color} />}
      {Icon && !busy && <Icon size={18} color={color} />}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  quiet: { backgroundColor: colors.surface, borderColor: colors.borderControl },
  danger: { backgroundColor: 'transparent', borderColor: colors.danger },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  text: { fontFamily: fonts.semibold, fontSize: fontSize.md },
}));
