import { Response } from 'express';

// Standard API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message: string;
    errors?: Record<string, string[]>;
  };
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: any;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Success response
export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
}

// Created response
export function createdResponse<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response {
  return successResponse(res, data, message, 201);
}

// No content response
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

// Paginated response
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string
): Response {
  return successResponse(res, data, message, 200, { pagination });
}

// Error response
export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      ...(code && { code }),
      message,
      ...(errors && { errors }),
    },
  };

  return res.status(statusCode).json(response);
}

// Calculate pagination meta
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
