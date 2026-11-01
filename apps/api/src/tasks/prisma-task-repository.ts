import { normalizeTitle, type ListTasksQuery, type Task, type TaskStatus } from '@taskflow/shared';
import type { PrismaClient, Task as TaskRow } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import type { TaskListResult, TaskRepository } from './task-repository.js';

// Prisma does not escape LIKE wildcards in `contains` on SQLite, so % and _ are stored
// and searched as private-use characters that LIKE treats as plain text.
export function toSearchText(title: string): string {
  return normalizeTitle(title).replaceAll('%', '\uE000').replaceAll('_', '\uE001');
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

async function nullIfNotFound<T>(operation: Promise<T>): Promise<T | null> {
  try {
    return await operation;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ListTasksQuery): Promise<TaskListResult> {
    const where: Prisma.TaskWhereInput = {
      status: query.status,
      titleNormalized: query.search ? { contains: toSearchText(query.search) } : undefined,
    };

    const [rows, total, counts] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: [
          { dueDate: { sort: query.order, nulls: 'last' } },
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
      this.prisma.task.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),
    ]);

    const countFor = (status: TaskStatus) =>
      counts.find((count) => count.status === status)?._count._all ?? 0;
    const pending = countFor('PENDING');
    const inProgress = countFor('IN_PROGRESS');
    const completed = countFor('COMPLETED');

    return {
      items: rows.map(toTask),
      total,
      summary: { all: pending + inProgress + completed, pending, inProgress, completed },
    };
  }

  async findById(id: string) {
    const row = await this.prisma.task.findUnique({ where: { id } });
    return row && toTask(row);
  }

  async create(input: Parameters<TaskRepository['create']>[0]) {
    const row = await this.prisma.task.create({
      data: {
        title: input.title,
        titleNormalized: toSearchText(input.title),
        description: input.description ?? null,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate ?? null,
      },
    });
    return toTask(row);
  }

  async update(id: string, input: Parameters<TaskRepository['update']>[1]) {
    const row = await nullIfNotFound(
      this.prisma.task.update({
        where: { id },
        data: {
          title: input.title,
          titleNormalized: toSearchText(input.title),
          description: input.description ?? null,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ?? null,
        },
      }),
    );
    return row && toTask(row);
  }

  async updateStatus(id: string, status: TaskStatus) {
    const row = await nullIfNotFound(this.prisma.task.update({ where: { id }, data: { status } }));
    return row && toTask(row);
  }

  async delete(id: string) {
    const row = await nullIfNotFound(this.prisma.task.delete({ where: { id } }));
    return row !== null;
  }

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
