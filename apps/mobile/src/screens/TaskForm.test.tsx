import { ApiClientError } from '@taskflow/api-client';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { aTask, fakeApi, notFound, renderScreen, TODAY, unreachable } from '../test/harness';
import { CreateTask, EditTask } from './TaskForm';

const type = (testId: string, text: string) =>
  fireEvent.changeText(screen.getByTestId(testId), text);
const press = (testId: string) => fireEvent.press(screen.getByTestId(testId));
const isSelected = (testId: string) =>
  screen.getByTestId(testId).props.accessibilityState?.selected === true;

async function pickDate(date: Date) {
  await press('field-dueDate');
  await fireEvent(screen.getByTestId('due-date-picker'), 'onValueChange', {}, date);
}

describe('Create task', () => {
  it('starts with the documented defaults and all statuses', async () => {
    await renderScreen(<CreateTask />);

    expect(isSelected('field-priority-MEDIUM')).toBe(true);
    expect(isSelected('field-status-PENDING')).toBe(true);
    expect(screen.getByTestId('field-status-IN_PROGRESS')).toBeTruthy();
    expect(screen.getByTestId('field-status-COMPLETED')).toBeTruthy();
  });

  it('trims the title, creates the task, and opens its details', async () => {
    const api = fakeApi();
    api.createTask.mockResolvedValue(aTask({ id: 'created' }));
    await renderScreen(<CreateTask />, api);

    await type('field-title', '  New task  ');
    await type('field-description', 'Details');
    await press('field-priority-HIGH');
    await pickDate(new Date(2026, 10, 1));
    await press('save-task');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/tasks/created'));
    expect(api.createTask).toHaveBeenCalledWith({
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
    const { api } = await renderScreen(<CreateTask />);

    await type('field-title', title);
    await press('save-task');

    expect(screen.getByTestId('field-title-error')).toHaveTextContent(message);
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('rejects a long description', async () => {
    const { api } = await renderScreen(<CreateTask />);

    await type('field-title', 'Valid');
    await type('field-description', 'a'.repeat(501));
    await press('save-task');

    expect(screen.getByTestId('field-description-error')).toBeTruthy();
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('rejects a past due date', async () => {
    const { api } = await renderScreen(<CreateTask />);

    await type('field-title', 'Valid');
    await pickDate(new Date(2026, 9, 31));
    await press('save-task');

    expect(screen.getByTestId('field-dueDate-error')).toHaveTextContent(
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
    await renderScreen(<CreateTask />, api);

    await type('field-title', 'Keep me');
    await press('save-task');

    expect(await screen.findByTestId('field-dueDate-error')).toBeTruthy();
    expect(screen.getByTestId('field-title').props.value).toBe('Keep me');
  });

  it('keeps input and allows another try after a failed save', async () => {
    const api = fakeApi();
    api.createTask.mockRejectedValueOnce(unreachable());
    await renderScreen(<CreateTask />, api);

    await type('field-title', 'Keep me');
    await press('save-task');

    expect(await screen.findByTestId('form-error')).toBeTruthy();
    expect(screen.getByTestId('field-title').props.value).toBe('Keep me');

    await press('save-task');
    await waitFor(() => expect(api.createTask).toHaveBeenCalledTimes(2));
  });

  it('blocks a second submit while saving', async () => {
    const api = fakeApi();
    api.createTask.mockImplementation(() => new Promise(() => {}));
    await renderScreen(<CreateTask />, api);

    await type('field-title', 'Only once');
    await press('save-task');
    await press('save-task');

    expect(api.createTask).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('save-task')).toBeDisabled();
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

  async function open(api = apiWith()) {
    setRouteParams({ taskId: 'task-1' });
    const view = await renderScreen(<EditTask />, api);
    await screen.findByTestId('task-form');
    return view;
  }

  it('loads the existing values and allowed statuses only', async () => {
    await open();

    expect(screen.getByTestId('field-title').props.value).toBe('Overdue task');
    expect(screen.getByTestId('field-description').props.value).toBe('Existing');
    expect(isSelected('field-priority-HIGH')).toBe(true);
    expect(screen.getByTestId('field-status-IN_PROGRESS')).toBeTruthy();
    expect(screen.queryByTestId('field-status-COMPLETED')).toBeNull();
  });

  it('saves an overdue task with its existing due date', async () => {
    const { api } = await open();

    await press('save-task');

    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/tasks/task-1'));
    expect(api.updateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ dueDate: '2026-10-31' }),
    );
  });

  it('rejects moving to a different past date', async () => {
    const { api } = await open();

    await pickDate(new Date(2026, 9, 1));
    await press('save-task');

    expect(screen.getByTestId('field-dueDate-error')).toBeTruthy();
    expect(api.updateTask).not.toHaveBeenCalled();
  });

  it('sends cleared optional fields as null', async () => {
    const { api } = await open();

    await type('field-description', '');
    await press('clear-due-date');
    await press('save-task');

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
    setRouteParams({ taskId: 'missing' });
    await renderScreen(<EditTask />, api);

    expect(await screen.findByTestId('task-not-found')).toBeTruthy();
  });
});
