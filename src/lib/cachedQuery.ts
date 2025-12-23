/**
 * @fileoverview Cached query utilities for optimized data fetching.
 * @module lib/cachedQuery
 * 
 * @description
 * Provides utilities for executing cached database queries through the
 * cached-query edge function. Caching reduces database load and improves
 * response times for frequently accessed, slowly-changing data.
 * 
 * @example
 * ```typescript
 * import { cachedQuery, CachedQueries } from '@/lib/cachedQuery';
 * 
 * // Using pre-defined cached queries
 * const { data, cached } = await CachedQueries.getIssueStatuses();
 * console.log(`Data ${cached ? 'from cache' : 'from database'}`);
 * 
 * // Custom cached query
 * const result = await cachedQuery({
 *   cacheKey: 'project_members',
 *   table: 'project_members',
 *   filters: { project_id: 'proj-123' },
 * });
 * ```
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Options for configuring a cached query.
 * 
 * @interface CachedQueryOptions
 * @property {string} cacheKey - Unique key for caching (should be consistent for same query)
 * @property {string} table - Database table name to query
 * @property {string} [select] - Columns to select (defaults to '*')
 * @property {Record<string, unknown>} [filters] - Filter conditions as key-value pairs
 * @property {Object} [order] - Ordering configuration
 * @property {number} [limit] - Maximum number of rows to return
 * @property {number} [ttlOverride] - Custom TTL in seconds (overrides default)
 */
interface CachedQueryOptions {
  /** Unique cache key for this query */
  cacheKey: string;
  /** Database table to query */
  table: string;
  /** Columns to select (defaults to '*') */
  select?: string;
  /** Filter conditions as key-value pairs */
  filters?: Record<string, unknown>;
  /** Ordering configuration */
  order?: { 
    /** Column name to order by */
    column: string; 
    /** Sort direction (true = ASC, false = DESC) */
    ascending?: boolean;
  };
  /** Maximum rows to return */
  limit?: number;
  /** Custom cache TTL in seconds */
  ttlOverride?: number;
}

/**
 * Result from a cached query operation.
 * 
 * @interface CachedQueryResult
 * @template T - Type of the returned data
 * @property {T | null} data - Query result data or null if error
 * @property {boolean} cached - Whether the result came from cache
 * @property {string | null} error - Error message if query failed
 */
interface CachedQueryResult<T> {
  /** Query result data */
  data: T | null;
  /** True if result was served from cache */
  cached: boolean;
  /** Error message if query failed */
  error: string | null;
}

/**
 * Executes a cached query via the cached-query edge function.
 * 
 * This function sends a query specification to the edge function which
 * handles caching logic. If a valid cached result exists, it's returned
 * immediately. Otherwise, the query is executed and the result is cached.
 * 
 * @template T - Type of the expected result data
 * @param options - Query configuration options
 * @returns Promise resolving to cached query result
 * 
 * @example
 * ```typescript
 * // Fetch with caching
 * const result = await cachedQuery<Priority[]>({
 *   cacheKey: 'all_priorities',
 *   table: 'priorities',
 *   order: { column: 'position', ascending: true },
 * });
 * 
 * if (result.error) {
 *   console.error('Query failed:', result.error);
 * } else {
 *   console.log(`Got ${result.data?.length} priorities (cached: ${result.cached})`);
 * }
 * ```
 * 
 * @remarks
 * - Cache keys should be consistent for the same query parameters
 * - The edge function handles cache invalidation based on TTL
 * - On error, the function returns a result with error set instead of throwing
 */
export async function cachedQuery<T = unknown>(
  options: CachedQueryOptions
): Promise<CachedQueryResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("cached-query", {
      body: options,
    });

    if (error) {
      console.warn("[Cache] Edge function error:", error);
      return { data: null, cached: false, error: error.message };
    }

    return {
      data: data.data as T,
      cached: data.cached,
      error: null,
    };
  } catch (err) {
    console.warn("[Cache] Error:", err);
    return { data: null, cached: false, error: String(err) };
  }
}

/**
 * Pre-defined cached queries for commonly accessed reference data.
 * 
 * These functions provide convenient access to frequently used lookup
 * tables that rarely change. Results are cached to improve performance.
 * 
 * @example
 * ```typescript
 * // Get all issue statuses (cached)
 * const { data: statuses } = await CachedQueries.getIssueStatuses();
 * 
 * // Get all issue types (cached)
 * const { data: types } = await CachedQueries.getIssueTypes();
 * 
 * // Get all priorities (cached)
 * const { data: priorities } = await CachedQueries.getPriorities();
 * ```
 */
export const CachedQueries = {
  /**
   * Fetches all issue statuses ordered by position.
   * 
   * @returns Cached query result with issue status array
   */
  getIssueStatuses: () => cachedQuery({
    cacheKey: "issue_statuses",
    table: "issue_statuses",
    order: { column: "position", ascending: true },
  }),

  /**
   * Fetches all issue types ordered by position.
   * 
   * @returns Cached query result with issue type array
   */
  getIssueTypes: () => cachedQuery({
    cacheKey: "issue_types",
    table: "issue_types",
    order: { column: "position", ascending: true },
  }),

  /**
   * Fetches all priorities ordered by position.
   * 
   * @returns Cached query result with priority array
   */
  getPriorities: () => cachedQuery({
    cacheKey: "priorities",
    table: "priorities",
    order: { column: "position", ascending: true },
  }),
};

// ============================================================================
// Type Exports
// ============================================================================

export type { CachedQueryOptions, CachedQueryResult };
