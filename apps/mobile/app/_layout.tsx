import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/lib/app-context';
import { services } from '../src/lib/services';
import { colors } from '../src/lib/theme';

// Keeps the dashboard beneath a task opened directly from a deep link.
export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  return (
    <AppProvider services={services}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.surface,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'TaskFlow' }} />
        <Stack.Screen name="tasks/new" options={{ title: 'Create task' }} />
        <Stack.Screen name="tasks/[taskId]/index" options={{ title: 'Task' }} />
        <Stack.Screen name="tasks/[taskId]/edit" options={{ title: 'Edit task' }} />
      </Stack>
    </AppProvider>
  );
}
