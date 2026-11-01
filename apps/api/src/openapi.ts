import {
  changeTaskStatusSchema,
  createTaskSchema,
  healthResponseSchema,
  taskListResponseSchema,
  taskSchema,
  updateTaskSchema,
} from '@taskflow/shared';
import { z } from 'zod';

function jsonSchema(schema: z.ZodType, io: 'input' | 'output' = 'output') {
  const document = z.toJSONSchema(schema, { io });
  delete document.$schema;
  return document;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const ok = (description: string, name: string) => ({
  description,
  content: json(ref(name)),
});
const failure = (description: string) => ({ description, content: json(ref('Error')) });
const body = (name: string) => ({ required: true, content: json(ref(name)) });

const invalid = failure('The request is invalid or malformed.');
const notFound = failure('Task not found.');
const conflict = failure('The status transition is not allowed.');
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
};

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
    requestId: z.string(),
  }),
});

function queryParameter(name: string, schema: object, description: string) {
  return { name, in: 'query', required: false, description, schema };
}

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'TaskFlow API',
    version: '1.0.0',
    description: 'Task management REST API shared by the web, Android, and iOS clients.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Check API and database health',
        responses: {
          200: ok('The API and database are healthy.', 'HealthResponse'),
          503: failure('The database is unavailable.'),
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'List tasks',
        parameters: [
          queryParameter(
            'status',
            { enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            'Only return tasks with this status.',
          ),
          queryParameter('search', { type: 'string' }, 'Case-insensitive title substring.'),
          queryParameter(
            'sort',
            { enum: ['dueDate'], default: 'dueDate' },
            'Tasks without a due date are always last.',
          ),
          queryParameter('order', { enum: ['asc', 'desc'], default: 'asc' }, 'Sort direction.'),
          queryParameter('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number.'),
          queryParameter(
            'limit',
            { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            'Page size.',
          ),
        ],
        responses: {
          200: ok('A page of tasks, with counts for all tasks.', 'TaskListResponse'),
          400: invalid,
        },
      },
      post: {
        summary: 'Create a task',
        requestBody: body('CreateTaskRequest'),
        responses: { 201: ok('The created task.', 'Task'), 400: invalid },
      },
    },
    '/tasks/{id}': {
      parameters: [idParameter],
      get: {
        summary: 'Get a task',
        responses: { 200: ok('The task.', 'Task'), 404: notFound },
      },
      put: {
        summary: 'Replace editable task fields',
        description: 'Omitted optional fields are cleared. Status changes follow transition rules.',
        requestBody: body('UpdateTaskRequest'),
        responses: {
          200: ok('The updated task.', 'Task'),
          400: invalid,
          404: notFound,
          409: conflict,
        },
      },
      delete: {
        summary: 'Delete a task',
        responses: { 204: { description: 'The task was deleted.' }, 404: notFound },
      },
    },
    '/tasks/{id}/status': {
      parameters: [idParameter],
      patch: {
        summary: 'Change task status',
        description:
          'Allowed: PENDING to IN_PROGRESS, IN_PROGRESS to COMPLETED, COMPLETED to PENDING.',
        requestBody: body('ChangeTaskStatusRequest'),
        responses: {
          200: ok('The updated task.', 'Task'),
          400: invalid,
          404: notFound,
          409: conflict,
        },
      },
    },
  },
  components: {
    schemas: {
      Task: jsonSchema(taskSchema),
      TaskListResponse: jsonSchema(taskListResponseSchema),
      HealthResponse: jsonSchema(healthResponseSchema),
      CreateTaskRequest: jsonSchema(createTaskSchema, 'input'),
      UpdateTaskRequest: jsonSchema(updateTaskSchema, 'input'),
      ChangeTaskStatusRequest: jsonSchema(changeTaskStatusSchema, 'input'),
      Error: jsonSchema(errorSchema),
    },
  },
};
