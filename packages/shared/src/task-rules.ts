import type { Task, TaskStatus } from './task.js';

const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['PENDING'],
};

export function nextStatuses(from: TaskStatus): readonly TaskStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Calendar dates in YYYY-MM-DD form compare correctly as strings.
export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, today: string): boolean {
  return task.dueDate !== null && task.dueDate < today && task.status !== 'COMPLETED';
}

// Pass existingDueDate when editing, so an overdue task can be saved with its current date.
export function isDueDateAllowed(
  dueDate: string | null | undefined,
  today: string,
  existingDueDate?: string | null,
): boolean {
  if (dueDate === null || dueDate === undefined || dueDate >= today) {
    return true;
  }
  return dueDate === existingDueDate;
}

export function normalizeTitle(title: string): string {
  return title.normalize('NFC').toLowerCase();
}
