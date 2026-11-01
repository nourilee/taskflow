import { ApiClientError } from '@taskflow/api-client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aTask, fakeApi, notFound, renderApp, TODAY, unreachable } from '../test/render-app';

const value = (testId: string) => (screen.getByTestId(testId) as HTMLInputElement).value;
const options = (testId: string) =>
  [...(screen.getByTestId(testId) as HTMLSelectElement).options].map((option) => option.value);
const setDate = (date: string) =>
  fireEvent.change(screen.getByTestId('field-dueDate'), { target: { value: date } });

describe('Create task', () => {
  it('starts with the documented defaults and all statuses', async () => {
    renderApp('/tasks/new');

    expect(value('field-priority')).toBe('MEDIUM');
    expect(value('field-status')).toBe('PENDING');
    expect(options('field-status')).toEqual(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
  });

  it('trims the title, creates the task, and opens its details', async () => {
    const api = fakeApi();
    api.createTask.mockResolvedValue(aTask({ id: 'created' }));
    renderApp('/tasks/new', api);

    await userEvent.type(screen.getByTestId('field-title'), '  New task  ');
    await userEvent.type(screen.getByTestId('field-description'), 'Details');
    await userEvent.selectOptions(screen.getByTestId('field-priority'), 'HIGH');
    setDate(TODAY);
    await userEvent.click(screen.getByTestId('save-task'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/tasks/created'));
    expect(api.createTask).toHaveBeenCalledExactlyOnceWith({
      title: 'New task',
      description: 'Details',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: TODAY,
    });
  });

  it.each([
    ['blank', '   ', 'Title must contain at least 3 characters.'],
    ['too short', 'ab', 'Title must contain at least 3 characters.'],
    ['too long', 'a'.repeat(101), 'Title must contain at most 100 characters.'],
  ])('rejects a %s title without calling the API', async (_name, title, message) => {
    const { api } = renderApp('/tasks/new');

    fireEvent.change(screen.getByTestId('field-title'), { target: { value: title } });
    await userEvent.click(screen.getByTestId('save-task'));

    expect(screen.getByTestId('field-title-error').textContent).toBe(message);
    expect(screen.getByTestId('field-title').getAttribute('aria-invalid')).toBe('true');
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('rejects a long description', async () => {
    const { api } = renderApp('/tasks/new');

    fireEvent.change(screen.getByTestId('field-title'), { target: { value: 'Valid' } });
    fireEvent.change(screen.getByTestId('field-description'), {
      target: { value: 'a'.repeat(501) },
    });
    await userEvent.click(screen.getByTestId('save-task'));

    expect(screen.getByTestId('field-description-error')).toBeTruthy();
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('rejects a past due date', async () => {
    const { api } = renderApp('/tasks/new');

    await userEvent.type(screen.getByTestId('field-title'), 'Valid');
    setDate('2026-10-31');
    await userEvent.click(screen.getByTestId('save-task'));

    expect(screen.getByTestId('field-dueDate-error').textContent).toBe(
      'Due date cannot be in the past.',
    );
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('shows server field errors on the matching field and keeps input', async () => {
    const api = fakeApi();
    api.createTask.mockRejectedValue(
      new ApiClientError('http', 'The request contains invalid fields.', {
        status: 400,
        code: 'VALIDATION_ERROR',
        details: [{ field: 'dueDate', message: 'Due date cannot be in the past.' }],
      }),
    );
    renderApp('/tasks/new', api);

    await userEvent.type(screen.getByTestId('field-title'), 'Keep me');
    await userEvent.click(screen.getByTestId('save-task'));

    expect((await screen.findByTestId('field-dueDate-error')).textContent).toContain('past');
    expect(value('field-title')).toBe('Keep me');
  });

  it('keeps input and allows another try after a failed save', async () => {
    const api = fakeApi();
    api.createTask.mockRejectedValueOnce(unreachable());
    renderApp('/tasks/new', api);

    await userEvent.type(screen.getByTestId('field-title'), 'Keep me');
    await userEvent.click(screen.getByTestId('save-task'));

    expect(await screen.findByTestId('form-error')).toBeTruthy();
    expect(value('field-title')).toBe('Keep me');

    await userEvent.click(screen.getByTestId('save-task'));
    await waitFor(() => expect(api.createTask).toHaveBeenCalledTimes(2));
  });

  it('blocks a second submit while saving', async () => {
    const api = fakeApi();
    api.createTask.mockImplementation(() => new Promise(() => {}));
    renderApp('/tasks/new', api);

    await userEvent.type(screen.getByTestId('field-title'), 'Only once');
    const form = screen.getByTestId('task-form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() =>
      expect((screen.getByTestId('save-task') as HTMLButtonElement).disabled).toBe(true),
    );
    expect(api.createTask).toHaveBeenCalledTimes(1);
  });
});

describe('Edit task', () => {
  const overdue = aTask({
    title: 'Overdue task',
    description: 'Existing',
    priority: 'HIGH',
    dueDate: '2026-10-31',
  });

  function apiWith(task = overdue) {
    const api = fakeApi();
    api.getTask.mockResolvedValue(task);
    api.updateTask.mockResolvedValue(task);
    return api;
  }

  it('loads the existing values', async () => {
    renderApp('/tasks/task-1/edit', apiWith());

    await screen.findByTestId('task-form');

    expect(value('field-title')).toBe('Overdue task');
    expect(value('field-description')).toBe('Existing');
    expect(value('field-priority')).toBe('HIGH');
    expect(value('field-dueDate')).toBe('2026-10-31');
  });

  it('offers only the current status and allowed next statuses', async () => {
    renderApp('/tasks/task-1/edit', apiWith());

    await screen.findByTestId('task-form');

    expect(options('field-status')).toEqual(['PENDING', 'IN_PROGRESS']);
  });

  it('saves an overdue task with its existing due date', async () => {
    const { api } = renderApp('/tasks/task-1/edit', apiWith());

    await screen.findByTestId('task-form');
    await userEvent.click(screen.getByTestId('save-task'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/tasks/task-1'));
    expect(api.updateTask).toHaveBeenCalledExactlyOnceWith(
      'task-1',
      expect.objectContaining({ dueDate: '2026-10-31' }),
    );
  });

  it('rejects moving to a different past date', async () => {
    const { api } = renderApp('/tasks/task-1/edit', apiWith());

    await screen.findByTestId('task-form');
    setDate('2026-10-01');
    await userEvent.click(screen.getByTestId('save-task'));

    expect(screen.getByTestId('field-dueDate-error')).toBeTruthy();
    expect(api.updateTask).not.toHaveBeenCalled();
  });

  it('sends cleared optional fields as null', async () => {
    const { api } = renderApp('/tasks/task-1/edit', apiWith());

    await screen.findByTestId('task-form');
    await userEvent.clear(screen.getByTestId('field-description'));
    setDate('');
    await userEvent.click(screen.getByTestId('save-task'));

    await waitFor(() =>
      expect(api.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ description: null, dueDate: null }),
      ),
    );
  });

  it('shows not-found for an unknown task', async () => {
    const api = fakeApi();
    api.getTask.mockRejectedValue(notFound());
    renderApp('/tasks/missing/edit', api);

    expect(await screen.findByTestId('task-not-found')).toBeTruthy();
  });
});
