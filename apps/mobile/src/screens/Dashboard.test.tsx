import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { aList, aTask, fakeApi, renderScreen, unreachable } from '../test/harness';
import { Dashboard } from './Dashboard';

const pending = aTask({ id: 'p', title: 'Pending task', dueDate: '2099-01-01' });
const late = aTask({ id: 'late', title: 'Late task', dueDate: '2026-10-31' });
const lateDone = aTask({
  id: 'done',
  title: 'Late but done',
  status: 'COMPLETED',
  dueDate: '2026-10-31',
});

function apiWith(...tasks: ReturnType<typeof aTask>[]) {
  const api = fakeApi();
  api.listTasks.mockResolvedValue(aList(tasks));
  return api;
}

const lastQuery = (api: ReturnType<typeof fakeApi>) => api.listTasks.mock.lastCall?.[0];
const open = (api = fakeApi()) => renderScreen(<Dashboard />, api);

describe('Dashboard', () => {
  it('shows counts and cards from API data', async () => {
    await open(apiWith(pending, late, lateDone));

    expect(await screen.findByTestId('task-card-p')).toBeTruthy();
    expect(screen.getByTestId('dashboard-summary-all')).toHaveTextContent('3');
    expect(screen.getByTestId('dashboard-summary-pending')).toHaveTextContent('2');
    expect(screen.getByTestId('dashboard-summary-in-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('dashboard-summary-completed')).toHaveTextContent('1');
  });

  it('marks only incomplete tasks due before today as overdue', async () => {
    await open(apiWith(pending, late, lateDone));

    expect(await screen.findByTestId('task-overdue-late')).toBeTruthy();
    expect(screen.queryByTestId('task-overdue-done')).toBeNull();
    expect(screen.queryByTestId('task-overdue-p')).toBeNull();
  });

  it.each([
    ['status-filter-pending', 'PENDING'],
    ['status-filter-in-progress', 'IN_PROGRESS'],
    ['status-filter-completed', 'COMPLETED'],
  ])('requests the status chosen with %s', async (testId, status) => {
    const api = apiWith(pending);
    await open(api);

    await fireEvent.press(await screen.findByTestId(testId));

    await waitFor(() => expect(lastQuery(api)).toMatchObject({ status }));
  });

  it('sends a trimmed search after typing stops', async () => {
    const api = apiWith(pending);
    await open(api);

    await fireEvent.changeText(await screen.findByTestId('task-search'), '  ÉTÉ ');

    await waitFor(() => expect(lastQuery(api)).toMatchObject({ search: 'ÉTÉ' }));
  });

  it('toggles the sort order', async () => {
    const api = apiWith(pending);
    await open(api);

    await fireEvent.press(await screen.findByTestId('task-sort'));

    await waitFor(() => expect(lastQuery(api)).toMatchObject({ sort: 'dueDate', order: 'desc' }));
  });

  it('opens a task and the create screen', async () => {
    await open(apiWith(pending));

    await fireEvent.press(await screen.findByTestId('task-card-p'));
    await fireEvent.press(screen.getByTestId('create-task'));

    expect(mockRouter.push).toHaveBeenCalledWith('/tasks/p');
    expect(mockRouter.push).toHaveBeenCalledWith('/tasks/new');
  });

  it('invites the user to create a task when there are none', async () => {
    await open();

    expect(await screen.findByTestId('empty-state')).toBeTruthy();
  });

  it('shows a no-results state that clears filters', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValue(
      aList([], { summary: { all: 2, pending: 2, inProgress: 0, completed: 0 } }),
    );
    await open(api);

    await fireEvent.press(await screen.findByTestId('status-filter-completed'));
    await fireEvent.press(await screen.findByTestId('clear-filters'));

    await waitFor(() => expect(lastQuery(api)?.status).toBeUndefined());
  });

  it('shows an understandable error and recovers through retry', async () => {
    const api = apiWith(pending);
    api.listTasks.mockRejectedValueOnce(unreachable());
    await open(api);

    expect(await screen.findByTestId('load-error')).toHaveTextContent(/could not reach the server/);

    await fireEvent.press(screen.getByTestId('retry'));

    expect(await screen.findByTestId('task-card-p')).toBeTruthy();
    expect(screen.queryByTestId('load-error')).toBeNull();
  });

  it('appends the next page with Load more', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValueOnce(aList([pending], { total: 2 }));
    api.listTasks.mockResolvedValueOnce(aList([late], { total: 2, page: 2 }));
    await open(api);

    await fireEvent.press(await screen.findByTestId('load-more'));

    expect(await screen.findByTestId('task-card-late')).toBeTruthy();
    expect(screen.getByTestId('task-card-p')).toBeTruthy();
    expect(lastQuery(api)).toMatchObject({ page: 2 });
    expect(screen.queryByTestId('load-more')).toBeNull();
  });

  it('keeps the list and reports a failed Load more', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValueOnce(aList([pending], { total: 2 }));
    api.listTasks.mockRejectedValueOnce(unreachable());
    await open(api);

    await fireEvent.press(await screen.findByTestId('load-more'));

    expect(await screen.findByTestId('load-more-error')).toBeTruthy();
    expect(screen.getByTestId('task-card-p')).toBeTruthy();
  });

  it('ignores a slow response that arrives after a newer one', async () => {
    const api = fakeApi();
    let finishSlow: (list: ReturnType<typeof aList>) => void = () => {};
    api.listTasks.mockResolvedValueOnce(aList([pending]));
    api.listTasks.mockImplementationOnce(() => new Promise((resolve) => (finishSlow = resolve)));
    api.listTasks.mockResolvedValue(aList([late]));
    await open(api);

    await fireEvent.press(await screen.findByTestId('status-filter-completed'));
    await fireEvent.press(screen.getByTestId('status-filter-pending'));
    expect(await screen.findByTestId('task-card-late')).toBeTruthy();

    await act(async () => finishSlow(aList([lateDone])));

    expect(screen.getByTestId('task-card-late')).toBeTruthy();
    expect(screen.queryByTestId('task-card-done')).toBeNull();
  });
});
