import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Cache TTL configurations (in seconds)
const CACHE_TTL: Record<string, number> = {
  "issue_statuses": 300,      // 5 minutes - rarely changes
  "issue_types": 300,         // 5 minutes - rarely changes
  "priorities": 300,          // 5 minutes - rarely changes
  "resolutions": 300,         // 5 minutes - rarely changes
  "workflows": 120,           // 2 minutes
  "projects_list": 60,        // 1 minute - can change more often
  "board_columns": 60,        // 1 minute
  "sprint_active": 30,        // 30 seconds - more dynamic
  "user_profile": 120,        // 2 minutes
  "default": 30,              // 30 seconds default
};

interface CachedQueryRequest {
  cacheKey: string;
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  ttlOverride?: number;
}

function getCacheKey(req: CachedQueryRequest): string {
  return `${req.cacheKey}:${JSON.stringify(req.filters || {})}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  
  // Cleanup old entries if cache gets too large
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) {
        cache.delete(k);
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: CachedQueryRequest = await req.json();
    const { cacheKey, table, select = "*", filters, order, limit, ttlOverride } = body;

    if (!cacheKey || !table) {
      return new Response(
        JSON.stringify({ error: "cacheKey and table are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullCacheKey = getCacheKey(body);
    
    // Check cache first
    const cached = getFromCache(fullCacheKey);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${fullCacheKey}`);
      return new Response(
        JSON.stringify({ data: cached, cached: true }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Cache": "HIT",
          } 
        }
      );
    }

    console.log(`[Cache] MISS: ${fullCacheKey}`);

    // Build and execute query
    let query = supabaseAdmin.from(table).select(select);

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === null) {
          query = query.is(key, null);
        } else if (typeof value === "object" && value !== null) {
          const filterObj = value as Record<string, unknown>;
          if ("eq" in filterObj) query = query.eq(key, filterObj.eq);
          if ("neq" in filterObj) query = query.neq(key, filterObj.neq);
          if ("gt" in filterObj) query = query.gt(key, filterObj.gt);
          if ("gte" in filterObj) query = query.gte(key, filterObj.gte);
          if ("lt" in filterObj) query = query.lt(key, filterObj.lt);
          if ("lte" in filterObj) query = query.lte(key, filterObj.lte);
          if ("in" in filterObj) query = query.in(key, filterObj.in as unknown[]);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    // Apply order
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? true });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[Cache] Query error:`, error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the result
    const ttl = ttlOverride ?? CACHE_TTL[cacheKey] ?? CACHE_TTL.default;
    setCache(fullCacheKey, data, ttl);

    return new Response(
      JSON.stringify({ data, cached: false }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Cache": "MISS",
          "X-Cache-TTL": ttl.toString(),
        } 
      }
    );

  } catch (error) {
    console.error("[Cache] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
