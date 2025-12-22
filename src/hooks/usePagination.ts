import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/pagination';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  reset: () => void;
  offset: number;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(
    Math.min(Math.max(1, initialPageSize), MAX_PAGE_SIZE)
  );

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage));
  }, []);

  const setPageSize = useCallback((size: number) => {
    const validSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
    setPageSizeState(validSize);
    setPageState(1); // Reset to first page when page size changes
  }, []);

  const nextPage = useCallback(() => {
    setPageState((prev) => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPageState((prev) => Math.max(1, prev - 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setPageState(1);
  }, []);

  const goToLastPage = useCallback((totalPages: number) => {
    setPageState(Math.max(1, totalPages));
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(Math.min(Math.max(1, initialPageSize), MAX_PAGE_SIZE));
  }, [initialPage, initialPageSize]);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    reset,
    offset,
  };
}
