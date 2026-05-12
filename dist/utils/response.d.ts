import { Response } from 'express';
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
export declare function successResponse<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: ApiResponse['meta']): Response;
export declare function createdResponse<T>(res: Response, data: T, message?: string): Response;
export declare function noContentResponse(res: Response): Response;
export declare function paginatedResponse<T>(res: Response, data: T[], pagination: PaginationMeta, message?: string): Response;
export declare function errorResponse(res: Response, message: string, statusCode?: number, code?: string, errors?: Record<string, string[]>): Response;
export declare function calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta;
//# sourceMappingURL=response.d.ts.map