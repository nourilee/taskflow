import { z } from 'zod';

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const LIST_DEFAULT_LIMIT = 20;
export const LIST_MAX_LIMIT = 100;

export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const taskStatusSchema = z.enum(TASK_STATUSES);

const titleSchema = z
  .string()
  .trim()
  .min(TITLE_MIN_LENGTH, `Title must contain at least ${TITLE_MIN_LENGTH} characters.`)
  .max(TITLE_MAX_LENGTH, `Title must contain at most ${TITLE_MAX_LENGTH} characters.`);

const descriptionSchema = z
  .string()
  .max(
    DESCRIPTION_MAX_LENGTH,
    `Description must contain at most ${DESCRIPTION_MAX_LENGTH} characters.`,
  )
  .nullable()
  .optional();

const dueDateSchema = z.iso.date('Due date must be a valid YYYY-MM-DD date.').nullable().optional();

export const createTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema,
  priority: taskPrioritySchema.default('MEDIUM'),
  dueDate: dueDateSchema,
  status: taskStatusSchema.default('PENDING'),
});

export const updateTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema,
  priority: taskPrioritySchema,
  dueDate: dueDateSchema,
  status: taskStatusSchema,
});

export const changeTaskStatusSchema = z.strictObject({
  status: taskStatusSchema,
});

export const listTasksQuerySchema = z.strictObject({
  status: taskStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.literal('dueDate').default('dueDate'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(LIST_MAX_LIMIT).default(LIST_DEFAULT_LIMIT),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().nullable(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const taskListResponseSchema = z.object({
  items: z.array(taskSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  summary: z.object({
    all: z.number().int(),
    pending: z.number().int(),
    inProgress: z.number().int(),
    completed: z.number().int(),
  }),
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskListResponse = z.infer<typeof taskListResponseSchema>;
export type TaskSummary = TaskListResponse['summary'];
