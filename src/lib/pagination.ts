/**
 * @fileoverview Pagination utilities for scalable data fetching.
 * @module lib/pagination
 * 
 * @description
 * Provides pagination utilities including offset-based and cursor-based pagination.
 * Used by service functions to implement consistent pagination across the application.
 * 
 * @example
 * ```typescript
 * import { getPaginationRange, buildPaginatedResult, DEFAULT_PAGE_SIZE } from '@/lib/pagination';
 * 
 * const { from, to } = getPaginationRange(1, 20);
 * const result = buildPaginatedResult(data, totalCount, 1, 20);
 * ```
 */

/**
 * Parameters for paginated queries.
 * 
 * @interface PaginationParams
 * @property {number} [page] - Current page number (1-indexed)
 * @property {number} [pageSize] - Number of items per page
 * @property {string} [cursor] - Cursor for cursor-based pagination
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string; // For cursor-based pagination
}

/**
 * Result structure for paginated queries.
 * 
 * @interface PaginatedResult
 * @template T - Type of items in the result
 * @property {T[]} data - Array of items for the current page
 * @property {Object} pagination - Pagination metadata
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items across all pages */
    totalCount: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more pages after this one */
    hasNextPage: boolean;
    /** Whether there are pages before this one */
    hasPreviousPage: boolean;
    /** Cursor for the next page (for cursor-based pagination) */
    nextCursor?: string;
  };
}

/**
 * Default number of items per page.
 * Used when no page size is specified.
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum allowed page size.
 * Prevents excessive data fetching that could impact performance.
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Calculates the range for a Supabase query based on page and page size.
 * Validates inputs to ensure they're within acceptable bounds.
 * 
 * @param page - Page number (1-indexed), defaults to 1 if invalid
 * @param pageSize - Items per page, clamped to MAX_PAGE_SIZE
 * @returns Object with from and to values for Supabase range query
 * 
 * @example
 * ```typescript
 * const { from, to } = getPaginationRange(2, 20);
 * // from = 20, to = 39 (page 2, 20 items starting at index 20)
 * 
 * const query = supabase.from('issues').select('*').range(from, to);
 * ```
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const validPage = Math.max(1, page);
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;
  return { from, to };
}

/**
 * Builds a standardized paginated result object.
 * Calculates pagination metadata from the provided data.
 * 
 * @param data - Array of items for the current page
 * @param totalCount - Total count of all items (from count query)
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns Paginated result with data and metadata
 * 
 * @example
 * ```typescript
 * const issues = await fetchIssues();
 * const result = buildPaginatedResult(issues, 150, 2, 20);
 * 
 * console.log(result.pagination);
 * // { page: 2, pageSize: 20, totalCount: 150, totalPages: 8, hasNextPage: true, hasPreviousPage: true }
 * ```
 */
export function buildPaginatedResult<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const validPage = Math.max(1, page);
  const totalPages = Math.ceil(totalCount / validPageSize);

  return {
    data,
    pagination: {
      page: validPage,
      pageSize: validPageSize,
      totalCount,
      totalPages,
      hasNextPage: validPage < totalPages,
      hasPreviousPage: validPage > 1,
    },
  };
}

/**
 * Creates pagination parameters for the next page.
 * 
 * @param current - Current pagination result
 * @returns Pagination params for next page, or null if no next page
 */
export function getNextPageParams<T>(current: PaginatedResult<T>): PaginationParams | null {
  if (!current.pagination.hasNextPage) {
    return null;
  }

  return {
    page: current.pagination.page + 1,
    pageSize: current.pagination.pageSize,
  };
}

/**
 * Creates pagination parameters for the previous page.
 * 
 * @param current - Current pagination result
 * @returns Pagination params for previous page, or null if no previous page
 */
export function getPreviousPageParams<T>(current: PaginatedResult<T>): PaginationParams | null {
  if (!current.pagination.hasPreviousPage) {
    return null;
  }

  return {
    page: current.pagination.page - 1,
    pageSize: current.pagination.pageSize,
  };
}
