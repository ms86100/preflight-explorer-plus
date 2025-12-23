/**
 * @fileoverview Unit tests for team service.
 * @module features/teams/services/teamService.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { teamService } from "./teamService";
import {
  createSelectEqOrderMock,
  createSelectEqMock,
  createInsertSelectSingleMock,
  createUpdateEqSelectSingleMock,
  createUpdateEqMock,
  createDeleteEqMock,
  createDefaultFromMock,
} from "@/test/mockFactories";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createDefaultFromMock()),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("teamService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTeamsByProject", () => {
    it("should fetch teams for a project", async () => {
      const mockTeams = [
        { id: "1", name: "Team A", project_id: "proj-1" },
        { id: "2", name: "Team B", project_id: "proj-1" },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: mockTeams, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await teamService.getTeamsByProject("proj-1");

      expect(supabase.from).toHaveBeenCalledWith("project_teams");
      expect(result).toEqual(mockTeams);
    });

    it("should throw on error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: null, error: { message: "Error" } }) as ReturnType<typeof supabase.from>
      );

      await expect(teamService.getTeamsByProject("proj-1")).rejects.toEqual({ message: "Error" });
    });
  });

  describe("getTeamMembers", () => {
    it("should return empty array when no members", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqMock({ data: [], error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await teamService.getTeamMembers("team-1");

      expect(result).toEqual([]);
    });

    it("should fetch members with profiles", async () => {
      const mockMembers = [
        { id: "m1", team_id: "team-1", user_id: "u1", role: "lead", added_at: "2024-01-01", added_by: "admin" },
      ];
      const mockProfiles = [
        { id: "u1", display_name: "User One", avatar_url: null },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqMock({ data: mockMembers, error: null }) as ReturnType<typeof supabase.from>
      );

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockProfiles, error: null } as never);

      const result = await teamService.getTeamMembers("team-1");

      expect(result).toHaveLength(1);
      expect(result[0].profile).toBeDefined();
      expect(result[0].profile?.display_name).toBe("User One");
    });
  });

  describe("createTeam", () => {
    it("should create a new team", async () => {
      const mockTeam = { id: "new-team", name: "New Team", project_id: "proj-1" };

      vi.mocked(supabase.from).mockReturnValue(
        createInsertSelectSingleMock({ data: mockTeam, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await teamService.createTeam("proj-1", "New Team", "Description", "user-1");

      expect(supabase.from).toHaveBeenCalledWith("project_teams");
      expect(result).toEqual(mockTeam);
    });
  });

  describe("updateTeam", () => {
    it("should update team name", async () => {
      const mockTeam = { id: "team-1", name: "Updated Name" };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockTeam, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await teamService.updateTeam("team-1", { name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
    });
  });

  describe("deleteTeam", () => {
    it("should delete a team", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createDeleteEqMock({ error: null }) as ReturnType<typeof supabase.from>
      );

      await expect(teamService.deleteTeam("team-1")).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith("project_teams");
    });
  });

  describe("addTeamMember", () => {
    it("should add a member to team", async () => {
      const mockMember = { id: "m1", team_id: "team-1", user_id: "u1", role: "member" };

      vi.mocked(supabase.from).mockReturnValue(
        createInsertSelectSingleMock({ data: mockMember, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await teamService.addTeamMember("team-1", "u1", "member", "admin-1");

      expect(result.role).toBe("member");
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqMock({ error: null }) as ReturnType<typeof supabase.from>
      );

      await expect(teamService.updateMemberRole("m1", "lead")).resolves.not.toThrow();
    });
  });

  describe("removeTeamMember", () => {
    it("should remove member from team", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createDeleteEqMock({ error: null }) as ReturnType<typeof supabase.from>
      );

      await expect(teamService.removeTeamMember("m1")).resolves.not.toThrow();
    });
  });

  describe("getAllProjectMembers", () => {
    it("should return fallback profiles when no teams", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqMock({ data: [], error: null }) as ReturnType<typeof supabase.from>
      );

      const mockProfiles = [{ id: "u1", display_name: "User", avatar_url: null }];
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockProfiles, error: null } as never);

      const result = await teamService.getAllProjectMembers("proj-1");

      expect(result).toHaveLength(1);
      expect(result[0].email).toBeNull(); // Email is redacted
    });
  });
});
