import { healthResponseSchema, type HealthResponse } from '@taskflow/shared';

export type ApiClientErrorKind = 'http' | 'network' | 'invalid_response';

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly status: number | undefined;

  constructor(
    kind: ApiClientErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiClientError';
    this.kind = kind;
    this.status = options.status;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
}

export function createApiClient({
  baseUrl,
  fetch = globalThis.fetch,
}: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  return {
    async getHealth() {
      let response: Response;
      try {
        response = await fetch(`${root}/health`);
      } catch (cause) {
        throw new ApiClientError('network', 'The API could not be reached.', { cause });
      }

      const { status } = response;
      if (!response.ok) {
        throw new ApiClientError('http', `The API responded with status ${status}.`, { status });
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (cause) {
        throw new ApiClientError('invalid_response', 'The API response was not valid JSON.', {
          status,
          cause,
        });
      }

      const parsed = healthResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiClientError('invalid_response', 'The API response has an unexpected shape.', {
          status,
          cause: parsed.error,
        });
      }
      return parsed.data;
    },
  };
}
