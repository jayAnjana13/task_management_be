export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>, message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, code?: string);
}
export declare function handleError(error: unknown): AppError;
export declare function isAppError(error: unknown): error is AppError;
//# sourceMappingURL=errors.d.ts.map