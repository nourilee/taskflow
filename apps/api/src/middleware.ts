import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { ApiError, notFoundError } from './errors.js';

export const assignRequestId: RequestHandler = (_req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export const handleUnknownRoute: RequestHandler = (_req, _res, next) => {
  next(notFoundError());
};

function isBodyParserError(error: unknown): error is { type: string; status: number } {
  return typeof error === 'object' && error !== null && 'type' in error && 'status' in error;
}

function toApiError(error: unknown, res: Response): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isBodyParserError(error) && error.type === 'entity.parse.failed') {
    return new ApiError(400, 'MALFORMED_JSON', 'The request body is not valid JSON.');
  }
  if (isBodyParserError(error) && error.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.');
  }
  console.error(`Unexpected error for request ${res.locals.requestId}`, error);
  return new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}

// Express identifies error handlers by their four parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  const { status, code, message, details } = toApiError(error, res);
  res.status(status).json({
    error: { code, message, details, requestId: res.locals.requestId },
  });
};
