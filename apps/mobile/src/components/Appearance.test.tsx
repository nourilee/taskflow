import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { themes } from '@taskflow/design-tokens';
import { Appearance, Platform, Text, useColorScheme } from 'react-native';
import appConfig from '../../app.json';
import { refreshNativeAppearance, ThemeProvider, useTheme } from '../lib/theme-context';
import { AppearanceButton, AppearanceSheet } from './Appearance';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

function Probe() {
  const { theme, ready } = useTheme();
  return <Text testID="probe">{ready ? theme : 'waiting'}</Text>;
}

async function open() {
  await render(
    <ThemeProvider>
      <AppearanceButton />
      <AppearanceSheet />
      <Probe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('probe')).not.toHaveTextContent('waiting'));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.mocked(useColorScheme).mockReturnValue('light');
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});

describe('Appearance', () => {
  it('defaults to System and follows the device', async () => {
    jest.mocked(useColorScheme).mockReturnValue('dark');
    await open();

    expect(screen.getByTestId('probe')).toHaveTextContent('dark');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });

  it('applies and stores a chosen theme, and stays open', async () => {
    await open();

    await fireEvent.press(screen.getByTestId('open-appearance'));
    await fireEvent.press(screen.getByTestId('theme-option-dark'));

    expect(screen.getByTestId('probe')).toHaveTextContent('dark');
    expect(screen.getByTestId('appearance-sheet')).toBeOnTheScreen();
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
    await waitFor(async () => expect(await AsyncStorage.getItem('taskflow.theme')).toBe('dark'));
  });

  it('restores the stored theme in a later session', async () => {
    await act(() => AsyncStorage.setItem('taskflow.theme', 'dark'));
    await open();

    expect(screen.getByTestId('probe')).toHaveTextContent('dark');
  });

  it('closes with Done', async () => {
    await open();

    await fireEvent.press(screen.getByTestId('open-appearance'));
    await fireEvent.press(screen.getByTestId('close-appearance'));

    expect(screen.queryByTestId('appearance-sheet')).toBeNull();
  });
});

describe('refreshNativeAppearance', () => {
  const calls = () => jest.mocked(Appearance.setColorScheme).mock.calls.flat();

  it('cycles the mode on Android, because repeating a mode is ignored', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    refreshNativeAppearance('light');

    expect(calls()).toEqual(['unspecified', 'light']);
  });

  it('leaves System mode alone on Android', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    refreshNativeAppearance('system');

    expect(calls()).toEqual([]);
  });

  it('does nothing on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');

    refreshNativeAppearance('dark');

    expect(calls()).toEqual([]);
  });
});

describe('Android accent', () => {
  it('matches the primary tokens', () => {
    const plugin = appConfig.expo.plugins.find(
      (entry) => Array.isArray(entry) && entry[0] === './plugins/with-android-accent',
    );

    expect(plugin?.[1]).toEqual({ light: themes.light.primary, dark: themes.dark.primary });
  });
});
