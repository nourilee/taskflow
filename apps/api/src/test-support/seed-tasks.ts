import type { PrismaClient } from '../generated/prisma/client.js';
import { toSearchText } from '../tasks/prisma-task-repository.js';

const SEEDED_AT = new Date('2026-01-01T09:00:00.000Z');

// Fixed IDs and dates keep results identical on every run. The past and far-future
// due dates mean overdue checks do not depend on today's date.
export const SEED_TASKS = [
  {
    id: 'seed-pending-overdue',
    title: 'Renew project license',
    description: 'Overdue and still pending.',
    priority: 'HIGH',
    status: 'PENDING',
    dueDate: '2020-01-15',
  },
  {
    id: 'seed-in-progress-overdue',
    title: 'Review test coverage',
    description: 'Overdue and in progress.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2020-03-01',
  },
  {
    id: 'seed-completed-past',
    title: 'Archive old reports',
    description: 'Past due date, but completed, so not overdue.',
    priority: 'LOW',
    status: 'COMPLETED',
    dueDate: '2020-02-10',
  },
  {
    id: 'seed-pending-future',
    title: 'Plan release notes',
    description: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2099-06-30',
  },
  {
    id: 'seed-in-progress-future',
    title: 'Prepare demo script',
    description: 'Due in the far future.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2099-09-15',
  },
  {
    id: 'seed-pending-no-date',
    title: 'Tidy backlog notes',
    description: 'No due date, so it sorts last.',
    priority: 'LOW',
    status: 'PENDING',
    dueDate: null,
  },
] as const;

export async function seedTasks(prisma: PrismaClient): Promise<void> {
  for (const task of SEED_TASKS) {
    const data = {
      ...task,
      titleNormalized: toSearchText(task.title),
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    };
    await prisma.task.upsert({ where: { id: task.id }, create: data, update: data });
  }
}
