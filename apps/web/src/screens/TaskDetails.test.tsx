import { ApiClientError } from '@taskflow/api-client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aTask, fakeApi, notFound, renderApp, unreachable } from '../test/render-app';

function apiWith(task = aTask()) {
  const api = fakeApi();
  api.getTask.mockResolvedValue(task);
  return api;
}

describe('Task Details', () => {
  it('displays all task fields', async () => {
    renderApp(
      '/tasks/task-1',
      apiWith(
        aTask({
          title: 'Plan release',
          description: 'Write the notes',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: '2099-06-30',
        }),
      ),
    );

    expect((await screen.findByTestId('task-title')).textContent).toBe('Plan release');
    expect(screen.getByTestId('task-description').textContent).toBe('Write the notes');
    expect(screen.getByTestId('task-priority').textContent).toBe('High');
    expect(screen.getByTestId('task-status').textContent).toBe('In progress');
    expect(screen.getByTestId('task-due-date').textContent).toContain('2099');
    expect(screen.getByTestId('task-created-at').textContent).not.toBe('');
    expect(screen.getByTestId('task-updated-at').textContent).not.toBe('');
  });

  it('shows placeholders for empty optional fields', async () => {
    renderApp('/tasks/task-1', apiWith());

    expect((await screen.findByTestId('task-description')).textContent).toBe('No description');
    expect(screen.getByTestId('task-due-date').textContent).toBe('No due date');
  });

  it('marks an overdue task but not a completed one', async () => {
    const first = renderApp('/tasks/task-1', apiWith(aTask({ dueDate: '2026-10-31' })));
    expect(await screen.findByTestId('task-overdue-task-1')).toBeTruthy();
    first.unmount();

    renderApp('/tasks/task-1', apiWith(aTask({ dueDate: '2026-10-31', status: 'COMPLETED' })));
    await screen.findByTestId('task-title');
    expect(screen.queryByTestId('task-overdue-task-1')).toBeNull();
  });

  it.each([
    ['PENDING', 'status-action-in-progress'],
    ['IN_PROGRESS', 'status-action-completed'],
    ['COMPLETED', 'status-action-pending'],
  ] as const)('offers only the allowed action for %s', async (status, action) => {
    renderApp('/tasks/task-1', apiWith(aTask({ status })));

    await screen.findByTestId('task-title');

    const actions = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('data-testid'))
      .filter((id) => id?.startsWith('status-action'));
    expect(actions).toEqual([action]);
  });

  it('changes status and shows the result', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockResolvedValue(aTask({ status: 'IN_PROGRESS' }));
    renderApp('/tasks/task-1', api);

    await userEvent.click(await screen.findByTestId('status-action-in-progress'));

    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('In progress'));
    expect(api.changeTaskStatus).toHaveBeenCalledExactlyOnceWith('task-1', 'IN_PROGRESS');
  });

  it('keeps the task on screen when a status change fails', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockRejectedValue(unreachable());
    renderApp('/tasks/task-1', api);

    await userEvent.click(await screen.findByTestId('status-action-in-progress'));

    expect((await screen.findByTestId('action-error')).textContent).toContain('could not reach');
    expect(screen.getByTestId('task-status').textContent).toBe('Pending');
  });

  it('reloads the task when its status changed elsewhere', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockRejectedValue(
      new ApiClientError('http', 'A task cannot move from COMPLETED to IN_PROGRESS.', {
        status: 409,
        code: 'INVALID_STATUS_TRANSITION',
      }),
    );
    renderApp('/tasks/task-1', api);

    await userEvent.click(await screen.findByTestId('status-action-in-progress'));

    await waitFor(() => expect(api.getTask).toHaveBeenCalledTimes(2));
  });

  it('deletes only after confirmation, then returns to the dashboard', async () => {
    const { api } = renderApp('/tasks/task-1', apiWith());

    await userEvent.click(await screen.findByTestId('delete-task'));
    expect(api.deleteTask).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('confirm-delete'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
    expect(api.deleteTask).toHaveBeenCalledExactlyOnceWith('task-1');
  });

  it('starts the delete dialog on the safe choice', async () => {
    renderApp('/tasks/task-1', apiWith());

    await userEvent.click(await screen.findByTestId('delete-task'));

    expect(document.activeElement).toBe(screen.getByTestId('cancel-delete'));
  });

  it('keeps the task when deletion is cancelled', async () => {
    const { api } = renderApp('/tasks/task-1', apiWith());

    await userEvent.click(await screen.findByTestId('delete-task'));
    await userEvent.click(screen.getByTestId('cancel-delete'));

    expect(api.deleteTask).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/tasks/task-1');
  });

  it('stays on the task when deletion fails', async () => {
    const api = apiWith();
    api.deleteTask.mockRejectedValue(unreachable());
    renderApp('/tasks/task-1', api);

    await userEvent.click(await screen.findByTestId('delete-task'));
    await userEvent.click(screen.getByTestId('confirm-delete'));

    expect(await screen.findByTestId('action-error')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/tasks/task-1');
  });

  it('shows a not-found state for an unknown task', async () => {
    const api = fakeApi();
    api.getTask.mockRejectedValue(notFound());
    renderApp('/tasks/missing', api);

    expect(await screen.findByTestId('task-not-found')).toBeTruthy();
    expect(screen.getByTestId('back-to-dashboard').getAttribute('href')).toBe('/');
  });

  it('offers a retry when loading fails', async () => {
    const api = apiWith();
    api.getTask.mockRejectedValueOnce(unreachable());
    renderApp('/tasks/task-1', api);

    await userEvent.click(await screen.findByTestId('retry'));

    expect(await screen.findByTestId('task-title')).toBeTruthy();
  });

  it('redirects a malformed path to the dashboard', async () => {
    renderApp('/tasks/task-1/nope/extra');

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
  });
});
