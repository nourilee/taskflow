import { randomUUID } from 'node:crypto';
import { taskListResponseSchema, taskSchema, type Task } from '@taskflow/shared';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createPrismaClient } from '../db/prisma-client.js';
import { PrismaTaskRepository } from '../tasks/prisma-task-repository.js';
import { integrationEnv } from '../test-support/integration-env.js';
import { assertTestDatabase } from '../test-support/test-database.js';

const today = '2026-11-01';
const yesterday = '2026-10-31';

const prisma = createPrismaClient(`file:${assertTestDatabase(integrationEnv)}`);
const repository = new PrismaTaskRepository(prisma);
const api = request(createApp({ repository, clock: { today: () => today } }));

async function createTask(body: Record<string, unknown> = {}): Promise<Task> {
  const response = await api
    .post('/api/v1/tasks')
    .send({ title: `Task ${randomUUID()}`, ...body })
    .expect(201);
  return taskSchema.parse(response.body);
}

const putBody = (task: Task, changes: Record<string, unknown> = {}) => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  status: task.status,
  dueDate: task.dueDate,
  ...changes,
});

async function list(query: Record<string, string | number>) {
  const response = await api.get('/api/v1/tasks').query(query).expect(200);
  return taskListResponseSchema.parse(response.body);
}

beforeEach(async () => {
  assertTestDatabase(integrationEnv);
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('task routes with the test database', () => {
  it('creates, reads, updates, and deletes a task', async () => {
    const task = await createTask({
      title: '  Journey task  ',
      description: 'Cover the full stack',
      priority: 'HIGH',
      dueDate: today,
    });
    expect(task).toMatchObject({ title: 'Journey task', status: 'PENDING', dueDate: today });

    expect((await api.get(`/api/v1/tasks/${task.id}`).expect(200)).body).toEqual(task);

    await api
      .put(`/api/v1/tasks/${task.id}`)
      .send(putBody(task, { title: 'Edited task', priority: 'LOW' }))
      .expect(200);
    const edited = await api.get(`/api/v1/tasks/${task.id}`).expect(200);
    expect(edited.body).toMatchObject({ title: 'Edited task', priority: 'LOW' });

    await api.delete(`/api/v1/tasks/${task.id}`).expect(204);
    await api.get(`/api/v1/tasks/${task.id}`).expect(404);
    await api.delete(`/api/v1/tasks/${task.id}`).expect(404);
  });

  it('moves through the status lifecycle and reopens', async () => {
    const task = await createTask();

    for (const status of ['IN_PROGRESS', 'COMPLETED', 'PENDING']) {
      const response = await api
        .patch(`/api/v1/tasks/${task.id}/status`)
        .send({ status })
        .expect(200);
      expect(response.body.status).toBe(status);
    }
  });

  it('leaves the stored task unchanged after a blocked transition', async () => {
    const task = await createTask();

    await api.patch(`/api/v1/tasks/${task.id}/status`).send({ status: 'COMPLETED' }).expect(409);

    expect((await repository.findById(task.id))?.status).toBe('PENDING');
  });

  it('keeps an overdue task editable with its existing due date', async () => {
    const task = await repository.create({
      title: 'Overdue task',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: yesterday,
    });

    await api
      .put(`/api/v1/tasks/${task.id}`)
      .send(putBody(task, { title: 'Still overdue' }))
      .expect(200);
    await api
      .put(`/api/v1/tasks/${task.id}`)
      .send(putBody(task, { dueDate: '2026-10-01' }))
      .expect(400);
  });

  it('does not store a task when validation fails', async () => {
    await api.post('/api/v1/tasks').send({ title: 'Valid', priority: 'URGENT' }).expect(400);

    expect((await list({})).total).toBe(0);
  });

  it('searches, filters, sorts, and paginates through the route', async () => {
    await createTask({ title: 'Été later', dueDate: '2099-12-31' });
    await createTask({ title: 'Été sooner', dueDate: '2099-01-01', status: 'IN_PROGRESS' });
    await createTask({ title: 'Été none' });
    await createTask({ title: 'Other' });

    const titles = (result: { items: Task[] }) => result.items.map((task) => task.title);

    expect(titles(await list({ search: 'éTÉ', order: 'desc' }))).toEqual([
      'Été later',
      'Été sooner',
      'Été none',
    ]);
    expect(titles(await list({ search: 'été', status: 'IN_PROGRESS' }))).toEqual(['Été sooner']);

    const page = await list({ limit: 1, page: 2 });
    expect(page).toMatchObject({ total: 4, page: 2, limit: 1 });
    expect(titles(page)).toEqual(['Été later']);
    expect(page.summary).toEqual({ all: 4, pending: 3, inProgress: 1, completed: 0 });
  });
});

describe('concurrent requests', () => {
  it('keeps one complete version when updates race (last write wins)', async () => {
    const task = await createTask();
    const titles = Array.from({ length: 10 }, (_, index) => `Racer ${index}`);

    const responses = await Promise.all(
      titles.map((title) =>
        api.put(`/api/v1/tasks/${task.id}`).send(putBody(task, { title, description: title })),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual(titles.map(() => 200));
    const stored = await repository.findById(task.id);
    expect(titles).toContain(stored?.title);
    expect(stored?.description).toBe(stored?.title);
  });

  it('answers with success or conflict when the same transition races', async () => {
    const task = await createTask();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        api.patch(`/api/v1/tasks/${task.id}/status`).send({ status: 'IN_PROGRESS' }),
      ),
    );

    const statuses = responses.map((response) => response.status);
    expect(statuses).toContain(200);
    expect(statuses.every((status) => status === 200 || status === 409)).toBe(true);
    expect((await repository.findById(task.id))?.status).toBe('IN_PROGRESS');
  });

  it('stores every task in a burst of concurrent creates', async () => {
    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        api.post('/api/v1/tasks').send({ title: `Burst ${index}` }),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual(responses.map(() => 201));
    expect((await list({})).total).toBe(25);
  });
});
