import { createApiClient } from '@taskflow/api-client';
import { localToday } from '@taskflow/shared';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { AppProvider } from './lib/app-context';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

const services = {
  api: createApiClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  }),
  today: () => localToday(),
};

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider services={services}>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
