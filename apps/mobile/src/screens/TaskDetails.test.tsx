import { ApiClientError } from '@taskflow/api-client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { aTask, fakeApi, notFound, renderScreen, unreachable } from '../test/harness';
import { TaskDetails } from './TaskDetails';

function apiWith(task = aTask()) {
  const api = fakeApi();
  api.getTask.mockResolvedValue(task);
  return api;
}

function open(api = apiWith()) {
  setRouteParams({ taskId: 'task-1' });
  return renderScreen(<TaskDetails />, api);
}

function alertButton(label: string): AlertButton {
  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2] ?? [];
  return buttons.find((button) => button.text === label)!;
}

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('Task Details', () => {
  it('displays all task fields', async () => {
    await open(
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

    expect(await screen.findByTestId('task-title')).toHaveTextContent('Plan release');
    expect(screen.getByTestId('task-description')).toHaveTextContent('Write the notes');
    expect(screen.getByTestId('task-priority')).toHaveTextContent('High');
    expect(screen.getByTestId('task-status')).toHaveTextContent('In progress');
    expect(screen.getByTestId('task-due-date')).toHaveTextContent(/2099/);
    expect(screen.getByTestId('task-created-at')).toBeTruthy();
    expect(screen.getByTestId('task-updated-at')).toBeTruthy();
  });

  it('marks an overdue task', async () => {
    await open(apiWith(aTask({ dueDate: '2026-10-31' })));

    expect(await screen.findByTestId('task-overdue-task-1')).toBeTruthy();
  });

  it('does not mark a completed task overdue', async () => {
    await open(apiWith(aTask({ dueDate: '2026-10-31', status: 'COMPLETED' })));

    await screen.findByTestId('task-title');
    expect(screen.queryByTestId('task-overdue-task-1')).toBeNull();
  });

  it.each([
    ['PENDING', 'status-action-in-progress', ['status-action-completed', 'status-action-pending']],
    [
      'IN_PROGRESS',
      'status-action-completed',
      ['status-action-in-progress', 'status-action-pending'],
    ],
    [
      'COMPLETED',
      'status-action-pending',
      ['status-action-in-progress', 'status-action-completed'],
    ],
  ] as const)('offers only the allowed action for %s', async (status, allowed, blocked) => {
    await open(apiWith(aTask({ status })));

    expect(await screen.findByTestId(allowed)).toBeTruthy();
    for (const id of blocked) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
  });

  it('changes status and shows the result', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockResolvedValue(aTask({ status: 'IN_PROGRESS' }));
    await open(api);

    await fireEvent.press(await screen.findByTestId('status-action-in-progress'));

    await waitFor(() => expect(screen.getByTestId('task-status')).toHaveTextContent('In progress'));
    expect(api.changeTaskStatus).toHaveBeenCalledWith('task-1', 'IN_PROGRESS');
  });

  it('keeps the task on screen when a status change fails', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockRejectedValue(unreachable());
    await open(api);

    await fireEvent.press(await screen.findByTestId('status-action-in-progress'));

    expect(await screen.findByTestId('action-error')).toHaveTextContent(/could not reach/);
    expect(screen.getByTestId('task-status')).toHaveTextContent('Pending');
  });

  it('reloads the task when its status changed elsewhere', async () => {
    const api = apiWith();
    api.changeTaskStatus.mockRejectedValue(
      new ApiClientError('http', 'A task cannot move from COMPLETED to IN_PROGRESS.', {
        status: 409,
        code: 'INVALID_STATUS_TRANSITION',
      }),
    );
    await open(api);

    await fireEvent.press(await screen.findByTestId('status-action-in-progress'));

    await waitFor(() => expect(api.getTask).toHaveBeenCalledTimes(2));
  });

  it('asks before deleting and keeps the task when cancelled', async () => {
    const { api } = await open();

    await fireEvent.press(await screen.findByTestId('delete-task'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(alertButton('Keep task').style).toBe('cancel');
    expect(api.deleteTask).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and returns to the dashboard', async () => {
    const { api } = await open();

    await fireEvent.press(await screen.findByTestId('delete-task'));
    await act(async () => alertButton('Delete task').onPress?.());

    expect(api.deleteTask).toHaveBeenCalledWith('task-1');
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/');
  });

  it('stays on the task when deletion fails', async () => {
    const api = apiWith();
    api.deleteTask.mockRejectedValue(unreachable());
    await open(api);

    await fireEvent.press(await screen.findByTestId('delete-task'));
    await act(async () => alertButton('Delete task').onPress?.());

    expect(await screen.findByTestId('action-error')).toBeTruthy();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  it('shows a not-found state for an unknown task', async () => {
    const api = fakeApi();
    api.getTask.mockRejectedValue(notFound());
    await open(api);

    await fireEvent.press(await screen.findByTestId('back-to-dashboard'));

    expect(screen.getByTestId('task-not-found')).toBeTruthy();
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/');
  });

  it('offers a retry when loading fails', async () => {
    const api = apiWith();
    api.getTask.mockRejectedValueOnce(unreachable());
    await open(api);

    await fireEvent.press(await screen.findByTestId('retry'));

    expect(await screen.findByTestId('task-title')).toBeTruthy();
  });
});
