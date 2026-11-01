import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aList, aTask, fakeApi, renderApp, unreachable } from '../test/render-app';

const pending = aTask({ id: 'p', title: 'Pending task', dueDate: '2099-01-01' });
const late = aTask({ id: 'late', title: 'Late task', dueDate: '2026-10-31' });
const lateDone = aTask({
  id: 'done',
  title: 'Late but done',
  status: 'COMPLETED',
  dueDate: '2026-10-31',
});
const dueToday = aTask({ id: 'today', title: 'Due today', dueDate: '2026-11-01' });

function apiWith(...tasks: ReturnType<typeof aTask>[]) {
  const api = fakeApi();
  api.listTasks.mockResolvedValue(aList(tasks));
  return api;
}

describe('Dashboard', () => {
  it('shows the app name and task counts and cards from API data', async () => {
    renderApp('/', apiWith(pending, late, lateDone));

    expect(await screen.findByTestId('task-card-p')).toBeTruthy();
    expect(screen.getByTestId('app-title').textContent).toBe('TaskFlow');
    expect(screen.getByTestId('dashboard-summary-all').textContent).toBe('3');
    expect(screen.getByTestId('dashboard-summary-pending').textContent).toBe('2');
    expect(screen.getByTestId('dashboard-summary-in-progress').textContent).toBe('0');
    expect(screen.getByTestId('dashboard-summary-completed').textContent).toBe('1');
  });

  it('marks only incomplete tasks due before today as overdue', async () => {
    renderApp('/', apiWith(pending, late, lateDone, dueToday));

    expect(await screen.findByTestId('task-overdue-late')).toBeTruthy();
    expect(screen.queryByTestId('task-overdue-done')).toBeNull();
    expect(screen.queryByTestId('task-overdue-today')).toBeNull();
    expect(screen.queryByTestId('task-overdue-p')).toBeNull();
  });

  it.each([
    ['status-filter-pending', 'PENDING'],
    ['status-filter-in-progress', 'IN_PROGRESS'],
    ['status-filter-completed', 'COMPLETED'],
  ])('requests the status chosen with %s', async (testId, status) => {
    const { api } = renderApp('/', apiWith(pending));

    await userEvent.click(await screen.findByTestId(testId));

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ status })),
    );
    expect(screen.getByTestId(testId).getAttribute('aria-pressed')).toBe('true');
  });

  it('clears the status filter with All', async () => {
    const { api } = renderApp('/?status=COMPLETED', apiWith(pending));

    await userEvent.click(await screen.findByTestId('status-filter-all'));

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: undefined }),
      ),
    );
  });

  it('sends the search term after typing stops and keeps it in the URL', async () => {
    const { api } = renderApp('/', apiWith(pending));

    await userEvent.type(await screen.findByTestId('task-search'), 'ÉTÉ');

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ÉTÉ' })),
    );
    expect(screen.getByTestId('location').textContent).toContain('search=');
    expect(api.listTasks).toHaveBeenCalledTimes(2);
  });

  it('leaves out a search of only spaces', async () => {
    const { api } = renderApp('/?search=%20%20', apiWith(pending));

    await screen.findByTestId('task-card-p');

    expect(api.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined }));
  });

  it('changes the sort order', async () => {
    const { api } = renderApp('/', apiWith(pending));

    await userEvent.selectOptions(await screen.findByTestId('task-sort'), 'desc');

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'dueDate', order: 'desc' }),
      ),
    );
  });

  it('reads filters from the URL and ignores invalid values', async () => {
    const { api } = renderApp('/?status=DONE&page=-1&order=up', apiWith(pending));

    await screen.findByTestId('task-card-p');

    expect(api.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined, page: 1, order: 'asc' }),
    );
  });

  it('invites the user to create a task when there are none', async () => {
    renderApp('/');

    expect(await screen.findByTestId('empty-state')).toBeTruthy();
    expect(screen.getByTestId('create-task').getAttribute('href')).toBe('/tasks/new');
  });

  it('shows a no-results state that can clear filters', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValue(
      aList([], { summary: { all: 2, pending: 2, inProgress: 0, completed: 0 } }),
    );
    renderApp('/?status=COMPLETED&search=nothing', api);

    await userEvent.click(await screen.findByTestId('clear-filters'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  it('shows an understandable error when the API is unavailable', async () => {
    const api = fakeApi();
    api.listTasks.mockRejectedValue(unreachable());
    renderApp('/', api);

    expect((await screen.findByRole('alert')).textContent).toContain('could not reach the server');
  });

  it('recovers through retry after a failed load', async () => {
    const api = apiWith(pending);
    api.listTasks.mockRejectedValueOnce(unreachable());
    renderApp('/', api);

    await userEvent.click(await screen.findByTestId('retry'));

    expect(await screen.findByTestId('task-card-p')).toBeTruthy();
    expect(screen.queryByTestId('load-error')).toBeNull();
  });

  it('moves between pages', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValue(aList([pending], { total: 45 }));
    renderApp('/', api);

    await userEvent.click(await screen.findByTestId('next-page'));

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );
    expect(screen.getByTestId('page-indicator').textContent).toBe('Page 2 of 3');
  });

  it('returns to the first page when a filter changes', async () => {
    const api = fakeApi();
    api.listTasks.mockResolvedValue(aList([pending], { total: 45 }));
    renderApp('/?page=2', api);

    await userEvent.click(await screen.findByTestId('status-filter-completed'));

    await waitFor(() =>
      expect(api.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'COMPLETED', page: 1 }),
      ),
    );
  });

  it('ignores a slow response that arrives after a newer one', async () => {
    const api = fakeApi();
    let finishSlow: (list: ReturnType<typeof aList>) => void = () => {};
    api.listTasks.mockResolvedValueOnce(aList([pending]));
    api.listTasks.mockImplementationOnce(() => new Promise((resolve) => (finishSlow = resolve)));
    api.listTasks.mockResolvedValue(aList([late]));
    renderApp('/', api);

    await userEvent.click(await screen.findByTestId('status-filter-completed'));
    await userEvent.click(screen.getByTestId('status-filter-pending'));
    expect(await screen.findByTestId('task-card-late')).toBeTruthy();

    finishSlow(aList([lateDone]));
    await new Promise((resolve) => setTimeout(resolve));

    expect(screen.getByTestId('task-card-late')).toBeTruthy();
    expect(screen.queryByTestId('task-card-done')).toBeNull();
  });
});
