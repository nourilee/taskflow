import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE_URL, DATABASE_URL, PORT } from './config.js';

const apiDirectory = fileURLToPath(new URL('../../../apps/api', import.meta.url));
const STARTUP_TIMEOUT_MS = 15_000;

async function isHealthy(): Promise<boolean> {
  try {
    return (await fetch(`${BASE_URL}/health`)).ok;
  } catch {
    return false;
  }
}

export default async function setup() {
  if (await isHealthy()) {
    throw new Error(`Port ${PORT} is already serving an API. Stop it before running these tests.`);
  }

  // The reset script runs assertTestDatabase before touching this file.
  execFileSync('pnpm', ['db:test:reset'], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ENABLE_TEST_UTILITIES: 'true',
      DATABASE_URL: 'file:./dev.db',
      TEST_DATABASE_URL: DATABASE_URL,
    },
    stdio: 'pipe',
  });

  const server = spawn('node', ['dist/server.js'], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(PORT),
      DATABASE_URL,
      APP_TIMEZONE: 'UTC',
    },
    stdio: 'inherit',
  });

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (!(await isHealthy())) {
    if (server.exitCode !== null || Date.now() > deadline) {
      server.kill();
      throw new Error('The API did not become healthy in time.');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return () => {
    server.kill();
  };
}
