"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.createdResponse = createdResponse;
exports.noContentResponse = noContentResponse;
exports.paginatedResponse = paginatedResponse;
exports.errorResponse = errorResponse;
exports.calculatePaginationMeta = calculatePaginationMeta;
// Success response
function successResponse(res, data, message, statusCode = 200, meta) {
    const response = {
        success: true,
        data,
        ...(message && { message }),
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
}
// Created response
function createdResponse(res, data, message = 'Resource created successfully') {
    return successResponse(res, data, message, 201);
}
// No content response
function noContentResponse(res) {
    return res.status(204).send();
}
// Paginated response
function paginatedResponse(res, data, pagination, message) {
    return successResponse(res, data, message, 200, { pagination });
}
// Error response
function errorResponse(res, message, statusCode = 500, code, errors) {
    const response = {
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
function calculatePaginationMeta(page, limit, total) {
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
//# sourceMappingURL=response.js.map