import { isOverdue, type TaskStatus } from '@taskflow/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createPrismaClient } from '../db/prisma-client.js';
import { PrismaTaskRepository } from '../tasks/prisma-task-repository.js';
import { integrationEnv } from './integration-env.js';
import { SEED_TASKS, seedTasks } from './seed-tasks.js';
import { assertTestDatabase } from './test-database.js';

const prisma = createPrismaClient(`file:${assertTestDatabase(integrationEnv)}`);
const repository = new PrismaTaskRepository(prisma);
const query = { sort: 'dueDate', order: 'asc', page: 1, limit: 100 } as const;

beforeEach(async () => {
  assertTestDatabase(integrationEnv);
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('seedTasks', () => {
  it('produces identical records when run twice', async () => {
    await seedTasks(prisma);
    const first = await repository.list(query);

    await seedTasks(prisma);
    const second = await repository.list(query);

    expect(second).toEqual(first);
    expect(first.total).toBe(SEED_TASKS.length);
  });

  it('keeps tasks with other IDs in place', async () => {
    const existing = await repository.create({
      title: 'My own task',
      priority: 'LOW',
      status: 'PENDING',
    });

    await seedTasks(prisma);

    expect(await repository.findById(existing.id)).not.toBeNull();
  });

  it('makes seeded tasks searchable', async () => {
    await seedTasks(prisma);

    const result = await repository.list({ ...query, search: 'RELEASE' });

    expect(result.items.map((task) => task.id)).toEqual(['seed-pending-future']);
  });

  it('covers the documented overdue cases at any realistic date', () => {
    const overdue = (id: string, today: string) => {
      const task = SEED_TASKS.find((candidate) => candidate.id === id)!;
      return isOverdue({ dueDate: task.dueDate, status: task.status as TaskStatus }, today);
    };

    expect(overdue('seed-pending-overdue', '2026-11-01')).toBe(true);
    expect(overdue('seed-in-progress-overdue', '2098-01-01')).toBe(true);
    expect(overdue('seed-completed-past', '2026-11-01')).toBe(false);
    expect(overdue('seed-pending-future', '2098-01-01')).toBe(false);
    expect(overdue('seed-pending-no-date', '2098-01-01')).toBe(false);
  });
});
