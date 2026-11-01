import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { FakeTaskRepository } from '../test-support/fake-task-repository.js';

const allowed = 'http://localhost:5173';

let api: ReturnType<typeof request>;

beforeEach(() => {
  api = request(
    createApp({
      repository: new FakeTaskRepository(),
      clock: { today: () => '2026-11-01' },
      corsOrigins: [allowed, 'http://web.test'],
    }),
  );
});

describe('CORS', () => {
  it.each([[allowed], ['http://web.test']])('allows the configured origin %s', async (origin) => {
    const response = await api.get('/api/v1/tasks').set('Origin', origin);

    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-expose-headers']).toContain('X-Request-Id');
  });

  it('gives no CORS approval to other origins', async () => {
    const response = await api.get('/api/v1/tasks').set('Origin', 'http://evil.test');

    expect(response.headers).not.toHaveProperty('access-control-allow-origin');
  });

  it.each([['PATCH'], ['DELETE'], ['PUT']])('allows a %s preflight', async (method) => {
    const response = await api
      .options('/api/v1/tasks/any')
      .set('Origin', allowed)
      .set('Access-Control-Request-Method', method)
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain(method);
  });

  it('allows nothing when no origins are configured', async () => {
    const closed = request(
      createApp({ repository: new FakeTaskRepository(), clock: { today: () => '2026-11-01' } }),
    );

    const response = await closed.get('/api/v1/tasks').set('Origin', allowed);

    expect(response.headers).not.toHaveProperty('access-control-allow-origin');
  });
});
