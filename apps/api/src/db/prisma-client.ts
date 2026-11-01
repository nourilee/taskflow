import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';
import { absoluteDatabaseUrl } from './database-url.js';

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: absoluteDatabaseUrl(databaseUrl) });
  return new PrismaClient({ adapter });
}
