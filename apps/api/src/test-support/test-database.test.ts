import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertTestDatabase, type TestDatabaseEnv } from './test-database.js';

const safe: TestDatabaseEnv = {
  NODE_ENV: 'test',
  ENABLE_TEST_UTILITIES: 'true',
  DATABASE_URL: 'file:./dev.db',
  TEST_DATABASE_URL: 'file:./.test-data/unit/test.db',
};

describe('assertTestDatabase', () => {
  it('returns the resolved path for a safe configuration', () => {
    expect(basename(assertTestDatabase(safe))).toBe('test.db');
  });

  it.each<[string, TestDatabaseEnv, RegExp]>([
    ['production', { ...safe, NODE_ENV: 'production' }, /NODE_ENV/],
    ['development', { ...safe, NODE_ENV: 'development' }, /NODE_ENV/],
    ['a missing NODE_ENV', { ...safe, NODE_ENV: undefined }, /NODE_ENV/],
    ['disabled utilities', { ...safe, ENABLE_TEST_UTILITIES: 'false' }, /ENABLE_TEST_UTILITIES/],
    ['missing utilities flag', { ...safe, ENABLE_TEST_UTILITIES: undefined }, /ENABLE_TEST/],
    ['a missing target', { ...safe, TEST_DATABASE_URL: undefined }, /TEST_DATABASE_URL/],
    ['the dev database', { ...safe, TEST_DATABASE_URL: 'file:./dev.db' }, /must be named/],
    ['a similar file name', { ...safe, TEST_DATABASE_URL: 'file:./test.db.bak' }, /must be named/],
    ['a non-file URL', { ...safe, TEST_DATABASE_URL: 'postgresql://db/test.db' }, /file: URL/],
    ['an in-memory URL', { ...safe, TEST_DATABASE_URL: 'file::memory:' }, /SQLite file/],
    [
      'a target matching DATABASE_URL',
      { ...safe, DATABASE_URL: 'file:./test.db', TEST_DATABASE_URL: 'file:./test.db' },
      /same as DATABASE_URL/,
    ],
    [
      'the same file reached by another path',
      { ...safe, DATABASE_URL: 'file:./a/../test.db', TEST_DATABASE_URL: 'file:./test.db' },
      /same as DATABASE_URL/,
    ],
  ])('refuses %s', (_name, env, message) => {
    expect(() => assertTestDatabase(env)).toThrow(message);
  });
});
