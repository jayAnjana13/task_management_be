import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, isAppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { config } from '../config';

// Not found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  errorResponse(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'NOT_FOUND'
  );
};

// Global error handler
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
  });

  // Handle AppError
  if (isAppError(error)) {
    if (error instanceof ValidationError) {
      errorResponse(
        res,
        error.message,
        error.statusCode,
        error.code,
        error.errors
      );
      return;
    }

    errorResponse(res, error.message, error.statusCode, error.code);
    return;
  }

  // Handle PostgreSQL errors
  if ((error as any).code) {
    const pgError = error as any;
    
    switch (pgError.code) {
      case '23505': // unique_violation
        errorResponse(
          res,
          'A record with this value already exists',
          409,
          'DUPLICATE_ENTRY'
        );
        return;
      case '23503': // foreign_key_violation
        errorResponse(
          res,
          'Referenced record does not exist',
          400,
          'FOREIGN_KEY_VIOLATION'
        );
        return;
      case '23502': // not_null_violation
        errorResponse(
          res,
          'Required field is missing',
          400,
          'NOT_NULL_VIOLATION'
        );
        return;
      case '22P02': // invalid_text_representation (invalid UUID)
        errorResponse(
          res,
          'Invalid identifier format',
          400,
          'INVALID_ID_FORMAT'
        );
        return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    return;
  }

  // Handle syntax errors (e.g., malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    errorResponse(res, 'Invalid JSON in request body', 400, 'INVALID_JSON');
    return;
  }

  // Default error response
  const message =
    config.nodeEnv === 'development'
      ? error.message
      : 'An unexpected error occurred';

  errorResponse(res, message, 500, 'INTERNAL_SERVER_ERROR');
};

// Async handler wrapper to catch errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
