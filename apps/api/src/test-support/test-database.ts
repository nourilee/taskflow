import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDatabasePath } from '../db/database-url.js';

export const TEST_DATABASE_FILE_NAME = 'test.db';

export interface TestDatabaseEnv {
  NODE_ENV?: string;
  ENABLE_TEST_UTILITIES?: string;
  DATABASE_URL?: string;
  TEST_DATABASE_URL?: string;
}

// Every destructive test utility calls this first and uses the path it returns.
export function assertTestDatabase(env: TestDatabaseEnv): string {
  if (env.NODE_ENV !== 'test') {
    throw new Error('Refusing to run: NODE_ENV must be "test".');
  }
  if (env.ENABLE_TEST_UTILITIES !== 'true') {
    throw new Error('Refusing to run: ENABLE_TEST_UTILITIES must be "true".');
  }
  if (!env.TEST_DATABASE_URL) {
    throw new Error('Refusing to run: TEST_DATABASE_URL is not set.');
  }

  const target = resolveDatabasePath(env.TEST_DATABASE_URL);
  if (basename(target) !== TEST_DATABASE_FILE_NAME) {
    throw new Error(`Refusing to run: the test database must be named ${TEST_DATABASE_FILE_NAME}.`);
  }
  if (env.DATABASE_URL && resolveDatabasePath(env.DATABASE_URL) === target) {
    throw new Error('Refusing to run: the test database is the same as DATABASE_URL.');
  }
  return target;
}

export function prepareTestDatabase(env: TestDatabaseEnv): string {
  const target = assertTestDatabase(env);
  mkdirSync(dirname(target), { recursive: true });
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    env: { ...process.env, DATABASE_URL: `file:${target}` },
    stdio: 'pipe',
  });
  return target;
}
