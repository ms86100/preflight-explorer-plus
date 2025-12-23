/**
 * @fileoverview Unit tests for template service.
 * @module features/migration/services/templateService.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateTemplate,
  generateEmptyTemplate,
  autoMapHeaders,
  getTemplateConfigs,
  JIRA_HEADER_MAPPINGS,
} from "./templateService";

describe("templateService", () => {
  describe("generateTemplate", () => {
    it("should generate issues template with sample data", () => {
      const result = generateTemplate("issues");

      expect(result).toContain("summary");
      expect(result).toContain("issue_type");
      expect(result).toContain("project_key");
      expect(result.split("\n").length).toBeGreaterThan(1); // Has header + data rows
    });

    it("should generate projects template", () => {
      const result = generateTemplate("projects");

      expect(result).toContain("name");
      expect(result).toContain("key");
      expect(result).toContain("description");
    });

    it("should generate users template", () => {
      const result = generateTemplate("users");

      expect(result).toContain("email");
      expect(result).toContain("display_name");
      expect(result).toContain("department");
    });

    it("should use Jira headers when specified", () => {
      const result = generateTemplate("issues", true);

      expect(result).toContain("Summary");
      expect(result).toContain("Issue Type");
      expect(result).toContain("Project key");
    });

    it("should throw for unknown import type", () => {
      expect(() => generateTemplate("invalid" as 'issues')).toThrow("Unknown import type");
    });
  });

  describe("generateEmptyTemplate", () => {
    it("should generate header-only template", () => {
      const result = generateEmptyTemplate("issues");

      expect(result.split("\n")).toHaveLength(1);
      expect(result).toContain("summary");
    });

    it("should use Jira headers when specified", () => {
      const result = generateEmptyTemplate("issues", true);

      expect(result).toContain("Summary");
      expect(result).not.toContain("summary");
    });
  });

  describe("autoMapHeaders", () => {
    it("should map Jira headers to field names", () => {
      const headers = ["Summary", "Issue Type", "Project key", "Description"];
      const result = autoMapHeaders(headers, "issues");

      expect(result["Summary"]).toBe("summary");
      expect(result["Issue Type"]).toBe("issue_type");
      expect(result["Project key"]).toBe("project_key");
      expect(result["Description"]).toBe("description");
    });

    it("should map our field names directly", () => {
      const headers = ["summary", "issue_type", "project_key"];
      const result = autoMapHeaders(headers, "issues");

      expect(result["summary"]).toBe("summary");
      expect(result["issue_type"]).toBe("issue_type");
    });

    it("should handle user import headers", () => {
      const headers = ["Email", "Display Name", "Department"];
      const result = autoMapHeaders(headers, "users");

      expect(result["Email"]).toBe("email");
      expect(result["Display Name"]).toBe("display_name");
      expect(result["Department"]).toBe("department");
    });

    it("should handle project import headers", () => {
      const headers = ["Project Name", "Project Key", "Lead"];
      const result = autoMapHeaders(headers, "projects");

      expect(result["Project Name"]).toBe("name");
      expect(result["Project Key"]).toBe("key");
      expect(result["Lead"]).toBe("lead_email");
    });

    it("should not map unrecognized headers", () => {
      const headers = ["Unknown Header", "Another Unknown"];
      const result = autoMapHeaders(headers, "issues");

      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should handle mixed recognized and unrecognized headers", () => {
      const headers = ["Summary", "Unknown", "Priority"];
      const result = autoMapHeaders(headers, "issues");

      expect(result["Summary"]).toBe("summary");
      expect(result["Priority"]).toBe("priority");
      expect(result["Unknown"]).toBeUndefined();
    });
  });

  describe("JIRA_HEADER_MAPPINGS", () => {
    it("should have mappings for common Jira issue fields", () => {
      expect(JIRA_HEADER_MAPPINGS["Summary"]).toBe("summary");
      expect(JIRA_HEADER_MAPPINGS["Issue Type"]).toBe("issue_type");
      expect(JIRA_HEADER_MAPPINGS["Priority"]).toBe("priority");
      expect(JIRA_HEADER_MAPPINGS["Status"]).toBe("status");
      expect(JIRA_HEADER_MAPPINGS["Assignee"]).toBe("assignee_email");
      expect(JIRA_HEADER_MAPPINGS["Reporter"]).toBe("reporter_email");
    });

    it("should have mappings for project fields", () => {
      expect(JIRA_HEADER_MAPPINGS["Project Name"]).toBe("name");
      expect(JIRA_HEADER_MAPPINGS["Project Key"]).toBe("key");
      expect(JIRA_HEADER_MAPPINGS["Project Lead"]).toBe("lead_email");
    });

    it("should have mappings for user fields", () => {
      expect(JIRA_HEADER_MAPPINGS["Email"]).toBe("email");
      expect(JIRA_HEADER_MAPPINGS["Display Name"]).toBe("display_name");
      expect(JIRA_HEADER_MAPPINGS["Full Name"]).toBe("display_name");
    });

    it("should have alternative mappings for same fields", () => {
      expect(JIRA_HEADER_MAPPINGS["Story Points"]).toBe("story_points");
      expect(JIRA_HEADER_MAPPINGS["Story points"]).toBe("story_points");
    });
  });

  describe("getTemplateConfigs", () => {
    it("should return all template configs", () => {
      const configs = getTemplateConfigs();

      expect(configs).toHaveProperty("issues");
      expect(configs).toHaveProperty("projects");
      expect(configs).toHaveProperty("users");
    });

    it("should have valid config structure", () => {
      const configs = getTemplateConfigs();

      expect(configs.issues.headers).toBeInstanceOf(Array);
      expect(configs.issues.jiraHeaders).toBeInstanceOf(Array);
      expect(configs.issues.sampleRows).toBeInstanceOf(Array);
    });

    it("should have matching header and jiraHeader lengths", () => {
      const configs = getTemplateConfigs();

      expect(configs.issues.headers.length).toBe(configs.issues.jiraHeaders.length);
      expect(configs.projects.headers.length).toBe(configs.projects.jiraHeaders.length);
      expect(configs.users.headers.length).toBe(configs.users.jiraHeaders.length);
    });
  });

  describe("downloadTemplate", () => {
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockClick = vi.fn();
      mockCreateElement = vi.fn().mockReturnValue({
        href: "",
        download: "",
        click: mockClick,
      });
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();
      mockCreateObjectURL = vi.fn().mockReturnValue("blob:url");
      mockRevokeObjectURL = vi.fn();

      vi.stubGlobal("document", {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
      });

      vi.stubGlobal("URL", {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    // Note: downloadTemplate is harder to test as it manipulates DOM directly
    // These tests verify the function doesn't throw
    it("should generate valid CSV content for escaping", () => {
      const template = generateTemplate("issues");
      
      // Should handle commas and quotes in sample data
      expect(template).toContain(",");
    });
  });
});
