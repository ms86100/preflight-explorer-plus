/**
 * @fileoverview Unit tests for plugin service.
 * @module features/plugins/services/pluginService.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPlugins,
  getPlugin,
  getEnabledPlugins,
  togglePlugin,
  updatePluginConfig,
  createPlugin,
} from "./pluginService";

// Mock factory functions moved to module scope to avoid nested functions (S2004)
function createSelectOrderOrderMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

function createSelectEqSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

function createSelectEqOrderMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
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
  };
}

function createInsertSelectSingleMock(resolvedValue: { data: unknown; error: unknown }) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  };
}

// Default mock factory
function createDefaultFromMock() {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
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
  };
}

// Mock Supabase client - flattened structure (S2004)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createDefaultFromMock()),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("pluginService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlugins", () => {
    it("should fetch all plugins ordered by system flag and name", async () => {
      const mockPlugins = [
        { id: "1", key: "git-integration", name: "Git Integration", is_system: true },
        { id: "2", key: "slack", name: "Slack", is_system: false },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectOrderOrderMock({ data: mockPlugins, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await getPlugins();

      expect(supabase.from).toHaveBeenCalledWith("plugins");
      expect(result).toEqual(mockPlugins);
    });

    it("should throw on error", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectOrderOrderMock({ data: null, error: { message: "Error" } }) as ReturnType<typeof supabase.from>
      );

      await expect(getPlugins()).rejects.toEqual({ message: "Error" });
    });
  });

  describe("getPlugin", () => {
    it("should fetch a single plugin by key", async () => {
      const mockPlugin = { id: "1", key: "git-integration", name: "Git Integration" };

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqSingleMock({ data: mockPlugin, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await getPlugin("git-integration");

      expect(result).toEqual(mockPlugin);
    });

    it("should return null for not found (PGRST116)", async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqSingleMock({ data: null, error: { code: "PGRST116" } }) as ReturnType<typeof supabase.from>
      );

      const result = await getPlugin("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getEnabledPlugins", () => {
    it("should fetch only enabled plugins", async () => {
      const mockPlugins = [
        { id: "1", key: "git-integration", name: "Git Integration", is_enabled: true },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createSelectEqOrderMock({ data: mockPlugins, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await getEnabledPlugins();

      expect(result).toEqual(mockPlugins);
    });
  });

  describe("togglePlugin", () => {
    it("should enable a plugin", async () => {
      const mockPlugin = { id: "1", key: "slack", is_enabled: true };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockPlugin, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await togglePlugin("1", true);

      expect(result.is_enabled).toBe(true);
    });

    it("should disable a plugin", async () => {
      const mockPlugin = { id: "1", key: "slack", is_enabled: false };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockPlugin, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await togglePlugin("1", false);

      expect(result.is_enabled).toBe(false);
    });
  });

  describe("updatePluginConfig", () => {
    it("should update plugin configuration", async () => {
      const mockPlugin = { id: "1", key: "slack", config: { webhook_url: "https://hooks.slack.com/xxx" } };

      vi.mocked(supabase.from).mockReturnValue(
        createUpdateEqSelectSingleMock({ data: mockPlugin, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await updatePluginConfig("1", { webhook_url: "https://hooks.slack.com/xxx" });

      expect(result.config).toEqual({ webhook_url: "https://hooks.slack.com/xxx" });
    });
  });

  describe("createPlugin", () => {
    it("should create a new plugin", async () => {
      const mockPlugin = {
        id: "new-plugin",
        key: "custom-plugin",
        name: "Custom Plugin",
        is_enabled: false,
      };

      vi.mocked(supabase.from).mockReturnValue(
        createInsertSelectSingleMock({ data: mockPlugin, error: null }) as ReturnType<typeof supabase.from>
      );

      const result = await createPlugin({
        key: "custom-plugin",
        name: "Custom Plugin",
        description: "A custom plugin",
        version: "1.0.0",
        vendor: "Custom Vendor",
        vendor_url: "https://vendor.com",
        documentation_url: "https://docs.vendor.com",
        icon_url: null,
        is_system: false,
        is_enabled: false,
        category: "integration",
        config: {},
        hooks: [],
        permissions: [],
      });

      expect(supabase.from).toHaveBeenCalledWith("plugins");
      expect(result.key).toBe("custom-plugin");
    });
  });
});
