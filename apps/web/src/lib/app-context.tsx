import type { ApiClient } from '@taskflow/api-client';
import { createContext, useContext, type ReactNode } from 'react';

export interface AppServices {
  api: ApiClient;
  today(): string;
}

const AppContext = createContext<AppServices | null>(null);

export function AppProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
  return <AppContext.Provider value={services}>{children}</AppContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(AppContext);
  if (!services) {
    throw new Error('useServices must be used inside AppProvider');
  }
  return services;
}
