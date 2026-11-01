import { createApiClient } from '@taskflow/api-client';
import { localToday } from '@taskflow/shared';
import { Platform } from 'react-native';
import type { AppServices } from './app-context';

const defaultBaseUrl = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const services: AppServices = {
  api: createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl }),
  today: () => localToday(),
};
