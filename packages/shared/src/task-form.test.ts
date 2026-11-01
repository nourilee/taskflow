import { describe, expect, it } from 'vitest';
import { formatDate, localToday, statusSlug } from './task-display.js';
import { toTaskFieldErrors, validateTaskForm, type TaskFormValues } from './task-form.js';

const today = '2026-11-01';
const values: TaskFormValues = {
  title: '  Write tests  ',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: '',
};

describe('validateTaskForm', () => {
  it('returns trimmed data with empty optional fields as null', () => {
    expect(validateTaskForm(values, today)).toEqual({
      valid: true,
      data: {
        title: 'Write tests',
        description: null,
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: null,
      },
    });
  });

  it('reports schema errors by field', () => {
    const result = validateTaskForm({ ...values, title: 'ab' }, today);

    expect(result).toEqual({
      valid: false,
      errors: { title: 'Title must contain at least 3 characters.' },
    });
  });

  it('rejects a past due date on create', () => {
    expect(validateTaskForm({ ...values, dueDate: '2026-10-31' }, today)).toEqual({
      valid: false,
      errors: { dueDate: 'Due date cannot be in the past.' },
    });
  });

  it('keeps an existing past due date on edit but rejects a different one', () => {
    const existing = { dueDate: '2026-10-31' };

    expect(validateTaskForm({ ...values, dueDate: '2026-10-31' }, today, existing).valid).toBe(
      true,
    );
    expect(validateTaskForm({ ...values, dueDate: '2026-10-01' }, today, existing).valid).toBe(
      false,
    );
  });
});

describe('toTaskFieldErrors', () => {
  it('keeps the first message per known field and ignores others', () => {
    expect(
      toTaskFieldErrors([
        { field: 'title', message: 'first' },
        { field: 'title', message: 'second' },
        { field: 'unknown', message: 'ignored' },
      ]),
    ).toEqual({ title: 'first' });
  });
});

describe('display helpers', () => {
  it('builds identifier slugs from statuses', () => {
    expect(statusSlug('IN_PROGRESS')).toBe('in-progress');
  });

  it('uses the local calendar date', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('formats a calendar date without shifting the day', () => {
    expect(formatDate('2026-01-05')).toContain('2026');
    expect(formatDate('2026-01-05')).toContain('5');
  });
});
