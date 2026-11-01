import { Pressable, Text } from 'react-native';
import { shared } from '../lib/theme';

interface ButtonProps {
  label: string;
  testID: string;
  onPress(): void;
  variant?: 'solid' | 'quiet' | 'danger';
  disabled?: boolean;
}

export function Button({ label, testID, onPress, variant = 'solid', disabled }: ButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        shared.button,
        variant === 'quiet' && shared.quiet,
        variant === 'danger' && shared.dangerQuiet,
        disabled && shared.disabled,
      ]}
    >
      <Text
        style={[
          shared.buttonText,
          variant === 'quiet' && shared.quietText,
          variant === 'danger' && shared.dangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
