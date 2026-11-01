import {
  TASK_STATUSES,
  taskListResponseSchema,
  taskSchema,
  type TaskStatus,
} from '@taskflow/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { FakeTaskRepository } from '../test-support/fake-task-repository.js';

const today = '2026-11-01';
const yesterday = '2026-10-31';

let repository: FakeTaskRepository;
let api: ReturnType<typeof request>;

beforeEach(() => {
  repository = new FakeTaskRepository();
  api = request(createApp({ repository, clock: { today: () => today } }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function expectError(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body.error).toMatchObject({
    code,
    message: expect.any(String),
    requestId: response.headers['x-request-id'],
  });
}

describe('POST /api/v1/tasks', () => {
  it('creates a task with defaults', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: '  Write tests  ' });

    expect(response.status).toBe(201);
    expect(taskSchema.parse(response.body)).toMatchObject({
      title: 'Write tests',
      priority: 'MEDIUM',
      status: 'PENDING',
      description: null,
      dueDate: null,
    });
  });

  it('accepts a due date of today', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: 'Today', dueDate: today });

    expect(response.status).toBe(201);
  });

  it('rejects a due date before today without creating a task', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: 'Late', dueDate: yesterday });

    expectError(response, 400, 'VALIDATION_ERROR');
    expect(response.body.error.details).toEqual([
      { field: 'dueDate', message: 'Due date cannot be in the past.' },
    ]);
    expect(repository.tasks.size).toBe(0);
  });

  it('reports field-level validation messages', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: 'ab', priority: 'URGENT' });

    expectError(response, 400, 'VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        { field: 'title', message: 'Title must contain at least 3 characters.' },
        { field: 'priority', message: expect.any(String) },
      ]),
    );
  });

  it('names client-supplied server fields in the error', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: 'Valid', id: 'mine' });

    expectError(response, 400, 'VALIDATION_ERROR');
    expect(response.body.error.details).toEqual([
      { field: 'id', message: 'This field is not allowed.' },
    ]);
  });

  it('rejects a request with no body', async () => {
    const response = await api.post('/api/v1/tasks');

    expectError(response, 400, 'VALIDATION_ERROR');
  });

  it('rejects malformed JSON', async () => {
    const response = await api
      .post('/api/v1/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expectError(response, 400, 'MALFORMED_JSON');
  });

  it('rejects an oversized body', async () => {
    const response = await api.post('/api/v1/tasks').send({ title: 'a'.repeat(200_000) });

    expectError(response, 413, 'PAYLOAD_TOO_LARGE');
  });
});

describe('GET /api/v1/tasks', () => {
  it('returns the list envelope with paging and summary', async () => {
    repository.seed();
    repository.seed({ status: 'COMPLETED' });

    const response = await api.get('/api/v1/tasks').query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(taskListResponseSchema.parse(response.body)).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      summary: { all: 2, pending: 1, inProgress: 0, completed: 1 },
    });
  });

  it.each([['status=DONE'], ['limit=101'], ['page=0'], ['sort=title'], ['owner=me']])(
    'rejects the invalid query %s',
    async (query) => {
      const response = await api.get(`/api/v1/tasks?${query}`);

      expectError(response, 400, 'VALIDATION_ERROR');
    },
  );
});

describe('GET /api/v1/tasks/:id', () => {
  it('returns a task', async () => {
    const task = repository.seed();

    const response = await api.get(`/api/v1/tasks/${task.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(task);
  });

  it('returns 404 for an unknown task', async () => {
    expectError(await api.get('/api/v1/tasks/missing'), 404, 'NOT_FOUND');
  });
});

describe('PUT /api/v1/tasks/:id', () => {
  const body = { title: 'Updated', priority: 'HIGH', status: 'PENDING' };

  it('replaces editable fields', async () => {
    const task = repository.seed({ description: 'Old' });

    const response = await api.put(`/api/v1/tasks/${task.id}`).send(body);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ title: 'Updated', priority: 'HIGH', description: null });
  });

  it('allows saving an overdue task with its existing due date', async () => {
    const task = repository.seed({ dueDate: yesterday });

    const response = await api
      .put(`/api/v1/tasks/${task.id}`)
      .send({ ...body, dueDate: yesterday });

    expect(response.status).toBe(200);
  });

  it('allows clearing the due date of an overdue task', async () => {
    const task = repository.seed({ dueDate: yesterday });

    const response = await api.put(`/api/v1/tasks/${task.id}`).send(body);

    expect(response.status).toBe(200);
    expect(response.body.dueDate).toBeNull();
  });

  it('rejects moving a task to a different past date', async () => {
    const task = repository.seed({ dueDate: yesterday });

    const response = await api
      .put(`/api/v1/tasks/${task.id}`)
      .send({ ...body, dueDate: '2026-10-01' });

    expectError(response, 400, 'VALIDATION_ERROR');
    expect(repository.tasks.get(task.id)?.dueDate).toBe(yesterday);
  });

  it('applies an allowed status change', async () => {
    const task = repository.seed();

    const response = await api
      .put(`/api/v1/tasks/${task.id}`)
      .send({ ...body, status: 'IN_PROGRESS' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('rejects a blocked status change', async () => {
    const task = repository.seed();

    const response = await api
      .put(`/api/v1/tasks/${task.id}`)
      .send({ ...body, status: 'COMPLETED' });

    expectError(response, 409, 'INVALID_STATUS_TRANSITION');
    expect(repository.tasks.get(task.id)?.title).toBe(task.title);
  });

  it('returns 404 for an unknown task', async () => {
    expectError(await api.put('/api/v1/tasks/missing').send(body), 404, 'NOT_FOUND');
  });

  it('validates before looking up the task', async () => {
    const response = await api.put('/api/v1/tasks/missing').send({ title: 'ab' });

    expectError(response, 400, 'VALIDATION_ERROR');
  });
});

describe('PATCH /api/v1/tasks/:id/status', () => {
  const allowed = ['PENDING>IN_PROGRESS', 'IN_PROGRESS>COMPLETED', 'COMPLETED>PENDING'];
  const pairs = TASK_STATUSES.flatMap((from) =>
    TASK_STATUSES.map((to): [TaskStatus, TaskStatus] => [from, to]),
  );

  it.each(pairs)('%s to %s', async (from, to) => {
    const task = repository.seed({ status: from });

    const response = await api.patch(`/api/v1/tasks/${task.id}/status`).send({ status: to });

    if (allowed.includes(`${from}>${to}`)) {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(to);
    } else {
      expectError(response, 409, 'INVALID_STATUS_TRANSITION');
      expect(repository.tasks.get(task.id)?.status).toBe(from);
    }
  });

  it('rejects an invalid status', async () => {
    const task = repository.seed();

    const response = await api.patch(`/api/v1/tasks/${task.id}/status`).send({ status: 'DONE' });

    expectError(response, 400, 'VALIDATION_ERROR');
  });

  it('returns 404 for an unknown task', async () => {
    const response = await api.patch('/api/v1/tasks/missing/status').send({ status: 'COMPLETED' });

    expectError(response, 404, 'NOT_FOUND');
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('deletes a task with no body, then reports it missing', async () => {
    const task = repository.seed();

    const response = await api.delete(`/api/v1/tasks/${task.id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expectError(await api.get(`/api/v1/tasks/${task.id}`), 404, 'NOT_FOUND');
  });

  it('returns 404 for an unknown task', async () => {
    expectError(await api.delete('/api/v1/tasks/missing'), 404, 'NOT_FOUND');
  });
});

describe('error handling', () => {
  it('returns the standard error for an unknown route', async () => {
    expectError(await api.get('/api/v1/unknown'), 404, 'NOT_FOUND');
  });

  it('hides internal details from unexpected errors', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(repository, 'findById').mockRejectedValue(new Error('SQLITE_ERROR at /secret/path'));

    const response = await api.get('/api/v1/tasks/any');

    expectError(response, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(log).toHaveBeenCalledOnce();
  });

  it('gives each response its own request id', async () => {
    const first = await api.get('/api/v1/tasks/missing');
    const second = await api.get('/api/v1/tasks/missing');

    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
  });
});

it('exposes no test reset or seed routes', async () => {
  expect((await api.post('/test/reset')).status).toBe(404);
  expect((await api.get('/test/seed')).status).toBe(404);
  expect((await api.post('/api/v1/test/reset')).status).toBe(404);
});
