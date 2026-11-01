import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both src/db and dist/db sit two levels below apps/api.
const API_ROOT = fileURLToPath(new URL('../..', import.meta.url));

// The Prisma CLI and the runtime driver resolve relative paths differently, so
// everything that opens the database resolves its path here first.
export function resolveDatabasePath(url: string): string {
  if (!url.startsWith('file:')) {
    throw new Error('Database URL must be a SQLite file: URL.');
  }
  const path = url.slice('file:'.length);
  if (path.length === 0 || path === ':memory:') {
    throw new Error('Database URL must name a SQLite file.');
  }
  return isAbsolute(path) ? path : resolve(API_ROOT, path);
}

export function absoluteDatabaseUrl(url: string): string {
  return `file:${resolveDatabasePath(url)}`;
}
