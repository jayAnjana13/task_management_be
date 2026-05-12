import { Request } from "express";
import { config } from "../config";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

export interface FilterParams {
  [key: string]: string | string[] | undefined;
}

export interface QueryParams extends PaginationParams, SortParams {
  search?: string;
  filters: FilterParams;
}

// Extract pagination params from request
export function getPaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    config.pagination.maxPageSize,
    Math.max(
      1,
      parseInt(req.query.limit as string) || config.pagination.defaultPageSize,
    ),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Extract sort params from request
export function getSortParams(
  req: Request,
  allowedFields: string[],
  defaultField: string = "created_at",
): SortParams {
  let sortBy = (req.query.sortBy as string) || defaultField;
  const sortOrder = (
    (req.query.sortOrder as string) || "DESC"
  ).toUpperCase() as "ASC" | "DESC";

  // Validate sort field
  if (!allowedFields.includes(sortBy)) {
    sortBy = defaultField;
  }

  // Validate sort order
  const validOrder =
    sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : "DESC";

  return { sortBy, sortOrder: validOrder };
}

// Extract search param from request
export function getSearchParam(req: Request): string | undefined {
  const search = req.query.search as string;
  return search?.trim() || undefined;
}

// Extract filter params from request
export function getFilterParams(
  req: Request,
  allowedFilters: string[],
): FilterParams {
  const filters: FilterParams = {};

  for (const filter of allowedFilters) {
    const value = req.query[filter];
    if (value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        filters[filter] = value.map(String);
      } else {
        filters[filter] = String(value);
      }
    }
  }

  return filters;
}

// Build SQL WHERE clause from filters
export function buildWhereClause(
  filters: FilterParams,
  fieldMapping: Record<string, string>,
  startParamIndex: number = 1,
): { clause: string; params: any[]; nextParamIndex: number } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;

    const field = fieldMapping[key] || key;

    if (Array.isArray(value)) {
      const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(", ");
      conditions.push(`${field} IN (${placeholders})`);
      params.push(...value);
      paramIndex += value.length;
    } else {
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
export function buildSearchClause(
  search: string | undefined,
  fields: string[],
  paramIndex: number,
): { clause: string; params: any[]; nextParamIndex: number } {
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
export function getQueryParams(
  req: Request,
  allowedSortFields: string[],
  allowedFilters: string[],
  defaultSortField: string = "created_at",
): QueryParams {
  return {
    ...getPaginationParams(req),
    ...getSortParams(req, allowedSortFields, defaultSortField),
    search: getSearchParam(req),
    filters: getFilterParams(req, allowedFilters),
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

export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number,
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
