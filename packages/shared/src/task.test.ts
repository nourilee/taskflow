import { describe, expect, it } from 'vitest';
import {
  changeTaskStatusSchema,
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from './task.js';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message);

describe('createTaskSchema', () => {
  it('applies priority and status defaults', () => {
    expect(createTaskSchema.parse({ title: 'Write tests' })).toEqual({
      title: 'Write tests',
      priority: 'MEDIUM',
      status: 'PENDING',
    });
  });

  it('trims title whitespace', () => {
    expect(createTaskSchema.parse({ title: '  Write tests  ' }).title).toBe('Write tests');
  });

  it.each([
    ['3 characters', 'abc'],
    ['100 characters', 'a'.repeat(100)],
    ['100 characters after trimming', ` ${'a'.repeat(100)} `],
  ])('accepts a title of %s', (_name, title) => {
    expect(createTaskSchema.safeParse({ title }).success).toBe(true);
  });

  it.each([
    ['2 characters', 'ab'],
    ['2 characters after trimming', '  ab  '],
    ['101 characters', 'a'.repeat(101)],
    ['only whitespace', '     '],
  ])('rejects a title of %s', (_name, title) => {
    expect(createTaskSchema.safeParse({ title }).success).toBe(false);
  });

  it('reports the documented title message', () => {
    expect(messages(createTaskSchema.safeParse({ title: 'ab' }))).toEqual([
      'Title must contain at least 3 characters.',
    ]);
  });

  it('accepts a 500 character description and rejects 501', () => {
    const base = { title: 'Valid title' };
    expect(createTaskSchema.safeParse({ ...base, description: 'a'.repeat(500) }).success).toBe(
      true,
    );
    expect(createTaskSchema.safeParse({ ...base, description: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });

  it.each([['URGENT'], ['low'], [1]])('rejects priority %s', (priority) => {
    expect(createTaskSchema.safeParse({ title: 'Valid title', priority }).success).toBe(false);
  });

  it.each([['DONE'], ['pending']])('rejects status %s', (status) => {
    expect(createTaskSchema.safeParse({ title: 'Valid title', status }).success).toBe(false);
  });

  it.each([['2026-02-30'], ['2026-13-01'], ['11/01/2026'], ['2026-11-01T00:00:00Z']])(
    'rejects due date %s',
    (dueDate) => {
      expect(createTaskSchema.safeParse({ title: 'Valid title', dueDate }).success).toBe(false);
    },
  );

  it('accepts a leap day', () => {
    const input = { title: 'Valid title', dueDate: '2028-02-29' };
    expect(createTaskSchema.safeParse(input).success).toBe(true);
  });

  it.each([['id'], ['createdAt'], ['updatedAt']])('rejects a client-supplied %s', (field) => {
    expect(createTaskSchema.safeParse({ title: 'Valid title', [field]: 'x' }).success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  const valid = { title: 'Valid title', priority: 'HIGH', status: 'PENDING' };

  it('accepts the required fields alone', () => {
    expect(updateTaskSchema.safeParse(valid).success).toBe(true);
  });

  it.each([['title'], ['priority'], ['status']])('requires %s', (field) => {
    const input = Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field));
    expect(updateTaskSchema.safeParse(input).success).toBe(false);
  });
});

describe('changeTaskStatusSchema', () => {
  it('requires a valid status', () => {
    expect(changeTaskStatusSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
    expect(changeTaskStatusSchema.safeParse({ status: 'DONE' }).success).toBe(false);
    expect(changeTaskStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe('listTasksQuerySchema', () => {
  it('applies defaults', () => {
    expect(listTasksQuerySchema.parse({})).toEqual({
      sort: 'dueDate',
      order: 'asc',
      page: 1,
      limit: 20,
    });
  });

  it('coerces numeric query strings', () => {
    expect(listTasksQuerySchema.parse({ page: '2', limit: '100' })).toMatchObject({
      page: 2,
      limit: 100,
    });
  });

  it.each([
    ['page 0', { page: '0' }],
    ['a non-numeric page', { page: 'one' }],
    ['limit 0', { limit: '0' }],
    ['limit above the maximum', { limit: '101' }],
    ['a fractional limit', { limit: '1.5' }],
    ['an unknown status', { status: 'DONE' }],
    ['an unsupported sort', { sort: 'title' }],
    ['an unsupported order', { order: 'up' }],
    ['an unknown parameter', { owner: 'me' }],
  ])('rejects %s', (_name, query) => {
    expect(listTasksQuerySchema.safeParse(query).success).toBe(false);
  });
});
