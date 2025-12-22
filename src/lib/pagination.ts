// Pagination utilities for scalable data fetching

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string; // For cursor-based pagination
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
  };
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const validPage = Math.max(1, page);
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;
  return { from, to };
}

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
