/**
 * @fileoverview Unit tests for board and sprint services.
 * @module features/boards/services/boardService.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { boardService, sprintService } from "./boardService";

// Mock helper functions moved to module scope to reduce nesting complexity (S2004)
function createSelectEqOrderMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createSelectEqSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createSelectEqEqMaybeSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createInsertSelectSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createUpdateEqSelectSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(resolvedValue),
        }),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createDeleteEqMock(resolvedValue: { error: unknown }) {
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createDeleteEqEqMock(resolvedValue: { error: unknown }) {
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createSelectEqMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(resolvedValue),
    }),
  } as ReturnType<typeof supabase.from>;
}

function createInsertMock(resolvedValue: { error: unknown }) {
  return {
    insert: vi.fn().mockResolvedValue(resolvedValue),
  } as ReturnType<typeof supabase.from>;
}

// Mock factory function for default mock - prevents nested functions inside vi.mock (S2004)
function createDefaultFromMock() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

// Mock Supabase client - flattened structure (S2004)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createDefaultFromMock()),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("boardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByProject", () => {
    it("should fetch boards for a project", async () => {
      const mockBoards = [
        { id: "1", name: "Board 1", project_id: "proj-1" },
        { id: "2", name: "Board 2", project_id: "proj-1" },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: mockBoards, error: null })
      );

      const result = await boardService.getByProject("proj-1");

      expect(supabase.from).toHaveBeenCalledWith("boards");
      expect(result).toEqual(mockBoards);
    });

    it("should throw on error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: null, error: { message: "Error" } })
      );

      await expect(boardService.getByProject("proj-1")).rejects.toEqual({ message: "Error" });
    });
  });

  describe("getById", () => {
    it("should fetch a single board", async () => {
      const mockBoard = { id: "1", name: "Board 1", project_id: "proj-1" };

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqSingleMock({ data: mockBoard, error: null })
      );

      const result = await boardService.getById("1");

      expect(result).toEqual(mockBoard);
    });
  });

  describe("getColumns", () => {
    it("should fetch columns with status mappings", async () => {
      const mockColumns = [
        { id: "col-1", name: "To Do", position: 0, column_statuses: [] },
        { id: "col-2", name: "Done", position: 1, column_statuses: [] },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: mockColumns, error: null })
      );

      const result = await boardService.getColumns("board-1");

      expect(result).toEqual(mockColumns);
    });
  });
});

describe("sprintService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByBoard", () => {
    it("should fetch sprints for a board", async () => {
      const mockSprints = [
        { id: "1", name: "Sprint 1", board_id: "board-1", state: "active" },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: mockSprints, error: null })
      );

      const result = await sprintService.getByBoard("board-1");

      expect(supabase.from).toHaveBeenCalledWith("sprints");
      expect(result).toEqual(mockSprints);
    });
  });

  describe("getActive", () => {
    it("should fetch active sprint", async () => {
      const mockSprint = { id: "1", name: "Sprint 1", state: "active" };

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqEqMaybeSingleMock({ data: mockSprint, error: null })
      );

      const result = await sprintService.getActive("board-1");

      expect(result).toEqual(mockSprint);
    });

    it("should return null when no active sprint", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqEqMaybeSingleMock({ data: null, error: null })
      );

      const result = await sprintService.getActive("board-1");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new sprint", async () => {
      const mockSprint = { id: "new-sprint", name: "Sprint 1", board_id: "board-1" };

      vi.mocked(supabase.from).mockReturnValue(
        createInsertSelectSingleMock({ data: mockSprint, error: null })
      );

      const result = await sprintService.create({ board_id: "board-1", name: "Sprint 1" });

      expect(supabase.from).toHaveBeenCalledWith("sprints");
      expect(result).toEqual(mockSprint);
    });
  });

  describe("start", () => {
    it("should start a sprint with dates", async () => {
      const mockSprint = { id: "1", state: "active", start_date: "2024-01-01", end_date: "2024-01-14" };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockSprint, error: null })
      );

      const result = await sprintService.start("1", "2024-01-01", "2024-01-14");

      expect(result.state).toBe("active");
    });
  });

  describe("complete", () => {
    it("should complete a sprint", async () => {
      const mockSprint = { id: "1", state: "closed", completed_date: "2024-01-14" };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockSprint, error: null })
      );

      const result = await sprintService.complete("1");

      expect(result.state).toBe("closed");
    });
  });

  describe("getIssues", () => {
    it("should return empty array for empty sprintId", async () => {
      const result = await sprintService.getIssues("");

      expect(result).toEqual([]);
    });

    it("should fetch issues with related data", async () => {
      const mockIssues = [
        { issue: { id: "issue-1", issue_key: "PROJ-1", summary: "Test", assignee_id: null } },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqMock({ data: mockIssues, error: null })
      );

      const result = await sprintService.getIssues("sprint-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("assignee", null);
    });
  });

  describe("addIssue", () => {
    it("should add issue to sprint", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createInsertMock({ error: null })
      );

      await expect(sprintService.addIssue("sprint-1", "issue-1")).resolves.not.toThrow();
    });
  });

  describe("removeIssue", () => {
    it("should remove issue from sprint", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createDeleteEqEqMock({ error: null })
      );

      await expect(sprintService.removeIssue("sprint-1", "issue-1")).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete sprint and issue associations", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createDeleteEqMock({ error: null })
      );

      await expect(sprintService.delete("sprint-1")).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith("sprint_issues");
      expect(supabase.from).toHaveBeenCalledWith("sprints");
    });
  });
});
