"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.notFoundHandler = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const config_1 = require("../config");
// Not found handler
const notFoundHandler = (req, res, _next) => {
    (0, response_1.errorResponse)(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND');
};
exports.notFoundHandler = notFoundHandler;
// Global error handler
const errorHandler = (error, _req, res, _next) => {
    // Log error
    console.error('Error:', {
        name: error.name,
        message: error.message,
        stack: config_1.config.nodeEnv === 'development' ? error.stack : undefined,
    });
    // Handle AppError
    if ((0, errors_1.isAppError)(error)) {
        if (error instanceof errors_1.ValidationError) {
            (0, response_1.errorResponse)(res, error.message, error.statusCode, error.code, error.errors);
            return;
        }
        (0, response_1.errorResponse)(res, error.message, error.statusCode, error.code);
        return;
    }
    // Handle PostgreSQL errors
    if (error.code) {
        const pgError = error;
        switch (pgError.code) {
            case '23505': // unique_violation
                (0, response_1.errorResponse)(res, 'A record with this value already exists', 409, 'DUPLICATE_ENTRY');
                return;
            case '23503': // foreign_key_violation
                (0, response_1.errorResponse)(res, 'Referenced record does not exist', 400, 'FOREIGN_KEY_VIOLATION');
                return;
            case '23502': // not_null_violation
                (0, response_1.errorResponse)(res, 'Required field is missing', 400, 'NOT_NULL_VIOLATION');
                return;
            case '22P02': // invalid_text_representation (invalid UUID)
                (0, response_1.errorResponse)(res, 'Invalid identifier format', 400, 'INVALID_ID_FORMAT');
                return;
        }
    }
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        (0, response_1.errorResponse)(res, 'Invalid token', 401, 'INVALID_TOKEN');
        return;
    }
    if (error.name === 'TokenExpiredError') {
        (0, response_1.errorResponse)(res, 'Token expired', 401, 'TOKEN_EXPIRED');
        return;
    }
    // Handle syntax errors (e.g., malformed JSON)
    if (error instanceof SyntaxError && 'body' in error) {
        (0, response_1.errorResponse)(res, 'Invalid JSON in request body', 400, 'INVALID_JSON');
        return;
    }
    // Default error response
    const message = config_1.config.nodeEnv === 'development'
        ? error.message
        : 'An unexpected error occurred';
    (0, response_1.errorResponse)(res, message, 500, 'INTERNAL_SERVER_ERROR');
};
exports.errorHandler = errorHandler;
// Async handler wrapper to catch errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map