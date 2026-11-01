import { ApiClientError, type ApiClient } from '@taskflow/api-client';
import type { Task, TaskListResponse } from '@taskflow/shared';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
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
    getHealth: jest.fn<ReturnType<ApiClient['getHealth']>, []>(),
    listTasks: jest
      .fn<ReturnType<ApiClient['listTasks']>, Parameters<ApiClient['listTasks']>>()
      .mockResolvedValue(aList([])),
    getTask: jest
      .fn<ReturnType<ApiClient['getTask']>, Parameters<ApiClient['getTask']>>()
      .mockResolvedValue(aTask()),
    createTask: jest
      .fn<ReturnType<ApiClient['createTask']>, Parameters<ApiClient['createTask']>>()
      .mockResolvedValue(aTask()),
    updateTask: jest
      .fn<ReturnType<ApiClient['updateTask']>, Parameters<ApiClient['updateTask']>>()
      .mockResolvedValue(aTask()),
    changeTaskStatus: jest
      .fn<ReturnType<ApiClient['changeTaskStatus']>, Parameters<ApiClient['changeTaskStatus']>>()
      .mockResolvedValue(aTask()),
    deleteTask: jest
      .fn<ReturnType<ApiClient['deleteTask']>, Parameters<ApiClient['deleteTask']>>()
      .mockResolvedValue(undefined),
  };
}

export async function renderScreen(screen: ReactElement, api = fakeApi()) {
  const view = await render(
    <AppProvider services={{ api, today: () => TODAY }}>{screen}</AppProvider>,
  );
  return { ...view, api };
}
