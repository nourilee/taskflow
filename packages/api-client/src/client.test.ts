import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient } from './index.js';

const baseUrl = 'http://api.test/api/v1';
const health = { status: 'ok', service: 'taskflow-api', database: 'ok', uptimeSeconds: 3 };

function clientReturning(response: Response) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
  return { client: createApiClient({ baseUrl, fetch }), fetch };
}

async function captureError(promise: Promise<unknown>): Promise<ApiClientError> {
  const error = await promise.then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiClientError);
  return error as ApiClientError;
}

describe('getHealth', () => {
  it('returns the parsed health response', async () => {
    const { client } = clientReturning(Response.json(health));

    await expect(client.getHealth()).resolves.toEqual(health);
  });

  it.each([[baseUrl], [`${baseUrl}/`]])('requests the health path from %s', async (url) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(health));

    await createApiClient({ baseUrl: url, fetch }).getHealth();

    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${baseUrl}/health`);
  });

  it.each([[404], [500], [503]])('reports HTTP %i as an http error', async (status) => {
    const { client } = clientReturning(new Response('failed', { status }));

    const error = await captureError(client.getHealth());

    expect(error.kind).toBe('http');
    expect(error.status).toBe(status);
  });

  it('reports a rejected fetch as a network error and keeps the cause', async () => {
    const cause = new TypeError('fetch failed');
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(cause);

    const error = await captureError(createApiClient({ baseUrl, fetch }).getHealth());

    expect(error.kind).toBe('network');
    expect(error.status).toBeUndefined();
    expect(error.cause).toBe(cause);
  });

  it('reports a successful response with a non-JSON body as invalid', async () => {
    const { client } = clientReturning(new Response('<html>proxy page</html>'));

    const error = await captureError(client.getHealth());

    expect(error.kind).toBe('invalid_response');
    expect(error.status).toBe(200);
  });

  it('reports JSON that does not match the schema as invalid', async () => {
    const { client } = clientReturning(Response.json({ status: 'ok' }));

    const error = await captureError(client.getHealth());

    expect(error.kind).toBe('invalid_response');
    expect(error.status).toBe(200);
  });
});
