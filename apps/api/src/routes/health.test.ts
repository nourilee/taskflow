import { healthResponseSchema } from '@taskflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('GET /api/v1/health', () => {
  it('responds 200 with a body matching the shared schema', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(healthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      service: 'taskflow-api',
    });
  });

  it('is not served outside the versioned base path', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(404);
  });
});
