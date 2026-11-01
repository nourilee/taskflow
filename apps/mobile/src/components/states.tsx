import { errorMessage } from '@taskflow/api-client';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, shared } from '../lib/theme';
import { Button } from './Button';

export function Loading({ label }: { label: string }) {
  return (
    <View style={shared.notice} testID="loading" accessibilityLabel={label}>
      <ActivityIndicator color={colors.ink} />
      <Text style={shared.body}>{label}</Text>
    </View>
  );
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry(): void }) {
  return (
    <View style={shared.notice} testID="load-error" accessibilityRole="alert">
      <Text style={shared.body}>{errorMessage(error)}</Text>
      <Button label="Try again" testID="retry" onPress={onRetry} />
    </View>
  );
}

export function TaskNotFound() {
  return (
    <View style={shared.notice} testID="task-not-found">
      <Text style={shared.heading} accessibilityRole="header">
        Task not found
      </Text>
      <Text style={shared.body}>This task does not exist or was deleted.</Text>
      <Button
        label="Back to dashboard"
        testID="back-to-dashboard"
        onPress={() => router.dismissTo('/')}
      />
    </View>
  );
}
