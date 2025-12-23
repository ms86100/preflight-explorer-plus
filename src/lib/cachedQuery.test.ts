/**
 * @fileoverview Unit tests for cached query utilities.
 * @module lib/cachedQuery.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { cachedQuery, CachedQueries } from "./cachedQuery";

// Mock the Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("cachedQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cachedQuery function", () => {
    it("should return cached data when available", async () => {
      const mockData = [
        { id: "1", name: "Open" },
        { id: "2", name: "Closed" },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: mockData, cached: true },
        error: null,
      });

      const result = await cachedQuery({
        cacheKey: "test_cache",
        table: "issue_statuses",
      });

      expect(result.data).toEqual(mockData);
      expect(result.cached).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should return fresh data when cache miss", async () => {
      const mockData = [{ id: "1", name: "Priority 1" }];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: mockData, cached: false },
        error: null,
      });

      const result = await cachedQuery({
        cacheKey: "priorities",
        table: "priorities",
      });

      expect(result.data).toEqual(mockData);
      expect(result.cached).toBe(false);
      expect(result.error).toBeNull();
    });

    it("should pass all query options to edge function", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: [], cached: false },
        error: null,
      });

      await cachedQuery({
        cacheKey: "filtered_data",
        table: "issues",
        select: "id, summary, status_id",
        filters: { project_id: "proj-123", assignee_id: "user-456" },
        order: { column: "created_at", ascending: false },
        limit: 50,
        ttlOverride: 300,
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith("cached-query", {
        body: {
          cacheKey: "filtered_data",
          table: "issues",
          select: "id, summary, status_id",
          filters: { project_id: "proj-123", assignee_id: "user-456" },
          order: { column: "created_at", ascending: false },
          limit: 50,
          ttlOverride: 300,
        },
      });
    });

    it("should handle edge function error", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: "Function timeout" },
      });

      const result = await cachedQuery({
        cacheKey: "test",
        table: "test_table",
      });

      expect(result.data).toBeNull();
      expect(result.cached).toBe(false);
      expect(result.error).toBe("Function timeout");
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should handle unexpected exceptions", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockRejectedValue(
        new Error("Network error")
      );

      const result = await cachedQuery({
        cacheKey: "test",
        table: "test_table",
      });

      expect(result.data).toBeNull();
      expect(result.cached).toBe(false);
      expect(result.error).toBe("Error: Network error");
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should work with typed generics", async () => {
      interface IssueStatus {
        id: string;
        name: string;
        category: string;
      }

      const mockData: IssueStatus[] = [
        { id: "1", name: "Open", category: "TODO" },
        { id: "2", name: "In Progress", category: "IN_PROGRESS" },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: mockData, cached: true },
        error: null,
      });

      const result = await cachedQuery<IssueStatus[]>({
        cacheKey: "statuses",
        table: "issue_statuses",
      });

      expect(result.data).toEqual(mockData);
      // TypeScript should infer result.data as IssueStatus[] | null
      if (result.data) {
        expect(result.data[0].category).toBe("TODO");
      }
    });
  });

  describe("CachedQueries pre-defined queries", () => {
    it("should fetch issue statuses with correct parameters", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: [], cached: true },
        error: null,
      });

      await CachedQueries.getIssueStatuses();

      expect(supabase.functions.invoke).toHaveBeenCalledWith("cached-query", {
        body: {
          cacheKey: "issue_statuses",
          table: "issue_statuses",
          order: { column: "position", ascending: true },
        },
      });
    });

    it("should fetch issue types with correct parameters", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: [], cached: true },
        error: null,
      });

      await CachedQueries.getIssueTypes();

      expect(supabase.functions.invoke).toHaveBeenCalledWith("cached-query", {
        body: {
          cacheKey: "issue_types",
          table: "issue_types",
          order: { column: "position", ascending: true },
        },
      });
    });

    it("should fetch priorities with correct parameters", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: [], cached: true },
        error: null,
      });

      await CachedQueries.getPriorities();

      expect(supabase.functions.invoke).toHaveBeenCalledWith("cached-query", {
        body: {
          cacheKey: "priorities",
          table: "priorities",
          order: { column: "position", ascending: true },
        },
      });
    });

    it("should return proper result structure from pre-defined queries", async () => {
      const mockStatuses = [
        { id: "1", name: "Open", position: 1 },
        { id: "2", name: "Closed", position: 2 },
      ];

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { data: mockStatuses, cached: true },
        error: null,
      });

      const result = await CachedQueries.getIssueStatuses();

      expect(result).toEqual({
        data: mockStatuses,
        cached: true,
        error: null,
      });
    });
  });
});
