import { ApiClientError, type ApiClient } from '@taskflow/api-client';
import type { Task, TaskListResponse } from '@taskflow/shared';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { vi } from 'vitest';
import { App } from '../App';
import { AppProvider } from '../lib/app-context';

export const TODAY = '2026-11-01';

export function aTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Write tests',
    description: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: null,
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
    ...overrides,
  };
}

export function aList(items: Task[], overrides: Partial<TaskListResponse> = {}): TaskListResponse {
  const count = (status: Task['status']) => items.filter((task) => task.status === status).length;
  return {
    items,
    page: 1,
    limit: 20,
    total: items.length,
    summary: {
      all: items.length,
      pending: count('PENDING'),
      inProgress: count('IN_PROGRESS'),
      completed: count('COMPLETED'),
    },
    ...overrides,
  };
}

export const notFound = () =>
  new ApiClientError('http', 'Task not found.', { status: 404, code: 'NOT_FOUND' });
export const unreachable = () => new ApiClientError('network', 'The API could not be reached.');

export function fakeApi() {
  return {
    getHealth: vi.fn<ApiClient['getHealth']>(),
    listTasks: vi.fn<ApiClient['listTasks']>().mockResolvedValue(aList([])),
    getTask: vi.fn<ApiClient['getTask']>().mockResolvedValue(aTask()),
    createTask: vi.fn<ApiClient['createTask']>().mockResolvedValue(aTask()),
    updateTask: vi.fn<ApiClient['updateTask']>().mockResolvedValue(aTask()),
    changeTaskStatus: vi.fn<ApiClient['changeTaskStatus']>().mockResolvedValue(aTask()),
    deleteTask: vi.fn<ApiClient['deleteTask']>().mockResolvedValue(undefined),
  };
}

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

export function renderApp(path: string, api = fakeApi()) {
  const services = { api, today: () => TODAY };
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider services={services}>
        <App />
        <LocationProbe />
      </AppProvider>
    </MemoryRouter>,
  );
  return { ...view, api };
}
