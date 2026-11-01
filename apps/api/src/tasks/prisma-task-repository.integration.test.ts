import { createTaskSchema, updateTaskSchema } from '@taskflow/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createPrismaClient } from '../db/prisma-client.js';
import { integrationEnv } from '../test-support/integration-env.js';
import { assertTestDatabase } from '../test-support/test-database.js';
import { PrismaTaskRepository } from './prisma-task-repository.js';

const prisma = createPrismaClient(`file:${assertTestDatabase(integrationEnv)}`);
const repository = new PrismaTaskRepository(prisma);

const createTask = (input: Record<string, unknown>) =>
  repository.create(createTaskSchema.parse(input));
const listQuery = { sort: 'dueDate', order: 'asc', page: 1, limit: 20 } as const;
const titles = async (query = {}) =>
  (await repository.list({ ...listQuery, ...query })).items.map((task) => task.title);

beforeEach(async () => {
  assertTestDatabase(integrationEnv);
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('PrismaTaskRepository', () => {
  it('persists a task and generates its id and timestamps', async () => {
    const created = await createTask({
      title: 'Write tests',
      description: 'Cover the repository',
      priority: 'HIGH',
      dueDate: '2099-06-30',
    });

    expect(await repository.findById(created.id)).toEqual(created);
    expect(created).toMatchObject({
      id: expect.any(String),
      status: 'PENDING',
      dueDate: '2099-06-30',
      createdAt: expect.stringMatching(/Z$/),
    });
    expect(created).not.toHaveProperty('titleNormalized');
  });

  it('stores missing optional fields as null', async () => {
    const created = await createTask({ title: 'Minimal task' });

    expect(created).toMatchObject({ description: null, dueDate: null });
  });

  it('allows duplicate titles', async () => {
    const first = await createTask({ title: 'Same title' });
    const second = await createTask({ title: 'Same title' });

    expect(first.id).not.toBe(second.id);
  });

  it('returns null when a task does not exist', async () => {
    const input = updateTaskSchema.parse({ title: 'New', priority: 'LOW', status: 'PENDING' });

    expect(await repository.findById('missing')).toBeNull();
    expect(await repository.update('missing', input)).toBeNull();
    expect(await repository.updateStatus('missing', 'COMPLETED')).toBeNull();
    expect(await repository.delete('missing')).toBe(false);
  });

  it('replaces editable fields, clears omitted ones, and advances updatedAt', async () => {
    const created = await createTask({
      title: 'Before',
      description: 'Old description',
      dueDate: '2099-06-30',
    });

    const updated = await repository.update(
      created.id,
      updateTaskSchema.parse({ title: 'After', priority: 'LOW', status: 'IN_PROGRESS' }),
    );

    expect(updated).toMatchObject({
      title: 'After',
      description: null,
      dueDate: null,
      priority: 'LOW',
      status: 'IN_PROGRESS',
      createdAt: created.createdAt,
    });
    expect(Date.parse(updated!.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));
    expect(await titles({ search: 'after' })).toEqual(['After']);
    expect(await titles({ search: 'before' })).toEqual([]);
  });

  it('updates status alone', async () => {
    const created = await createTask({ title: 'Status task', description: 'Keep me' });

    const updated = await repository.updateStatus(created.id, 'IN_PROGRESS');

    expect(updated).toMatchObject({ status: 'IN_PROGRESS', description: 'Keep me' });
  });

  it('deletes a task', async () => {
    const created = await createTask({ title: 'Delete me' });

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.findById(created.id)).toBeNull();
  });

  describe('search', () => {
    it.each([
      ['lowercase term, mixed-case title', 'Plan Release', 'plan'],
      ['uppercase term, mixed-case title', 'Plan Release', 'RELEASE'],
      ['middle of a word', 'Automation', 'tomat'],
      ['uppercase non-ASCII term', 'été plans', 'ÉTÉ'],
      ['lowercase non-ASCII term', 'ÉTÉ PLANS', 'été'],
      ['decomposed term', 'Café notes', 'cafe\u0301'],
    ])('matches: %s', async (_name, title, search) => {
      await createTask({ title });

      expect(await titles({ search })).toEqual([title]);
    });

    it.each([
      ['%', 'Discount 100% off', 'Discount 100 off'],
      ['_', 'snake_case name', 'snakeXcase name'],
    ])('treats %s as a literal character', async (char, match, other) => {
      await createTask({ title: match });
      await createTask({ title: other });

      expect(await titles({ search: char })).toEqual([match]);
    });

    it('treats a backslash as a literal character', async () => {
      await createTask({ title: 'Path C:\\temp' });
      await createTask({ title: 'Plain path' });

      expect(await titles({ search: '\\' })).toEqual(['Path C:\\temp']);
    });
  });

  it('filters by status and combines with search', async () => {
    const started = await createTask({ title: 'Alpha started', status: 'IN_PROGRESS' });
    await createTask({ title: 'Alpha waiting' });
    await createTask({ title: 'Beta started', status: 'IN_PROGRESS' });

    const result = await repository.list({ ...listQuery, status: 'IN_PROGRESS', search: 'alpha' });

    expect(result.items.map((task) => task.id)).toEqual([started.id]);
    expect(result.total).toBe(1);
  });

  describe('sorting', () => {
    beforeEach(async () => {
      await createTask({ title: 'No date' });
      await createTask({ title: 'Later', dueDate: '2099-12-31' });
      await createTask({ title: 'Sooner', dueDate: '2099-01-01' });
    });

    it('sorts ascending with no due date last', async () => {
      expect(await titles({ order: 'asc' })).toEqual(['Sooner', 'Later', 'No date']);
    });

    it('sorts descending with no due date still last', async () => {
      expect(await titles({ order: 'desc' })).toEqual(['Later', 'Sooner', 'No date']);
    });
  });

  it('paginates without repeating tasks and reports the total', async () => {
    for (const title of ['One', 'Two', 'Three', 'Four', 'Five']) {
      await createTask({ title });
    }

    const pageOne = await repository.list({ ...listQuery, page: 1, limit: 2 });
    const pageThree = await repository.list({ ...listQuery, page: 3, limit: 2 });
    const pageFour = await repository.list({ ...listQuery, page: 4, limit: 2 });

    expect(pageOne.items).toHaveLength(2);
    expect(pageThree.items).toHaveLength(1);
    expect(pageFour.items).toEqual([]);
    expect(pageOne.total).toBe(5);
  });

  it('reports summary counts for all tasks regardless of filters', async () => {
    await createTask({ title: 'Alpha one' });
    await createTask({ title: 'Beta two', status: 'IN_PROGRESS' });
    await createTask({ title: 'Gamma three', status: 'COMPLETED' });
    await createTask({ title: 'Delta four', status: 'COMPLETED' });

    const result = await repository.list({ ...listQuery, status: 'PENDING', search: 'alpha' });

    expect(result.total).toBe(1);
    expect(result.summary).toEqual({ all: 4, pending: 1, inProgress: 1, completed: 2 });
  });

  it('reports zero counts when empty', async () => {
    expect((await repository.list(listQuery)).summary).toEqual({
      all: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    });
  });

  it('answers a database ping', async () => {
    await expect(repository.ping()).resolves.toBeUndefined();
  });

  it('rejects a ping when the database cannot be opened', async () => {
    const broken = createPrismaClient('file:/nonexistent-directory/test.db');

    await expect(new PrismaTaskRepository(broken).ping()).rejects.toThrow();
    await broken.$disconnect();
  });
});
