import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';
import { absoluteDatabaseUrl } from './src/db/database-url.js';

const envFile = new URL('../../.env', import.meta.url);
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: absoluteDatabaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db') },
});
