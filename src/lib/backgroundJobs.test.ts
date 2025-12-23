/**
 * @fileoverview Unit tests for background job utilities.
 * @module lib/backgroundJobs.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitJobs, submitJob, createJob, Jobs } from "./backgroundJobs";

// Mock the Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("backgroundJobs", () => {
  const mockUuid = "test-uuid-1234-5678-9abc-def012345678" as `${string}-${string}-${string}-${string}-${string}`;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID for consistent test results
    vi.spyOn(crypto, "randomUUID").mockReturnValue(mockUuid);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createJob", () => {
    it("should create a job with default values", () => {
      const job = createJob("cleanup_rate_limits");

      expect(job).toEqual({
        id: mockUuid,
        type: "cleanup_rate_limits",
        payload: {},
        priority: 5,
      });
    });

    it("should create a job with custom payload and priority", () => {
      const job = createJob(
        "send_notifications",
        { userIds: ["user-1"], title: "Test" },
        3
      );

      expect(job).toEqual({
        id: mockUuid,
        type: "send_notifications",
        payload: { userIds: ["user-1"], title: "Test" },
        priority: 3,
      });
    });

    it("should create a job with all job types", () => {
      const jobTypes = [
        "cleanup_rate_limits",
        "send_notifications",
        "generate_report",
        "sync_sprint_metrics",
        "archive_old_issues",
      ] as const;

      jobTypes.forEach((type) => {
        const job = createJob(type);
        expect(job.type).toBe(type);
      });
    });
  });

  describe("Jobs factory functions", () => {
    it("should create cleanupRateLimits job", () => {
      const job = Jobs.cleanupRateLimits();

      expect(job.type).toBe("cleanup_rate_limits");
      expect(job.priority).toBe(3);
      expect(job.payload).toEqual({});
    });

    it("should create cleanupRateLimits job with custom priority", () => {
      const job = Jobs.cleanupRateLimits(1);

      expect(job.priority).toBe(1);
    });

    it("should create sendNotifications job", () => {
      const job = Jobs.sendNotifications(
        ["user-1", "user-2"],
        "Test Title",
        "Test Message"
      );

      expect(job.type).toBe("send_notifications");
      expect(job.priority).toBe(5);
      expect(job.payload).toEqual({
        userIds: ["user-1", "user-2"],
        title: "Test Title",
        message: "Test Message",
        type: "info",
      });
    });

    it("should create sendNotifications job with custom type and priority", () => {
      const job = Jobs.sendNotifications(
        ["user-1"],
        "Warning",
        "Something happened",
        "warning",
        2
      );

      expect(job.payload.type).toBe("warning");
      expect(job.priority).toBe(2);
    });

    it("should create syncSprintMetrics job", () => {
      const job = Jobs.syncSprintMetrics("sprint-123");

      expect(job.type).toBe("sync_sprint_metrics");
      expect(job.priority).toBe(4);
      expect(job.payload).toEqual({ sprintId: "sprint-123" });
    });

    it("should create archiveOldIssues job with defaults", () => {
      const job = Jobs.archiveOldIssues();

      expect(job.type).toBe("archive_old_issues");
      expect(job.priority).toBe(2);
      expect(job.payload).toEqual({ projectId: undefined, daysOld: 365 });
    });

    it("should create archiveOldIssues job with custom params", () => {
      const job = Jobs.archiveOldIssues("project-123", 180, 1);

      expect(job.payload).toEqual({ projectId: "project-123", daysOld: 180 });
      expect(job.priority).toBe(1);
    });

    it("should create generateReport job", () => {
      const job = Jobs.generateReport("velocity", "project-123");

      expect(job.type).toBe("generate_report");
      expect(job.priority).toBe(3);
      expect(job.payload).toEqual({
        reportType: "velocity",
        projectId: "project-123",
        startDate: undefined,
        endDate: undefined,
      });
    });

    it("should create generateReport job with date range", () => {
      const job = Jobs.generateReport(
        "burndown",
        "project-123",
        "2024-01-01",
        "2024-01-31",
        5
      );

      expect(job.payload).toEqual({
        reportType: "burndown",
        projectId: "project-123",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });
      expect(job.priority).toBe(5);
    });
  });

  describe("submitJobs", () => {
    it("should submit jobs successfully", async () => {
      const mockResponse = {
        success: true,
        results: {
          "test-uuid-12345": { success: true, message: "Completed" },
        },
        processed: 1,
        queued: 0,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const jobs = [createJob("cleanup_rate_limits")];
      const result = await submitJobs(jobs);

      expect(supabase.functions.invoke).toHaveBeenCalledWith("background-jobs", {
        body: {
          jobs: expect.arrayContaining([
            expect.objectContaining({
              id: mockUuid,
              type: "cleanup_rate_limits",
              scheduledAt: expect.any(String),
            }),
          ]),
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it("should add scheduledAt timestamp to jobs", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, results: {}, processed: 1, queued: 0 },
        error: null,
      });

      const jobs = [createJob("cleanup_rate_limits")];
      await submitJobs(jobs);

      const call = vi.mocked(supabase.functions.invoke).mock.calls[0];
      const submittedJobs = (call[1] as { body: { jobs: { scheduledAt: string }[] } }).body.jobs;

      expect(submittedJobs[0].scheduledAt).toBeDefined();
      expect(new Date(submittedJobs[0].scheduledAt).getTime()).toBeGreaterThan(0);
    });

    it("should throw error on function invocation failure", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: "Function not found" },
      });

      const jobs = [createJob("cleanup_rate_limits")];

      await expect(submitJobs(jobs)).rejects.toThrow(
        "Failed to submit jobs: Function not found"
      );
    });

    it("should handle multiple jobs", async () => {
      const mockResponse = {
        success: true,
        results: {
          job1: { success: true, message: "Done" },
          job2: { success: true, message: "Done" },
        },
        processed: 2,
        queued: 0,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      // Need to mock randomUUID to return different values
      let callCount = 0;
      vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
        callCount++;
        return `job-${callCount}-uuid-1234-5678` as `${string}-${string}-${string}-${string}-${string}`;
      });

      const jobs = [
        createJob("cleanup_rate_limits"),
        createJob("send_notifications", { userIds: [] }, 5),
      ];
      const result = await submitJobs(jobs);

      expect(result.processed).toBe(2);
      expect(Object.keys(result.results)).toHaveLength(2);
    });
  });

  describe("submitJob", () => {
    it("should submit a single job and return its result", async () => {
      const mockResponse = {
        success: true,
        results: {
          [mockUuid]: { success: true, message: "Job completed", data: { count: 5 } },
        },
        processed: 1,
        queued: 0,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const job = createJob("cleanup_rate_limits");
      const result = await submitJob(job);

      expect(result).toEqual({
        success: true,
        message: "Job completed",
        data: { count: 5 },
      });
    });

    it("should handle job failure", async () => {
      const mockResponse = {
        success: false,
        results: {
          [mockUuid]: { success: false, message: "Job failed" },
        },
        processed: 0,
        queued: 1,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const job = createJob("generate_report", { projectId: "invalid" });
      const result = await submitJob(job);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Job failed");
    });
  });
});
