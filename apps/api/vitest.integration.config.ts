import { defineConfig } from 'vitest/config';
import { integrationEnv } from './src/test-support/integration-env.js';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['src/test-support/integration-setup.ts'],
    env: integrationEnv,
    fileParallelism: false,
  },
});
