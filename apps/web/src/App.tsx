import { APP_NAME } from '@taskflow/shared';

export function App() {
  return (
    <main>
      <h1 data-testid="app-title">{APP_NAME}</h1>
    </main>
  );
}
