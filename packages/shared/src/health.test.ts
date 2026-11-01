import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health.js';

const valid = { status: 'ok', service: 'taskflow-api', uptimeSeconds: 12.5 };

describe('healthResponseSchema', () => {
  it('accepts a valid health response', () => {
    expect(healthResponseSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['an unexpected status', { ...valid, status: 'down' }],
    ['an empty service name', { ...valid, service: '' }],
    ['negative uptime', { ...valid, uptimeSeconds: -1 }],
    ['missing uptime', { status: 'ok', service: 'taskflow-api' }],
  ])('rejects %s', (_name, input) => {
    expect(healthResponseSchema.safeParse(input).success).toBe(false);
  });
});
