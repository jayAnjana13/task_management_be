"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
exports.getSortParams = getSortParams;
exports.getSearchParam = getSearchParam;
exports.getFilterParams = getFilterParams;
exports.buildWhereClause = buildWhereClause;
exports.buildSearchClause = buildSearchClause;
exports.getQueryParams = getQueryParams;
exports.calculatePaginationMeta = calculatePaginationMeta;
const config_1 = require("../config");
// Extract pagination params from request
function getPaginationParams(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(config_1.config.pagination.maxPageSize, Math.max(1, parseInt(req.query.limit) || config_1.config.pagination.defaultPageSize));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
// Extract sort params from request
function getSortParams(req, allowedFields, defaultField = "created_at") {
    let sortBy = req.query.sortBy || defaultField;
    const sortOrder = (req.query.sortOrder || "DESC").toUpperCase();
    // Validate sort field
    if (!allowedFields.includes(sortBy)) {
        sortBy = defaultField;
    }
    // Validate sort order
    const validOrder = sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";
    return { sortBy, sortOrder: validOrder };
}
// Extract search param from request
function getSearchParam(req) {
    const search = req.query.search;
    return search?.trim() || undefined;
}
// Extract filter params from request
function getFilterParams(req, allowedFilters) {
    const filters = {};
    for (const filter of allowedFilters) {
        const value = req.query[filter];
        if (value !== undefined && value !== "") {
            if (Array.isArray(value)) {
                filters[filter] = value.map(String);
            }
            else {
                filters[filter] = String(value);
            }
        }
    }
    return filters;
}
// Build SQL WHERE clause from filters
function buildWhereClause(filters, fieldMapping, startParamIndex = 1) {
    const conditions = [];
    const params = [];
    let paramIndex = startParamIndex;
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined)
            continue;
        const field = fieldMapping[key] || key;
        if (Array.isArray(value)) {
            const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(", ");
            conditions.push(`${field} IN (${placeholders})`);
            params.push(...value);
            paramIndex += value.length;
        }
        else {
            conditions.push(`${field} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
        }
    }
    return {
        clause: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
        params,
        nextParamIndex: paramIndex,
    };
}
// Build SQL search clause for full-text search
function buildSearchClause(search, fields, paramIndex) {
    if (!search) {
        return { clause: "", params: [], nextParamIndex: paramIndex };
    }
    const conditions = fields
        .map((field) => `${field} ILIKE $${paramIndex}`)
        .join(" OR ");
    return {
        clause: `AND (${conditions})`,
        params: [`%${search}%`],
        nextParamIndex: paramIndex + 1,
    };
}
// Get all query params combined
function getQueryParams(req, allowedSortFields, allowedFilters, defaultSortField = "created_at") {
    return {
        ...getPaginationParams(req),
        ...getSortParams(req, allowedSortFields, defaultSortField),
        search: getSearchParam(req),
        filters: getFilterParams(req, allowedFilters),
    };
}
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
//# sourceMappingURL=pagination.js.map