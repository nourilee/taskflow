import type { z } from 'zod';

export interface ErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function validationError(details: ErrorDetail[]): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', 'The request contains invalid fields.', details);
}

export function notFoundError(message = 'The requested resource was not found.'): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  throw validationError(
    result.error.issues.flatMap((issue) => {
      if (issue.code === 'unrecognized_keys') {
        return issue.keys.map((key) => ({ field: key, message: 'This field is not allowed.' }));
      }
      return [{ field: issue.path.join('.'), message: issue.message }];
    }),
  );
}
