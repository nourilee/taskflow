import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from './task.js';
import { isDueDateAllowed } from './task-rules.js';

const FIELDS = ['title', 'description', 'priority', 'dueDate', 'status'] as const;
export type TaskField = (typeof FIELDS)[number];
export type TaskFieldErrors = Partial<Record<TaskField, string>>;

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

export type TaskFormResult =
  { valid: true; data: CreateTaskInput } | { valid: false; errors: TaskFieldErrors };

export function toTaskFieldErrors(
  entries: readonly { field: unknown; message: string }[],
): TaskFieldErrors {
  const errors: TaskFieldErrors = {};
  for (const { field, message } of entries) {
    if (FIELDS.includes(field as TaskField) && !errors[field as TaskField]) {
      errors[field as TaskField] = message;
    }
  }
  return errors;
}

// Pass the existing task when editing, so create and edit rules both apply.
export function validateTaskForm(
  values: TaskFormValues,
  today: string,
  existing?: Pick<Task, 'dueDate'>,
): TaskFormResult {
  const input = {
    ...values,
    description: values.description || null,
    dueDate: values.dueDate || null,
  };
  const parsed = (existing ? updateTaskSchema : createTaskSchema).safeParse(input);
  const errors = parsed.success
    ? {}
    : toTaskFieldErrors(
        parsed.error.issues.map((issue) => ({ field: issue.path[0], message: issue.message })),
      );
  if (!errors.dueDate && !isDueDateAllowed(input.dueDate, today, existing?.dueDate)) {
    errors.dueDate = 'Due date cannot be in the past.';
  }
  if (!parsed.success || Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data: parsed.data };
}
