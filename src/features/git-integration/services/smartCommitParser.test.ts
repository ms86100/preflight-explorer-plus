/**
 * @fileoverview Unit tests for smart commit parser.
 * @module features/git-integration/services/smartCommitParser.test
 */

import { describe, it, expect } from "vitest";
import {
  extractIssueKeys,
  parseSmartCommit,
  parseSmartCommitActions,
  parseTimeToMinutes,
  formatMinutesToTime,
  hasSmartCommitCommands,
  generateBranchName,
} from "./smartCommitParser";

describe("smartCommitParser", () => {
  describe("extractIssueKeys", () => {
    it("should extract single issue key", () => {
      const result = extractIssueKeys("PROJ-123 Fix login bug");
      expect(result).toEqual(["PROJ-123"]);
    });

    it("should extract multiple issue keys", () => {
      const result = extractIssueKeys("PROJ-123 PROJ-456 Related fixes");
      expect(result).toEqual(["PROJ-123", "PROJ-456"]);
    });

    it("should extract issue keys from different projects", () => {
      const result = extractIssueKeys("PROJ-1 ABC-99 TEST-999 Multi-project commit");
      expect(result).toEqual(["PROJ-1", "ABC-99", "TEST-999"]);
    });

    it("should remove duplicate keys", () => {
      const result = extractIssueKeys("PROJ-123 Fixed PROJ-123 again");
      expect(result).toEqual(["PROJ-123"]);
    });

    it("should return empty array for no keys", () => {
      const result = extractIssueKeys("No issue keys here");
      expect(result).toEqual([]);
    });

    it("should handle lowercase (not match)", () => {
      const result = extractIssueKeys("proj-123 lowercase");
      expect(result).toEqual([]);
    });

    it("should match keys at start, middle, and end", () => {
      const result = extractIssueKeys("PROJ-1 in the PROJ-2 middle PROJ-3");
      expect(result).toEqual(["PROJ-1", "PROJ-2", "PROJ-3"]);
    });
  });

  describe("parseSmartCommitActions", () => {
    it("should parse comment command", () => {
      const issueKeys = ["PROJ-123"];
      const result = parseSmartCommitActions("Fix bug #comment Added unit tests", issueKeys);

      expect(result).toContainEqual({
        type: "comment",
        value: "Added unit tests",
        issueKey: "PROJ-123",
      });
    });

    it("should parse time command", () => {
      const issueKeys = ["PROJ-123"];
      const result = parseSmartCommitActions("PROJ-123 #time 2h 30m", issueKeys);

      expect(result).toContainEqual({
        type: "time",
        value: expect.stringMatching(/2h\s*30m/),
        issueKey: "PROJ-123",
      });
    });

    it("should parse resolve transition", () => {
      const issueKeys = ["PROJ-123"];
      const result = parseSmartCommitActions("PROJ-123 #resolve Fixed the issue", issueKeys);

      expect(result).toContainEqual({
        type: "transition",
        value: "resolve",
        issueKey: "PROJ-123",
      });
    });

    it("should parse in-progress transition", () => {
      const issueKeys = ["PROJ-123"];
      const result = parseSmartCommitActions("PROJ-123 #in-progress Started work", issueKeys);

      expect(result).toContainEqual({
        type: "transition",
        value: "in-progress",
        issueKey: "PROJ-123",
      });
    });

    it("should apply actions to all mentioned issues", () => {
      const issueKeys = ["PROJ-123", "PROJ-456"];
      const result = parseSmartCommitActions("#comment Shared fix", issueKeys);

      expect(result).toHaveLength(2);
      expect(result[0].issueKey).toBe("PROJ-123");
      expect(result[1].issueKey).toBe("PROJ-456");
    });

    it("should return empty for no issue keys", () => {
      const result = parseSmartCommitActions("#comment No keys", []);
      expect(result).toEqual([]);
    });
  });

  describe("parseSmartCommit", () => {
    it("should parse complete smart commit", () => {
      const message = "PROJ-123 Fix authentication #comment Updated login flow #time 1h #resolve";
      const result = parseSmartCommit(message);

      expect(result.issueKeys).toEqual(["PROJ-123"]);
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.rawMessage).toBe(message);
    });

    it("should handle message with no smart commands", () => {
      const message = "PROJ-123 Simple fix without commands";
      const result = parseSmartCommit(message);

      expect(result.issueKeys).toEqual(["PROJ-123"]);
      expect(result.actions).toEqual([]);
    });

    it("should handle message with no issue keys", () => {
      const message = "Regular commit without issue reference";
      const result = parseSmartCommit(message);

      expect(result.issueKeys).toEqual([]);
      expect(result.actions).toEqual([]);
    });
  });

  describe("parseTimeToMinutes", () => {
    it("should parse minutes", () => {
      expect(parseTimeToMinutes("30m")).toBe(30);
    });

    it("should parse hours", () => {
      expect(parseTimeToMinutes("2h")).toBe(120);
    });

    it("should parse days (8 hours)", () => {
      expect(parseTimeToMinutes("1d")).toBe(480);
    });

    it("should parse weeks (5 days)", () => {
      expect(parseTimeToMinutes("1w")).toBe(2400);
    });

    it("should parse combined time", () => {
      expect(parseTimeToMinutes("1w 2d 3h 30m")).toBe(2400 + 960 + 180 + 30);
    });

    it("should handle hours and minutes", () => {
      expect(parseTimeToMinutes("2h 30m")).toBe(150);
    });

    it("should return 0 for invalid input", () => {
      expect(parseTimeToMinutes("invalid")).toBe(0);
    });
  });

  describe("formatMinutesToTime", () => {
    it("should format minutes only", () => {
      expect(formatMinutesToTime(30)).toBe("30m");
    });

    it("should format hours", () => {
      expect(formatMinutesToTime(120)).toBe("2h");
    });

    it("should format hours and minutes", () => {
      expect(formatMinutesToTime(150)).toBe("2h 30m");
    });

    it("should format days", () => {
      expect(formatMinutesToTime(480)).toBe("1d");
    });

    it("should format days and hours", () => {
      expect(formatMinutesToTime(600)).toBe("1d 2h");
    });

    it("should format weeks", () => {
      expect(formatMinutesToTime(2400)).toBe("1w");
    });

    it("should format complex time", () => {
      // 1w 2d 3h = 2400 + 960 + 180 = 3540
      const result = formatMinutesToTime(3540);
      expect(result).toContain("1w");
      expect(result).toContain("2d");
      expect(result).toContain("3h");
    });
  });

  describe("hasSmartCommitCommands", () => {
    it("should detect comment command", () => {
      expect(hasSmartCommitCommands("#comment Test")).toBe(true);
    });

    it("should detect time command", () => {
      expect(hasSmartCommitCommands("#time 1h")).toBe(true);
    });

    it("should detect resolve command", () => {
      expect(hasSmartCommitCommands("#resolve")).toBe(true);
    });

    it("should detect done command", () => {
      expect(hasSmartCommitCommands("#done")).toBe(true);
    });

    it("should detect in-progress command", () => {
      expect(hasSmartCommitCommands("#in-progress")).toBe(true);
    });

    it("should return false for no commands", () => {
      expect(hasSmartCommitCommands("Regular commit message")).toBe(false);
    });
  });

  describe("generateBranchName", () => {
    it("should generate basic branch name", () => {
      const result = generateBranchName("PROJ-123");
      expect(result).toBe("feature/proj-123");
    });

    it("should include sanitized description", () => {
      const result = generateBranchName("PROJ-123", "Fix login bug");
      expect(result).toBe("feature/proj-123-fix-login-bug");
    });

    it("should use custom prefix", () => {
      const result = generateBranchName("PROJ-123", "Hot fix", "hotfix");
      expect(result).toBe("hotfix/proj-123-hot-fix");
    });

    it("should sanitize special characters", () => {
      const result = generateBranchName("PROJ-123", "Fix: user's login (v2)!");
      expect(result).toBe("feature/proj-123-fix-users-login-v2");
    });

    it("should truncate long descriptions", () => {
      const longDesc = "This is a very long description that should be truncated because it exceeds the maximum length";
      const result = generateBranchName("PROJ-123", longDesc);
      expect(result.length).toBeLessThanOrEqual(65); // prefix + key + truncated desc
    });

    it("should handle empty description", () => {
      const result = generateBranchName("PROJ-123", "");
      expect(result).toBe("feature/proj-123");
    });

    it("should handle whitespace-only description", () => {
      const result = generateBranchName("PROJ-123", "   ");
      expect(result).toBe("feature/proj-123");
    });
  });
});
