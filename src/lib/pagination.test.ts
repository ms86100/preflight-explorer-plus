/**
 * @fileoverview Unit tests for pagination utilities.
 * @module lib/pagination.test
 */

import { describe, it, expect } from "vitest";
import {
  getPaginationRange,
  buildPaginatedResult,
  getNextPageParams,
  getPreviousPageParams,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./pagination";

describe("getPaginationRange", () => {
  it("should calculate correct range for page 1", () => {
    const { from, to } = getPaginationRange(1, 20);
    expect(from).toBe(0);
    expect(to).toBe(19);
  });

  it("should calculate correct range for page 2", () => {
    const { from, to } = getPaginationRange(2, 20);
    expect(from).toBe(20);
    expect(to).toBe(39);
  });

  it("should clamp page size to MAX_PAGE_SIZE", () => {
    const { from, to } = getPaginationRange(1, 500);
    expect(to - from + 1).toBe(MAX_PAGE_SIZE);
  });

  it("should handle page size of 0", () => {
    const { from, to } = getPaginationRange(1, 0);
    expect(from).toBe(0);
    expect(to).toBe(0); // Minimum page size of 1
  });

  it("should handle negative page numbers", () => {
    const { from, to } = getPaginationRange(-5, 20);
    expect(from).toBe(0); // Should default to page 1
    expect(to).toBe(19);
  });
});

describe("buildPaginatedResult", () => {
  const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("should build correct pagination metadata", () => {
    const result = buildPaginatedResult(mockData, 100, 2, 20);
    
    expect(result.data).toEqual(mockData);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.pageSize).toBe(20);
    expect(result.pagination.totalCount).toBe(100);
    expect(result.pagination.totalPages).toBe(5);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(true);
  });

  it("should correctly identify first page", () => {
    const result = buildPaginatedResult(mockData, 100, 1, 20);
    
    expect(result.pagination.hasPreviousPage).toBe(false);
    expect(result.pagination.hasNextPage).toBe(true);
  });

  it("should correctly identify last page", () => {
    const result = buildPaginatedResult(mockData, 100, 5, 20);
    
    expect(result.pagination.hasPreviousPage).toBe(true);
    expect(result.pagination.hasNextPage).toBe(false);
  });

  it("should handle single page of results", () => {
    const result = buildPaginatedResult(mockData, 3, 1, 20);
    
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it("should handle empty results", () => {
    const result = buildPaginatedResult([], 0, 1, 20);
    
    expect(result.data).toEqual([]);
    expect(result.pagination.totalCount).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it("should clamp page size to MAX_PAGE_SIZE", () => {
    const result = buildPaginatedResult(mockData, 100, 1, 500);
    
    expect(result.pagination.pageSize).toBe(MAX_PAGE_SIZE);
  });
});

describe("getNextPageParams", () => {
  it("should return next page params when next page exists", () => {
    const current = buildPaginatedResult([{ id: 1 }], 100, 1, 20);
    const next = getNextPageParams(current);
    
    expect(next).not.toBeNull();
    expect(next?.page).toBe(2);
    expect(next?.pageSize).toBe(20);
  });

  it("should return null when on last page", () => {
    const current = buildPaginatedResult([{ id: 1 }], 20, 1, 20);
    const next = getNextPageParams(current);
    
    expect(next).toBeNull();
  });
});

describe("getPreviousPageParams", () => {
  it("should return previous page params when previous page exists", () => {
    const current = buildPaginatedResult([{ id: 1 }], 100, 3, 20);
    const previous = getPreviousPageParams(current);
    
    expect(previous).not.toBeNull();
    expect(previous?.page).toBe(2);
    expect(previous?.pageSize).toBe(20);
  });

  it("should return null when on first page", () => {
    const current = buildPaginatedResult([{ id: 1 }], 100, 1, 20);
    const previous = getPreviousPageParams(current);
    
    expect(previous).toBeNull();
  });
});

describe("Constants", () => {
  it("should have reasonable default page size", () => {
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });

  it("should have max page size greater than default", () => {
    expect(MAX_PAGE_SIZE).toBeGreaterThanOrEqual(DEFAULT_PAGE_SIZE);
  });
});
