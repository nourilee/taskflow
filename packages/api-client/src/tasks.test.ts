import type { Task } from '@taskflow/shared';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient, type ApiClient } from './index.js';

const baseUrl = 'http://api.test/api/v1';
const task: Task = {
  id: 'task-1',
  title: 'Write tests',
  description: null,
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: null,
  createdAt: '2026-11-01T09:00:00.000Z',
  updatedAt: '2026-11-01T09:00:00.000Z',
};
const list = {
  items: [task],
  page: 1,
  limit: 20,
  total: 1,
  summary: { all: 1, pending: 1, inProgress: 0, completed: 0 },
};
const createInput = { title: 'Write tests', priority: 'MEDIUM', status: 'PENDING' } as const;

function setup(response: Response) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
  return { client: createApiClient({ baseUrl, fetch }), fetch };
}

async function captureError(call: Promise<unknown>): Promise<ApiClientError> {
  const error = await call.then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiClientError);
  return error as ApiClientError;
}

const calls: [string, (client: ApiClient) => Promise<unknown>][] = [
  ['listTasks', (client) => client.listTasks()],
  ['getTask', (client) => client.getTask('task-1')],
  ['createTask', (client) => client.createTask(createInput)],
  ['updateTask', (client) => client.updateTask('task-1', createInput)],
  ['changeTaskStatus', (client) => client.changeTaskStatus('task-1', 'IN_PROGRESS')],
];

describe('task requests', () => {
  it('sends list filters and leaves out undefined values', async () => {
    const { client, fetch } = setup(Response.json(list));

    const result = await client.listTasks({
      status: 'PENDING',
      search: 'ÉTÉ & plans',
      order: 'desc',
      page: 2,
      limit: undefined,
    });

    expect(result).toEqual(list);
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({
      status: 'PENDING',
      search: 'ÉTÉ & plans',
      order: 'desc',
      page: '2',
    });
  });

  it('requests all tasks without a query string by default', async () => {
    const { client, fetch } = setup(Response.json(list));

    await client.listTasks();

    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${baseUrl}/tasks`);
  });

  it('escapes task IDs in the path', async () => {
    const { client, fetch } = setup(Response.json(task));

    await client.getTask('a/b?c');

    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${baseUrl}/tasks/a%2Fb%3Fc`);
  });

  it.each<[string, (client: ApiClient) => Promise<unknown>, string, string, unknown]>([
    ['createTask', (c) => c.createTask(createInput), 'POST', '/tasks', createInput],
    ['updateTask', (c) => c.updateTask('task-1', createInput), 'PUT', '/tasks/task-1', createInput],
    [
      'changeTaskStatus',
      (c) => c.changeTaskStatus('task-1', 'COMPLETED'),
      'PATCH',
      '/tasks/task-1/status',
      { status: 'COMPLETED' },
    ],
  ])('%s sends JSON', async (_name, call, method, path, body) => {
    const { client, fetch } = setup(Response.json(task));

    await expect(call(client)).resolves.toEqual(task);

    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe(`${baseUrl}${path}`);
    expect(init?.method).toBe(method);
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual(body);
  });

  it('deletes a task and accepts an empty response', async () => {
    const { client, fetch } = setup(new Response(null, { status: 204 }));

    await expect(client.deleteTask('task-1')).resolves.toBeUndefined();

    expect(fetch.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });
});

describe('task request failures', () => {
  const apiError = {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'The request contains invalid fields.',
      details: [{ field: 'title', message: 'Title must contain at least 3 characters.' }],
      requestId: 'request-1',
    },
  };

  it.each(calls)('%s exposes the API error body', async (_name, call) => {
    const { client } = setup(Response.json(apiError, { status: 400 }));

    const error = await captureError(call(client));

    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: apiError.error.message,
      details: apiError.error.details,
      requestId: 'request-1',
    });
  });

  it('exposes API errors from deleteTask', async () => {
    const notFound = {
      error: { code: 'NOT_FOUND', message: 'Task not found.', requestId: 'request-2' },
    };
    const { client } = setup(Response.json(notFound, { status: 404 }));

    const error = await captureError(client.deleteTask('missing'));

    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', details: [] });
  });

  it('falls back to a generic message for a non-JSON error body', async () => {
    const { client } = setup(new Response('<html>Bad gateway</html>', { status: 502 }));

    const error = await captureError(client.listTasks());

    expect(error).toMatchObject({ kind: 'http', status: 502, code: undefined });
    expect(error.message).toBe('The API responded with status 502.');
  });

  it.each(calls)('%s reports a network failure', async (_name, call) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('failed'));

    const error = await captureError(call(createApiClient({ baseUrl, fetch })));

    expect(error.kind).toBe('network');
  });

  it.each(calls)('%s rejects a response with the wrong shape', async (_name, call) => {
    const { client } = setup(Response.json({ unexpected: true }));

    const error = await captureError(call(client));

    expect(error).toMatchObject({ kind: 'invalid_response', status: 200 });
  });
});
