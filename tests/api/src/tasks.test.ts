import { randomUUID } from 'node:crypto';
import { taskListResponseSchema, taskSchema, type Task } from '@taskflow/shared';
import pactum from 'pactum';
import { beforeAll, describe, expect, it } from 'vitest';
import { BASE_URL } from './config.js';

const { spec, request } = pactum;
const PAST_DATE = '2020-01-01';
const FUTURE_DATE = '2099-06-30';

beforeAll(() => {
  request.setBaseUrl(BASE_URL);
});

// Each test uses its own token, so parallel files never see each other's records.
const uniqueToken = () => `tok${randomUUID().replaceAll('-', '')}`;

async function createTask(body: Record<string, unknown> = {}): Promise<Task> {
  const created: unknown = await spec()
    .post('/tasks')
    .withJson({ title: `Task ${uniqueToken()}`, ...body })
    .expectStatus(201)
    .returns('.');
  return taskSchema.parse(created);
}

async function expectError(
  sent: ReturnType<typeof spec>,
  status: number,
  code: string,
): Promise<void> {
  await sent
    .expectStatus(status)
    .expectJsonLike({ error: { code } })
    .expectHeaderContains('x-request-id', '-');
}

const putBody = (task: Task, changes: Record<string, unknown> = {}) => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  status: task.status,
  dueDate: task.dueDate,
  ...changes,
});

describe('task lifecycle', () => {
  it('creates, reads, updates, and deletes a task', async () => {
    const token = uniqueToken();
    const task = await createTask({
      title: `  Journey ${token}  `,
      description: 'Implement API and UI tests',
      priority: 'HIGH',
      dueDate: FUTURE_DATE,
    });
    expect(task).toMatchObject({
      title: `Journey ${token}`,
      status: 'PENDING',
      dueDate: FUTURE_DATE,
    });

    await spec().get(`/tasks/${task.id}`).expectStatus(200).expectJson(task);

    await spec()
      .put(`/tasks/${task.id}`)
      .withJson(putBody(task, { title: `Edited ${token}`, priority: 'LOW' }))
      .expectStatus(200)
      .expectJsonLike({ title: `Edited ${token}`, priority: 'LOW' });
    await spec()
      .get(`/tasks/${task.id}`)
      .expectStatus(200)
      .expectJsonLike({ title: `Edited ${token}`, priority: 'LOW' });

    await spec().delete(`/tasks/${task.id}`).expectStatus(204).expectBody('');
    await expectError(spec().get(`/tasks/${task.id}`), 404, 'NOT_FOUND');
    await expectError(spec().delete(`/tasks/${task.id}`), 404, 'NOT_FOUND');
  });

  it('moves through the supported status lifecycle and reopens', async () => {
    const task = await createTask();

    for (const status of ['IN_PROGRESS', 'COMPLETED', 'PENDING']) {
      await spec()
        .patch(`/tasks/${task.id}/status`)
        .withJson({ status })
        .expectStatus(200)
        .expectJsonLike({ status });
    }
  });

  it('blocks a skipped status and leaves the task unchanged', async () => {
    const task = await createTask();

    await expectError(
      spec().patch(`/tasks/${task.id}/status`).withJson({ status: 'COMPLETED' }),
      409,
      'INVALID_STATUS_TRANSITION',
    );
    await spec().get(`/tasks/${task.id}`).expectJsonLike({ status: 'PENDING' });
  });

  it('applies transition rules through PUT as well', async () => {
    const task = await createTask();

    await expectError(
      spec()
        .put(`/tasks/${task.id}`)
        .withJson(putBody(task, { status: 'COMPLETED' })),
      409,
      'INVALID_STATUS_TRANSITION',
    );
  });
});

describe('create validation', () => {
  it.each([
    ['a 2 character title', { title: 'ab' }],
    ['a 101 character title', { title: 'a'.repeat(101) }],
    ['a blank title', { title: '     ' }],
    ['a missing title', {}],
    ['a 501 character description', { title: 'Valid', description: 'a'.repeat(501) }],
    ['an invalid priority', { title: 'Valid', priority: 'URGENT' }],
    ['an invalid status', { title: 'Valid', status: 'DONE' }],
    ['an impossible date', { title: 'Valid', dueDate: '2099-02-30' }],
    ['a past due date', { title: 'Valid', dueDate: PAST_DATE }],
    ['a client-supplied id', { title: 'Valid', id: 'mine' }],
  ])('rejects %s', async (_name, body) => {
    await expectError(spec().post('/tasks').withJson(body), 400, 'VALIDATION_ERROR');
  });

  it.each([
    ['a 3 character title', { title: 'abc' }],
    ['a 100 character title', { title: 'a'.repeat(100) }],
    ['a 500 character description', { description: 'a'.repeat(500) }],
  ])('accepts %s', async (_name, body) => {
    await createTask(body);
  });

  it('allows duplicate titles', async () => {
    const title = `Same ${uniqueToken()}`;

    const first = await createTask({ title });
    const second = await createTask({ title });

    expect(first.id).not.toBe(second.id);
  });

  it('rejects malformed JSON', async () => {
    await expectError(
      spec().post('/tasks').withHeaders('Content-Type', 'application/json').withBody('{"title":'),
      400,
      'MALFORMED_JSON',
    );
  });

  it('does not create a record when validation fails', async () => {
    const token = uniqueToken();

    await spec().post('/tasks').withJson({ title: token, priority: 'URGENT' }).expectStatus(400);

    await spec().get('/tasks').withQueryParams({ search: token }).expectJsonLike({ total: 0 });
  });
});

describe('editing an overdue seeded task', () => {
  it('saves with the existing past due date', async () => {
    const task = taskSchema.parse(
      await spec().get('/tasks/seed-pending-overdue').expectStatus(200).returns('.'),
    );
    expect(task.dueDate! < FUTURE_DATE).toBe(true);

    await spec().put(`/tasks/${task.id}`).withJson(putBody(task)).expectStatus(200);
  });

  it('rejects a different past due date', async () => {
    const task = taskSchema.parse(await spec().get('/tasks/seed-pending-overdue').returns('.'));

    await expectError(
      spec()
        .put(`/tasks/${task.id}`)
        .withJson(putBody(task, { dueDate: PAST_DATE })),
      400,
      'VALIDATION_ERROR',
    );
  });
});

describe('listing', () => {
  async function list(query: Record<string, string | number>) {
    return taskListResponseSchema.parse(
      await spec().get('/tasks').withQueryParams(query).expectStatus(200).returns('.'),
    );
  }

  it('searches case-insensitively, including non-ASCII titles', async () => {
    const token = uniqueToken();
    const task = await createTask({ title: `Été ${token}` });

    const result = await list({ search: `éTÉ ${token.toUpperCase()}` });

    expect(result.items.map((item) => item.id)).toEqual([task.id]);
  });

  it('treats search wildcards as literal text', async () => {
    const token = uniqueToken();
    const match = await createTask({ title: `${token} 100%` });
    await createTask({ title: `${token} 100` });

    const result = await list({ search: `${token} 100%` });

    expect(result.items.map((item) => item.id)).toEqual([match.id]);
  });

  it('filters by status', async () => {
    const token = uniqueToken();
    const started = await createTask({ title: `${token} a`, status: 'IN_PROGRESS' });
    await createTask({ title: `${token} b` });

    const result = await list({ search: token, status: 'IN_PROGRESS' });

    expect(result.items.map((item) => item.id)).toEqual([started.id]);
  });

  it.each([
    ['asc', ['sooner', 'later', 'none']],
    ['desc', ['later', 'sooner', 'none']],
  ])('sorts %s with no due date last', async (order, expected) => {
    const token = uniqueToken();
    await createTask({ title: `${token} none` });
    await createTask({ title: `${token} later`, dueDate: '2099-12-31' });
    await createTask({ title: `${token} sooner`, dueDate: '2099-01-01' });

    const result = await list({ search: token, sort: 'dueDate', order });

    expect(result.items.map((item) => item.title.split(' ')[1])).toEqual(expected);
  });

  it('paginates', async () => {
    const token = uniqueToken();
    for (const suffix of ['a', 'b', 'c']) {
      await createTask({ title: `${token} ${suffix}` });
    }

    const first = await list({ search: token, limit: 2, page: 1 });
    const second = await list({ search: token, limit: 2, page: 2 });

    expect(first).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('reports overall summary counts while filtered', async () => {
    const result = await list({ search: uniqueToken() });

    expect(result.total).toBe(0);
    expect(result.summary.all).toBeGreaterThanOrEqual(6);
  });

  it.each([[{ limit: 101 }], [{ page: 0 }], [{ status: 'DONE' }], [{ sort: 'title' }]])(
    'rejects the invalid query %j',
    async (query) => {
      await expectError(spec().get('/tasks').withQueryParams(query), 400, 'VALIDATION_ERROR');
    },
  );
});

describe('concurrent requests', () => {
  it('keeps one complete version when updates race (last write wins)', async () => {
    const task = await createTask();
    const titles = Array.from({ length: 10 }, (_, index) => `Racer ${index} ${uniqueToken()}`);

    const statuses = await Promise.all(
      titles.map((title) =>
        spec()
          .put(`/tasks/${task.id}`)
          .withJson(putBody(task, { title, description: title }))
          .returns((context) => context.res.statusCode),
      ),
    );

    expect(new Set(statuses)).toEqual(new Set([200]));
    const final = taskSchema.parse(await spec().get(`/tasks/${task.id}`).returns('.'));
    expect(titles).toContain(final.title);
    expect(final.description).toBe(final.title);
  });

  it('answers with success or conflict when the same transition races', async () => {
    const task = await createTask();

    const statuses = await Promise.all(
      Array.from({ length: 5 }, () =>
        spec()
          .patch(`/tasks/${task.id}/status`)
          .withJson({ status: 'IN_PROGRESS' })
          .returns((context) => context.res.statusCode),
      ),
    );

    expect(statuses).toContain(200);
    expect(statuses.every((status) => status === 200 || status === 409)).toBe(true);
    await spec().get(`/tasks/${task.id}`).expectJsonLike({ status: 'IN_PROGRESS' });
  });

  it('accepts a burst of concurrent creates', async () => {
    const token = uniqueToken();

    const statuses = await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        spec()
          .post('/tasks')
          .withJson({ title: `${token} ${index}` })
          .returns((context) => context.res.statusCode),
      ),
    );

    expect(new Set(statuses)).toEqual(new Set([201]));
    await spec().get('/tasks').withQueryParams({ search: token }).expectJsonLike({ total: 25 });
  });
});

describe('service endpoints', () => {
  it('reports health including the database', async () => {
    await spec().get('/health').expectStatus(200).expectJsonLike({ status: 'ok', database: 'ok' });
  });

  it('returns the standard error for an unknown id and route', async () => {
    await expectError(spec().get('/tasks/does-not-exist'), 404, 'NOT_FOUND');
    await expectError(spec().get('/nothing-here'), 404, 'NOT_FOUND');
  });

  it('serves the OpenAPI document and Swagger UI', async () => {
    await spec().get('/openapi.json').expectStatus(200).expectJsonLike({ openapi: '3.1.0' });
    await spec().get('/docs/').expectStatus(200).expectBodyContains('swagger-ui');
  });

  it('exposes no test reset or seed route', async () => {
    await spec().post('/test/reset').expectStatus(404);
    await spec().get('/test/seed').expectStatus(404);
  });
});
