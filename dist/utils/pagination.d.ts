import { Request } from "express";
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
export declare function getPaginationParams(req: Request): PaginationParams;
export declare function getSortParams(req: Request, allowedFields: string[], defaultField?: string): SortParams;
export declare function getSearchParam(req: Request): string | undefined;
export declare function getFilterParams(req: Request, allowedFilters: string[]): FilterParams;
export declare function buildWhereClause(filters: FilterParams, fieldMapping: Record<string, string>, startParamIndex?: number): {
    clause: string;
    params: any[];
    nextParamIndex: number;
};
export declare function buildSearchClause(search: string | undefined, fields: string[], paramIndex: number): {
    clause: string;
    params: any[];
    nextParamIndex: number;
};
export declare function getQueryParams(req: Request, allowedSortFields: string[], allowedFilters: string[], defaultSortField?: string): QueryParams;
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export declare function calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta;
//# sourceMappingURL=pagination.d.ts.map