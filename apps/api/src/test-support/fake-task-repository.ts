import type { Task, TaskStatus } from '@taskflow/shared';
import type { TaskRepository } from '../tasks/task-repository.js';

const TIMESTAMP = '2026-11-01T09:00:00.000Z';

// Stands in for the database in unit tests. Query behaviour is covered by the integration tests.
export class FakeTaskRepository implements TaskRepository {
  readonly tasks = new Map<string, Task>();
  private nextId = 1;

  seed(overrides: Partial<Task> = {}): Task {
    const id = overrides.id ?? `task-${this.nextId++}`;
    const task: Task = {
      id,
      title: 'Seeded task',
      description: null,
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: null,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
      ...overrides,
    };
    this.tasks.set(id, task);
    return task;
  }

  async list() {
    const items = [...this.tasks.values()];
    const count = (status: TaskStatus) => items.filter((task) => task.status === status).length;
    return {
      items,
      total: items.length,
      summary: {
        all: items.length,
        pending: count('PENDING'),
        inProgress: count('IN_PROGRESS'),
        completed: count('COMPLETED'),
      },
    };
  }

  async findById(id: string) {
    return this.tasks.get(id) ?? null;
  }

  async create(input: Parameters<TaskRepository['create']>[0]) {
    return this.seed({
      ...input,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
    });
  }

  async update(id: string, input: Parameters<TaskRepository['update']>[1]) {
    if (!this.tasks.has(id)) {
      return null;
    }
    return this.seed({
      ...this.tasks.get(id),
      ...input,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
    });
  }

  async updateStatus(id: string, status: TaskStatus) {
    const task = this.tasks.get(id);
    return task ? this.seed({ ...task, status }) : null;
  }

  async delete(id: string) {
    return this.tasks.delete(id);
  }

  async ping() {}
}
