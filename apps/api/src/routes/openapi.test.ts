import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { FakeTaskRepository } from '../test-support/fake-task-repository.js';

let api: ReturnType<typeof request>;

beforeEach(() => {
  api = request(
    createApp({ repository: new FakeTaskRepository(), clock: { today: () => '2026-11-01' } }),
  );
});

describe('GET /api/v1/openapi.json', () => {
  it('documents every endpoint in the API specification', async () => {
    const response = await api.get('/api/v1/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.1.0');
    const operations = Object.entries<Record<string, unknown>>(response.body.paths).flatMap(
      ([path, item]) =>
        Object.keys(item)
          .filter((key) => key !== 'parameters')
          .map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(operations.sort()).toEqual([
      'DELETE /tasks/{id}',
      'GET /health',
      'GET /tasks',
      'GET /tasks/{id}',
      'PATCH /tasks/{id}/status',
      'POST /tasks',
      'PUT /tasks/{id}',
    ]);
  });

  it('resolves every schema reference', async () => {
    const { body } = await api.get('/api/v1/openapi.json');

    const references = [...JSON.stringify(body).matchAll(/#\/components\/schemas\/(\w+)/g)];

    expect(references.length).toBeGreaterThan(0);
    for (const [, name] of references) {
      expect(body.components.schemas).toHaveProperty(name!);
    }
  });

  it('documents the error responses clients can receive', async () => {
    const { body } = await api.get('/api/v1/openapi.json');

    expect(body.paths['/tasks'].get.responses).toHaveProperty('500');
    expect(body.paths['/tasks'].get.responses).not.toHaveProperty('413');
    expect(body.paths['/tasks'].post.responses).toHaveProperty('413');
    expect(body.paths['/tasks/{id}'].put.responses).toHaveProperty('413');
    expect(body.paths['/tasks/{id}'].parameters).toHaveLength(1);
  });

  it('carries request limits from the shared schemas', async () => {
    const { body } = await api.get('/api/v1/openapi.json');
    const { properties, required } = body.components.schemas.CreateTaskRequest;

    expect(properties.title).toMatchObject({ minLength: 3, maxLength: 100 });
    expect(required).toContain('title');
    expect(required).not.toContain('priority');
  });
});

describe('GET /api/v1/docs', () => {
  it('serves Swagger UI', async () => {
    const response = await api.get('/api/v1/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });
});
