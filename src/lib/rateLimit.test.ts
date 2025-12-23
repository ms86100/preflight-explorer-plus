/**
 * @fileoverview Unit tests for rate limiting utilities.
 * @module lib/rateLimit.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
} from "./rateLimit";

// Mock the Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit", () => {
    it("should return allowed result when under limit", async () => {
      const mockResult = {
        allowed: true,
        remaining: 50,
        resetAt: "2024-01-01T12:01:00.000Z",
        limit: 60,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await checkRateLimit("api/write");

      expect(supabase.functions.invoke).toHaveBeenCalledWith("rate-limit", {
        body: { endpoint: "api/write", identifier: undefined },
      });
      expect(result).toEqual(mockResult);
    });

    it("should return not allowed when limit exceeded", async () => {
      const mockResult = {
        allowed: false,
        remaining: 0,
        resetAt: "2024-01-01T12:01:00.000Z",
        limit: 60,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await checkRateLimit("api/write");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should pass custom identifier", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: true, remaining: 10, resetAt: "", limit: 10 },
        error: null,
      });

      await checkRateLimit("auth/login", "user-123");

      expect(supabase.functions.invoke).toHaveBeenCalledWith("rate-limit", {
        body: { endpoint: "auth/login", identifier: "user-123" },
      });
    });

    it("should fail open on edge function error", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: "Function error" },
      });

      const result = await checkRateLimit("api/read");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100);
      expect(result.limit).toBe(100);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should fail open on unexpected exception", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error("Network error")
      );

      const result = await checkRateLimit("api/read");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle all endpoint types", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: true, remaining: 10, resetAt: "", limit: 10 },
        error: null,
      });

      const endpoints = [
        "auth/login",
        "auth/signup",
        "auth/reset",
        "api/read",
        "api/list",
        "api/write",
        "api/update",
        "api/delete",
        "api/upload",
        "api/search",
        "default",
      ] as const;

      for (const endpoint of endpoints) {
        await checkRateLimit(endpoint);
        expect(supabase.functions.invoke).toHaveBeenLastCalledWith("rate-limit", {
          body: { endpoint, identifier: undefined },
        });
      }
    });
  });

  describe("withRateLimit", () => {
    it("should execute function when under limit", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: true, remaining: 50, resetAt: "", limit: 60 },
        error: null,
      });

      const mockFn = vi.fn().mockResolvedValue("success");
      const wrapped = withRateLimit("api/write", mockFn);

      const result = await wrapped("arg1", "arg2");

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
      expect(result).toBe("success");
    });

    it("should throw error when limit exceeded", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          allowed: false,
          remaining: 0,
          resetAt: "2024-01-01T12:01:00.000Z",
          limit: 60,
        },
        error: null,
      });

      const mockFn = vi.fn().mockResolvedValue("success");
      const wrapped = withRateLimit("api/write", mockFn);

      await expect(wrapped()).rejects.toThrow("Rate limit exceeded");
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("should call onRateLimited callback when exceeded", async () => {
      const resetAt = "2024-01-01T12:01:00.000Z";
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: false, remaining: 0, resetAt, limit: 60 },
        error: null,
      });

      const mockFn = vi.fn().mockResolvedValue("success");
      const onRateLimited = vi.fn();
      const wrapped = withRateLimit("api/write", mockFn, onRateLimited);

      await expect(wrapped()).rejects.toThrow();
      expect(onRateLimited).toHaveBeenCalledWith({
        allowed: false,
        remaining: 0,
        resetAt,
        limit: 60,
      });
    });

    it("should preserve function return type", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: true, remaining: 50, resetAt: "", limit: 60 },
        error: null,
      });

      interface User {
        id: string;
        name: string;
      }

      const mockFn = vi.fn().mockResolvedValue({ id: "1", name: "Test" } as User);
      const wrapped = withRateLimit("api/read", mockFn);

      const result = await wrapped();

      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should pass through function errors", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { allowed: true, remaining: 50, resetAt: "", limit: 60 },
        error: null,
      });

      const mockFn = vi.fn().mockRejectedValue(new Error("Function error"));
      const wrapped = withRateLimit("api/write", mockFn);

      await expect(wrapped()).rejects.toThrow("Function error");
    });
  });

  describe("RATE_LIMIT_CONFIGS", () => {
    it("should have configuration for all endpoint types", () => {
      const expectedEndpoints = [
        "auth/login",
        "auth/signup",
        "auth/reset",
        "api/read",
        "api/list",
        "api/write",
        "api/update",
        "api/delete",
        "api/upload",
        "api/search",
        "default",
      ];

      expectedEndpoints.forEach((endpoint) => {
        expect(RATE_LIMIT_CONFIGS[endpoint as keyof typeof RATE_LIMIT_CONFIGS]).toBeDefined();
      });
    });

    it("should have valid configuration values", () => {
      Object.entries(RATE_LIMIT_CONFIGS).forEach(([, config]) => {
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(config.windowMinutes).toBeGreaterThan(0);
        expect(typeof config.description).toBe("string");
      });
    });

    it("should have stricter limits for auth endpoints", () => {
      expect(RATE_LIMIT_CONFIGS["auth/login"].maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS["api/read"].maxRequests
      );
      expect(RATE_LIMIT_CONFIGS["auth/signup"].maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS["api/read"].maxRequests
      );
      expect(RATE_LIMIT_CONFIGS["auth/reset"].maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS["auth/login"].maxRequests
      );
    });

    it("should have stricter limits for destructive operations", () => {
      expect(RATE_LIMIT_CONFIGS["api/delete"].maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS["api/write"].maxRequests
      );
      expect(RATE_LIMIT_CONFIGS["api/write"].maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS["api/read"].maxRequests
      );
    });
  });
});
