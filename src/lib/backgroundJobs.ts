/**
 * @fileoverview Background job utilities for asynchronous task processing.
 * @module lib/backgroundJobs
 * 
 * @description
 * Provides utilities for submitting and managing background jobs that are
 * processed asynchronously by the background-jobs edge function. Jobs are
 * queued with priority and scheduled execution time.
 * 
 * @example
 * ```typescript
 * import { submitJob, Jobs, createJob } from '@/lib/backgroundJobs';
 * 
 * // Using pre-defined job builders
 * await submitJob(Jobs.cleanupRateLimits());
 * await submitJob(Jobs.sendNotifications(['user-1'], 'Title', 'Message'));
 * 
 * // Creating custom jobs
 * const job = createJob('generate_report', { projectId: 'proj-1' }, 3);
 * await submitJob(job);
 * ```
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Supported background job types.
 * Each type corresponds to a specific handler in the background-jobs edge function.
 * 
 * @typedef {string} JobType
 */
type JobType = 
  | "cleanup_rate_limits"
  | "send_notifications"
  | "generate_report"
  | "sync_sprint_metrics"
  | "archive_old_issues";

/**
 * Represents a background job to be processed.
 * 
 * @interface Job
 * @property {string} id - Unique identifier for the job (UUID)
 * @property {JobType} type - The type of job to execute
 * @property {Record<string, unknown>} payload - Job-specific data
 * @property {number} priority - Execution priority (1-10, lower = higher priority)
 * @property {string} [scheduledAt] - ISO timestamp when job was scheduled
 */
interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  priority: number;
  scheduledAt?: string;
}

/**
 * Result of a single job execution.
 * 
 * @interface JobResult
 * @property {boolean} success - Whether the job completed successfully
 * @property {string} message - Human-readable result message
 * @property {unknown} [data] - Optional result data from the job
 */
interface JobResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Response from the background-jobs edge function.
 * 
 * @interface JobsResponse
 * @property {boolean} success - Whether all jobs were submitted successfully
 * @property {Record<string, JobResult>} results - Results keyed by job ID
 * @property {number} processed - Number of jobs processed immediately
 * @property {number} queued - Number of jobs queued for later processing
 */
interface JobsResponse {
  success: boolean;
  results: Record<string, JobResult>;
  processed: number;
  queued: number;
}

/**
 * Submits multiple background jobs for processing.
 * 
 * Jobs are sent to the background-jobs edge function which processes
 * them asynchronously. High-priority jobs may be processed immediately
 * while lower-priority jobs are queued.
 * 
 * @param jobs - Array of jobs to submit (without scheduledAt, which is added automatically)
 * @returns Promise resolving to the jobs response with results and queue status
 * @throws {Error} If the edge function invocation fails
 * 
 * @example
 * ```typescript
 * const jobs = [
 *   Jobs.cleanupRateLimits(),
 *   Jobs.syncSprintMetrics('sprint-123'),
 * ];
 * 
 * const response = await submitJobs(jobs);
 * console.log(`Processed: ${response.processed}, Queued: ${response.queued}`);
 * ```
 */
export async function submitJobs(jobs: Omit<Job, "scheduledAt">[]): Promise<JobsResponse> {
  const jobsWithTimestamp = jobs.map(job => ({
    ...job,
    scheduledAt: new Date().toISOString(),
  }));

  const { data, error } = await supabase.functions.invoke("background-jobs", {
    body: { jobs: jobsWithTimestamp },
  });

  if (error) {
    throw new Error(`Failed to submit jobs: ${error.message}`);
  }

  return data as JobsResponse;
}

/**
 * Creates a job object with the specified parameters.
 * 
 * This is a helper function for creating job objects with proper structure.
 * The job ID is automatically generated using crypto.randomUUID().
 * 
 * @param type - The type of job to create
 * @param payload - Job-specific data (defaults to empty object)
 * @param priority - Execution priority 1-10 (defaults to 5, lower = higher priority)
 * @returns A job object ready to be submitted
 * 
 * @example
 * ```typescript
 * const job = createJob('generate_report', { projectId: 'proj-1' }, 3);
 * await submitJob(job);
 * ```
 */
export function createJob(
  type: JobType,
  payload: Record<string, unknown> = {},
  priority: number = 5
): Omit<Job, "scheduledAt"> {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    priority,
  };
}

/**
 * Pre-defined job builders for common operations.
 * 
 * These factory functions create properly configured jobs for standard
 * background operations. Each function returns a job object that can
 * be passed to submitJob() or submitJobs().
 * 
 * @example
 * ```typescript
 * // Clean up expired rate limit entries
 * await submitJob(Jobs.cleanupRateLimits());
 * 
 * // Send notifications to users
 * await submitJob(Jobs.sendNotifications(
 *   ['user-1', 'user-2'],
 *   'Sprint Started',
 *   'Sprint 5 has begun',
 *   'info'
 * ));
 * 
 * // Generate a velocity report
 * await submitJob(Jobs.generateReport(
 *   'velocity',
 *   'project-123',
 *   '2024-01-01',
 *   '2024-01-31'
 * ));
 * ```
 */
export const Jobs = {
  /**
   * Creates a job to clean up expired rate limit entries.
   * 
   * @param priority - Job priority (default: 3)
   * @returns Cleanup rate limits job
   */
  cleanupRateLimits(priority = 3) {
    return createJob("cleanup_rate_limits", {}, priority);
  },

  /**
   * Creates a job to send notifications to specified users.
   * 
   * @param userIds - Array of user IDs to notify
   * @param title - Notification title
   * @param message - Notification message body
   * @param type - Notification type (info, warning, error, success)
   * @param priority - Job priority (default: 5)
   * @returns Send notifications job
   */
  sendNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: string = "info",
    priority = 5
  ) {
    return createJob(
      "send_notifications",
      { userIds, title, message, type },
      priority
    );
  },

  /**
   * Creates a job to synchronize sprint metrics.
   * 
   * @param sprintId - ID of the sprint to sync metrics for
   * @param priority - Job priority (default: 4)
   * @returns Sync sprint metrics job
   */
  syncSprintMetrics(sprintId: string, priority = 4) {
    return createJob("sync_sprint_metrics", { sprintId }, priority);
  },

  /**
   * Creates a job to archive old issues.
   * 
   * @param projectId - Optional project ID to limit archiving scope
   * @param daysOld - Age threshold in days (default: 365)
   * @param priority - Job priority (default: 2, low priority)
   * @returns Archive old issues job
   */
  archiveOldIssues(projectId?: string, daysOld = 365, priority = 2) {
    return createJob("archive_old_issues", { projectId, daysOld }, priority);
  },

  /**
   * Creates a job to generate a report.
   * 
   * @param reportType - Type of report (velocity, burndown, etc.)
   * @param projectId - Project ID to generate report for
   * @param startDate - Optional start date for report range
   * @param endDate - Optional end date for report range
   * @param priority - Job priority (default: 3)
   * @returns Generate report job
   */
  generateReport(
    reportType: string,
    projectId: string,
    startDate?: string,
    endDate?: string,
    priority = 3
  ) {
    return createJob(
      "generate_report",
      { reportType, projectId, startDate, endDate },
      priority
    );
  },
};

/**
 * Submits a single background job for processing.
 * 
 * Convenience wrapper around submitJobs() for single job submission.
 * 
 * @param job - The job to submit
 * @returns Promise resolving to the job result
 * 
 * @example
 * ```typescript
 * const result = await submitJob(Jobs.cleanupRateLimits());
 * 
 * if (result.success) {
 *   console.log('Cleanup completed:', result.message);
 * } else {
 *   console.error('Cleanup failed:', result.message);
 * }
 * ```
 */
export async function submitJob(job: Omit<Job, "scheduledAt">): Promise<JobResult> {
  const response = await submitJobs([job]);
  return response.results[job.id];
}

// ============================================================================
// Type Exports
// ============================================================================

export type { JobType, Job, JobResult, JobsResponse };
