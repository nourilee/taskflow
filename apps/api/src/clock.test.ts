import { describe, expect, it } from 'vitest';
import { createSystemClock } from './clock.js';

const instant = () => new Date('2026-11-01T20:30:00.000Z');

describe('createSystemClock', () => {
  it.each([
    ['UTC', '2026-11-01'],
    ['Asia/Manila', '2026-11-02'],
    ['Pacific/Honolulu', '2026-11-01'],
  ])('reports the calendar date in %s', (timeZone, expected) => {
    expect(createSystemClock(timeZone, instant).today()).toBe(expected);
  });

  it('rejects an invalid time zone at creation', () => {
    expect(() => createSystemClock('Mars/Base')).toThrow(RangeError);
  });
});
