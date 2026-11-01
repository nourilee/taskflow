import type { TestDatabaseEnv } from './test-database.js';

export const integrationEnv = {
  NODE_ENV: 'test',
  ENABLE_TEST_UTILITIES: 'true',
  DATABASE_URL: 'file:./dev.db',
  TEST_DATABASE_URL: 'file:./.test-data/integration/test.db',
} satisfies TestDatabaseEnv;
