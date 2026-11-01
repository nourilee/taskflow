import {
  canTransition,
  isDueDateAllowed,
  type CreateTaskInput,
  type ListTasksQuery,
  type Task,
  type TaskListResponse,
  type TaskStatus,
  type UpdateTaskInput,
} from '@taskflow/shared';
import type { Clock } from '../clock.js';
import { ApiError, notFoundError, validationError } from '../errors.js';
import type { TaskRepository } from './task-repository.js';

function assertDueDateAllowed(
  dueDate: string | null | undefined,
  today: string,
  existingDueDate?: string | null,
): void {
  if (!isDueDateAllowed(dueDate, today, existingDueDate)) {
    throw validationError([{ field: 'dueDate', message: 'Due date cannot be in the past.' }]);
  }
}

function assertCanTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) {
    throw new ApiError(
      409,
      'INVALID_STATUS_TRANSITION',
      `A task cannot move from ${from} to ${to}.`,
    );
  }
}

function taskNotFound(): ApiError {
  return notFoundError('Task not found.');
}

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async list(query: ListTasksQuery): Promise<TaskListResponse> {
    const result = await this.repository.list(query);
    return { ...result, page: query.page, limit: query.limit };
  }

  async get(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) {
      throw taskNotFound();
    }
    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    assertDueDateAllowed(input.dueDate, this.clock.today());
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.get(id);
    assertDueDateAllowed(input.dueDate, this.clock.today(), existing.dueDate);
    if (input.status !== existing.status) {
      assertCanTransition(existing.status, input.status);
    }
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw taskNotFound();
    }
    return updated;
  }

  async changeStatus(id: string, status: TaskStatus): Promise<Task> {
    const existing = await this.get(id);
    assertCanTransition(existing.status, status);
    const updated = await this.repository.updateStatus(id, status);
    if (!updated) {
      throw taskNotFound();
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw taskNotFound();
    }
  }
}
