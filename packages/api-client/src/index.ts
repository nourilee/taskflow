import {
  apiErrorSchema,
  healthResponseSchema,
  taskListResponseSchema,
  taskSchema,
  toTaskFieldErrors,
  type ApiErrorBody,
  type CreateTaskInput,
  type HealthResponse,
  type ListTasksQuery,
  type Task,
  type TaskFieldErrors,
  type TaskListResponse,
  type TaskStatus,
  type UpdateTaskInput,
} from '@taskflow/shared';

export type ApiClientErrorKind = 'http' | 'network' | 'invalid_response';
export type ApiErrorDetail = NonNullable<ApiErrorBody['error']['details']>[number];

interface ApiClientErrorOptions {
  status?: number;
  cause?: unknown;
  code?: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly details: ApiErrorDetail[];
  readonly requestId: string | undefined;

  constructor(kind: ApiClientErrorKind, message: string, options: ApiClientErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApiClientError';
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? [];
    this.requestId = options.requestId;
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

export function taskFieldErrors(error: unknown): TaskFieldErrors {
  return error instanceof ApiClientError ? toTaskFieldErrors(error.details) : {};
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.kind === 'http' && error.code) {
    return error.message;
  }
  if (error instanceof ApiClientError && error.kind === 'network') {
    return 'TaskFlow could not reach the server. Check that it is running, then try again.';
  }
  return 'TaskFlow received an unexpected response. Try again.';
}

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
  listTasks(query?: Partial<ListTasksQuery>): Promise<TaskListResponse>;
  getTask(id: string): Promise<Task>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  changeTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

interface ResponseSchema<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown };
}

function toQueryString(query: Partial<ListTasksQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function toHttpError(response: Response): Promise<ApiClientError> {
  const { status } = response;
  const fallback = `The API responded with status ${status}.`;
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(body);
  if (!parsed.success) {
    return new ApiClientError('http', fallback, { status });
  }
  const { code, message, details, requestId } = parsed.data.error;
  return new ApiClientError('http', message, { status, code, details, requestId });
}

export function createApiClient({
  baseUrl,
  fetch = globalThis.fetch,
}: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function send(path: string, init?: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = init ? await fetch(`${root}${path}`, init) : await fetch(`${root}${path}`);
    } catch (cause) {
      throw new ApiClientError('network', 'The API could not be reached.', { cause });
    }
    if (!response.ok) {
      throw await toHttpError(response);
    }
    return response;
  }

  async function request<T>(
    path: string,
    schema: ResponseSchema<T>,
    init?: RequestInit,
  ): Promise<T> {
    const response = await send(path, init);
    const { status } = response;

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new ApiClientError('invalid_response', 'The API response was not valid JSON.', {
        status,
        cause,
      });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiClientError('invalid_response', 'The API response has an unexpected shape.', {
        status,
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  const withJson = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const taskPath = (id: string) => `/tasks/${encodeURIComponent(id)}`;

  return {
    getHealth: () => request('/health', healthResponseSchema),
    listTasks: (query = {}) => request(`/tasks${toQueryString(query)}`, taskListResponseSchema),
    getTask: (id) => request(taskPath(id), taskSchema),
    createTask: (input) => request('/tasks', taskSchema, withJson('POST', input)),
    updateTask: (id, input) => request(taskPath(id), taskSchema, withJson('PUT', input)),
    changeTaskStatus: (id, status) =>
      request(`${taskPath(id)}/status`, taskSchema, withJson('PATCH', { status })),
    deleteTask: async (id) => {
      await send(taskPath(id), { method: 'DELETE' });
    },
  };
}
