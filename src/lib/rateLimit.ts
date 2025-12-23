/**
 * @fileoverview Rate limiting utilities for API request throttling.
 * @module lib/rateLimit
 * 
 * @description
 * Provides rate limiting functionality to prevent abuse and ensure fair usage.
 * Uses the database-backed rate limiting via edge functions for distributed rate limiting.
 * 
 * @example
 * ```typescript
 * import { checkRateLimit, withRateLimit } from '@/lib/rateLimit';
 * 
 * // Check rate limit before making a request
 * const { allowed, remaining } = await checkRateLimit('api/write');
 * 
 * // Or wrap a function with rate limiting
 * const limitedFn = withRateLimit('api/write', myFunction);
 * ```
 */

import { supabase } from "@/integrations/supabase/client";
import { RATE_LIMITS, FALLBACK_RATE_LIMIT } from "./constants";

/**
 * Result of a rate limit check.
 * 
 * @interface RateLimitResult
 * @property {boolean} allowed - Whether the request is allowed
 * @property {number} remaining - Number of requests remaining in the current window
 * @property {string} resetAt - ISO timestamp when the rate limit resets
 * @property {number} limit - Maximum requests allowed in the window
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

/**
 * Supported endpoint types for rate limiting.
 * Each type has different rate limits configured on the server.
 * 
 * @see RATE_LIMIT_CONFIGS for limit values
 */
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
 * Checks the rate limit for a specific endpoint.
 * 
 * Makes a request to the rate-limit edge function to check if the
 * current user/IP has exceeded their rate limit for the given endpoint.
 * 
 * @param endpoint - The endpoint type to check rate limit for
 * @param identifier - Optional custom identifier (defaults to user ID or IP on server)
 * @returns Rate limit result with allowed status and remaining requests
 * 
 * @example
 * ```typescript
 * const result = await checkRateLimit('api/write');
 * 
 * if (!result.allowed) {
 *   console.log(`Rate limited. Try again at ${result.resetAt}`);
 *   return;
 * }
 * 
 * console.log(`${result.remaining} requests remaining`);
 * ```
 * 
 * @remarks
 * On error, the function fails open (allows the request) to prevent
 * service disruption due to rate limiting infrastructure issues.
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
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: FALLBACK_RATE_LIMIT.REMAINING,
        resetAt: new Date(Date.now() + FALLBACK_RATE_LIMIT.WINDOW_MS).toISOString(),
        limit: FALLBACK_RATE_LIMIT.LIMIT,
      };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error("[Rate Limit] Unexpected error:", err);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: FALLBACK_RATE_LIMIT.REMAINING,
      resetAt: new Date(Date.now() + FALLBACK_RATE_LIMIT.WINDOW_MS).toISOString(),
      limit: FALLBACK_RATE_LIMIT.LIMIT,
    };
  }
}

/**
 * Higher-order function that wraps an async function with rate limiting.
 * 
 * The wrapped function will check rate limits before executing. If the
 * rate limit is exceeded, it throws an error instead of executing.
 * 
 * @template T - Tuple type for function arguments
 * @template R - Return type of the function
 * @param endpoint - The endpoint type for rate limiting
 * @param fn - The async function to wrap
 * @param onRateLimited - Optional callback when rate limited (before throwing)
 * @returns A new function that checks rate limits before executing
 * 
 * @throws {Error} When rate limit is exceeded
 * 
 * @example
 * ```typescript
 * const createIssue = async (data: IssueData) => {
 *   return await api.createIssue(data);
 * };
 * 
 * const rateLimitedCreate = withRateLimit(
 *   'api/write',
 *   createIssue,
 *   (result) => {
 *     toast.error(`Too many requests. Try again at ${result.resetAt}`);
 *   }
 * );
 * 
 * // Now all calls go through rate limiting
 * await rateLimitedCreate({ summary: 'New Issue' });
 * ```
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
 * Rate limit configurations for reference.
 * These values are enforced on the server side but provided here for documentation.
 * 
 * @remarks
 * To change rate limits, update the rate-limit edge function.
 * 
 * @example
 * ```typescript
 * // Check the limit for a specific endpoint
 * const loginLimit = RATE_LIMIT_CONFIGS['auth/login'];
 * console.log(`Login allows ${loginLimit.maxRequests} attempts per ${loginLimit.windowMinutes} minute(s)`);
 * ```
 */
export const RATE_LIMIT_CONFIGS = RATE_LIMITS;

/**
 * Type for endpoint names.
 */
export type { EndpointType, RateLimitResult };
