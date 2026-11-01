import { healthResponseSchema } from '@taskflow/shared';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { FakeTaskRepository } from '../test-support/fake-task-repository.js';

const clock = { today: () => '2026-11-01' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/v1/health', () => {
  it('responds 200 with a body matching the shared schema', async () => {
    const app = createApp({ repository: new FakeTaskRepository(), clock });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(healthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      service: 'taskflow-api',
      database: 'ok',
    });
  });

  it('is not served outside the versioned base path', async () => {
    const app = createApp({ repository: new FakeTaskRepository(), clock });

    const response = await request(app).get('/health');

    expect(response.status).toBe(404);
  });

  it('responds 503 with the standard error shape when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repository = new FakeTaskRepository();
    vi.spyOn(repository, 'ping').mockRejectedValue(new Error('SQLITE_CANTOPEN /secret/path'));

    const response = await request(createApp({ repository, clock })).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.error).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      requestId: response.headers['x-request-id'],
    });
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });
});
