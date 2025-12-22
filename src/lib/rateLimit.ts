import { supabase } from "@/integrations/supabase/client";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

type EndpointType = 
  | "auth/login" 
  | "auth/signup" 
  | "auth/reset"
  | "api/read" 
  | "api/list" 
  | "api/write" 
  | "api/update" 
  | "api/delete"
  | "api/upload"
  | "api/search"
  | "default";

/**
 * Check rate limit for a specific endpoint
 * @param endpoint - The endpoint type to check
 * @param identifier - Optional custom identifier (defaults to user ID or IP)
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  endpoint: EndpointType,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke("rate-limit", {
      body: { endpoint, identifier },
    });

    if (error) {
      console.error("[Rate Limit] Error checking rate limit:", error);
      // On error, allow the request
      return {
        allowed: true,
        remaining: 100,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error("[Rate Limit] Unexpected error:", err);
    // On error, allow the request
    return {
      allowed: true,
      remaining: 100,
      resetAt: new Date(Date.now() + 60000).toISOString(),
      limit: 100,
    };
  }
}

/**
 * Higher-order function that wraps an async function with rate limiting
 * @param endpoint - The endpoint type for rate limiting
 * @param fn - The async function to wrap
 * @param onRateLimited - Optional callback when rate limited
 */
export function withRateLimit<T extends unknown[], R>(
  endpoint: EndpointType,
  fn: (...args: T) => Promise<R>,
  onRateLimited?: (result: RateLimitResult) => void
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const result = await checkRateLimit(endpoint);

    if (!result.allowed) {
      if (onRateLimited) {
        onRateLimited(result);
      }
      throw new Error(
        `Rate limit exceeded. Try again after ${new Date(result.resetAt).toLocaleTimeString()}`
      );
    }

    return fn(...args);
  };
}

/**
 * Rate limit configurations for reference
 */
export const RATE_LIMIT_CONFIGS = {
  "auth/login": { maxRequests: 10, windowMinutes: 1, description: "Login attempts" },
  "auth/signup": { maxRequests: 5, windowMinutes: 1, description: "Signup attempts" },
  "auth/reset": { maxRequests: 3, windowMinutes: 1, description: "Password reset" },
  "api/read": { maxRequests: 200, windowMinutes: 1, description: "Read operations" },
  "api/list": { maxRequests: 100, windowMinutes: 1, description: "List operations" },
  "api/write": { maxRequests: 60, windowMinutes: 1, description: "Write operations" },
  "api/update": { maxRequests: 60, windowMinutes: 1, description: "Update operations" },
  "api/delete": { maxRequests: 30, windowMinutes: 1, description: "Delete operations" },
  "api/upload": { maxRequests: 20, windowMinutes: 1, description: "File uploads" },
  "api/search": { maxRequests: 50, windowMinutes: 1, description: "Search queries" },
  "default": { maxRequests: 100, windowMinutes: 1, description: "Default limit" },
} as const;
