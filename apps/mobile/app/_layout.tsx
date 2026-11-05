import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppearanceButton, AppearanceSheet } from '../src/components/Appearance';
import { Logo } from '../src/components/Logo';
import { AppProvider } from '../src/lib/app-context';
import { services } from '../src/lib/services';
import { fonts } from '../src/lib/theme';
import { refreshNativeAppearance, ThemeProvider, useTheme } from '../src/lib/theme-context';

// Keeps the dashboard beneath a task opened directly from a deep link.
export const unstable_settings = { initialRouteName: 'index' };

void SplashScreen.preventAutoHideAsync();

const headerRight = () => <AppearanceButton />;
const headerLogo = () => <Logo />;

function Navigator() {
  const { preference, theme, colors, ready } = useTheme();
  const splashHidden = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // If a font fails to load, the app still opens with the system font.
  const loaded = ready && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (loaded && !splashHidden.current) {
      splashHidden.current = true;
      void SplashScreen.hideAsync().then(() => refreshNativeAppearance(preference));
    }
  }, [loaded, preference]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
          headerRight,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'TaskFlow', headerTitle: headerLogo }} />
        <Stack.Screen name="tasks/new" options={{ title: 'Create task' }} />
        <Stack.Screen name="tasks/[taskId]/index" options={{ title: 'Task' }} />
        <Stack.Screen name="tasks/[taskId]/edit" options={{ title: 'Edit task' }} />
      </Stack>
      <AppearanceSheet />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider services={services}>
      <ThemeProvider>
        <Navigator />
      </ThemeProvider>
    </AppProvider>
  );
}
