import {
  fontSize,
  radius,
  spacing,
  touchTarget,
  THEME_PREFERENCE_LABELS,
  THEME_PREFERENCES,
  type ThemePreference,
} from '@taskflow/design-tokens';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react-native';
import { useContext } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { fonts, makeStyles, useSharedStyles } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { Button } from './Button';

const ICONS: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

export function AppearanceButton() {
  const { theme, colors, setAppearanceOpen } = useTheme();
  const Icon = theme === 'dark' ? Moon : Sun;
  return (
    <Pressable
      testID="open-appearance"
      accessibilityRole="button"
      accessibilityLabel="Appearance"
      hitSlop={spacing.sm}
      onPress={() => setAppearanceOpen(true)}
      style={{ minWidth: touchTarget, minHeight: touchTarget, justifyContent: 'center' }}
    >
      <Icon size={22} color={colors.text} style={{ alignSelf: 'center' }} />
    </Pressable>
  );
}

// Lives beside the navigator, so changing theme never closes it or touches a screen.
export function AppearanceSheet() {
  const { preference, setPreference, colors, appearanceOpen, setAppearanceOpen } = useTheme();
  const styles = useStyles();
  const shared = useSharedStyles();
  const bottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const close = () => setAppearanceOpen(false);

  return (
    <Modal visible={appearanceOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={close} accessible={false} />
        <View
          testID="appearance-sheet"
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: spacing.lg + bottom }]}
        >
          <Text style={shared.heading} accessibilityRole="header">
            Appearance
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Appearance"
            style={styles.options}
          >
            {THEME_PREFERENCES.map((option) => {
              const selected = option === preference;
              const Icon = ICONS[option];
              const color = selected ? colors.primaryText : colors.text;
              return (
                <Pressable
                  key={option}
                  testID={`theme-option-${option}`}
                  accessibilityRole="radio"
                  accessibilityLabel={THEME_PREFERENCE_LABELS[option]}
                  accessibilityState={{ selected }}
                  onPress={() => setPreference(option)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Icon size={20} color={color} />
                  <Text style={[styles.optionText, { color }]}>
                    {THEME_PREFERENCE_LABELS[option]}
                  </Text>
                  {option === 'system' && <Text style={shared.muted}>Match device</Text>}
                </Pressable>
              );
            })}
          </View>
          <Button label="Done" testID="close-appearance" variant="quiet" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  dismiss: { flex: 1 },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.surface,
  },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  optionText: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md },
}));
