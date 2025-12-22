import { supabase } from "@/integrations/supabase/client";

interface CachedQueryOptions {
  cacheKey: string;
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  ttlOverride?: number;
}

interface CachedQueryResult<T> {
  data: T | null;
  cached: boolean;
  error: string | null;
}

/**
 * Execute a cached query via the edge function
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
 * Pre-defined cached queries for common operations
 */
export const CachedQueries = {
  getIssueStatuses: () => cachedQuery({
    cacheKey: "issue_statuses",
    table: "issue_statuses",
    order: { column: "position", ascending: true },
  }),

  getIssueTypes: () => cachedQuery({
    cacheKey: "issue_types",
    table: "issue_types",
    order: { column: "position", ascending: true },
  }),

  getPriorities: () => cachedQuery({
    cacheKey: "priorities",
    table: "priorities",
    order: { column: "position", ascending: true },
  }),
};
