import { useState, useCallback } from "react";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rateLimit";
import { toast } from "sonner";

type EndpointType = keyof typeof RATE_LIMIT_CONFIGS;

interface UseRateLimitOptions {
  showToast?: boolean;
  onRateLimited?: () => void;
}

interface RateLimitState {
  isChecking: boolean;
  isLimited: boolean;
  remaining: number;
  resetAt: string | null;
}

/**
 * Hook for managing rate-limited operations
 */
export function useRateLimit(
  endpoint: EndpointType,
  options: UseRateLimitOptions = {}
) {
  const { showToast = true, onRateLimited } = options;

  const [state, setState] = useState<RateLimitState>({
    isChecking: false,
    isLimited: false,
    remaining: RATE_LIMIT_CONFIGS[endpoint]?.maxRequests || 100,
    resetAt: null,
  });

  const checkLimit = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      const result = await checkRateLimit(endpoint);

      setState({
        isChecking: false,
        isLimited: !result.allowed,
        remaining: result.remaining,
        resetAt: result.resetAt,
      });

      if (!result.allowed) {
        if (showToast) {
          const resetTime = new Date(result.resetAt).toLocaleTimeString();
          toast.error(`Rate limit exceeded. Try again after ${resetTime}`);
        }
        onRateLimited?.();
        return false;
      }

      return true;
    } catch (error) {
      console.error("[useRateLimit] Error:", error);
      setState((prev) => ({ ...prev, isChecking: false }));
      // On error, allow the operation
      return true;
    }
  }, [endpoint, showToast, onRateLimited]);

  /**
   * Execute a function only if rate limit allows
   */
  const executeIfAllowed = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      const allowed = await checkLimit();
      if (!allowed) {
        return null;
      }
      return fn();
    },
    [checkLimit]
  );

  return {
    ...state,
    checkLimit,
    executeIfAllowed,
    config: RATE_LIMIT_CONFIGS[endpoint],
  };
}
