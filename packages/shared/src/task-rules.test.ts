import { describe, expect, it } from 'vitest';
import { TASK_STATUSES, type TaskStatus } from './task.js';
import { canTransition, isDueDateAllowed, isOverdue, normalizeTitle } from './task-rules.js';

const today = '2026-11-01';
const yesterday = '2026-10-31';
const tomorrow = '2026-11-02';

describe('canTransition', () => {
  const allowed: [TaskStatus, TaskStatus][] = [
    ['PENDING', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['COMPLETED', 'PENDING'],
  ];
  const isAllowed = (from: TaskStatus, to: TaskStatus) =>
    allowed.some(([a, b]) => a === from && b === to);
  const pairs = TASK_STATUSES.flatMap((from) => TASK_STATUSES.map((to) => [from, to] as const));

  it('covers all nine status pairs', () => {
    expect(pairs).toHaveLength(9);
  });

  it.each(pairs)('%s to %s', (from, to) => {
    expect(canTransition(from, to)).toBe(isAllowed(from, to));
  });
});

describe('isOverdue', () => {
  it.each([
    ['due yesterday and pending', yesterday, 'PENDING', true],
    ['due yesterday and in progress', yesterday, 'IN_PROGRESS', true],
    ['due yesterday and completed', yesterday, 'COMPLETED', false],
    ['due today', today, 'PENDING', false],
    ['due tomorrow', tomorrow, 'PENDING', false],
    ['without a due date', null, 'PENDING', false],
  ] as const)('%s', (_name, dueDate, status, expected) => {
    expect(isOverdue({ dueDate, status }, today)).toBe(expected);
  });
});

describe('isDueDateAllowed', () => {
  it.each([
    ['no due date', null],
    ['an omitted due date', undefined],
    ['today', today],
    ['a future date', tomorrow],
  ])('allows %s on create', (_name, dueDate) => {
    expect(isDueDateAllowed(dueDate, today)).toBe(true);
  });

  it('rejects a past date on create', () => {
    expect(isDueDateAllowed(yesterday, today)).toBe(false);
  });

  it('allows keeping an existing past date on update', () => {
    expect(isDueDateAllowed(yesterday, today, yesterday)).toBe(true);
  });

  it('rejects moving a task to a different past date', () => {
    expect(isDueDateAllowed('2026-10-01', today, yesterday)).toBe(false);
  });

  it('rejects adding a past date to a task without one', () => {
    expect(isDueDateAllowed(yesterday, today, null)).toBe(false);
  });
});

describe('normalizeTitle', () => {
  it('lowercases non-ASCII text', () => {
    expect(normalizeTitle('ÉTÉ Plan')).toBe('été plan');
  });

  it('treats composed and decomposed characters the same', () => {
    expect(normalizeTitle('Café')).toBe(normalizeTitle('Café'));
  });
});
