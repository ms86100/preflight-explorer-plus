import { supabase } from "@/integrations/supabase/client";

type JobType = 
  | "cleanup_rate_limits"
  | "send_notifications"
  | "generate_report"
  | "sync_sprint_metrics"
  | "archive_old_issues";

interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  priority: number;
  scheduledAt?: string;
}

interface JobResult {
  success: boolean;
  message: string;
  data?: unknown;
}

interface JobsResponse {
  success: boolean;
  results: Record<string, JobResult>;
  processed: number;
  queued: number;
}

/**
 * Submit background jobs for processing
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
 * Helper to create a single job
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
 * Pre-defined job builders
 */
export const Jobs = {
  cleanupRateLimits(priority = 3) {
    return createJob("cleanup_rate_limits", {}, priority);
  },

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

  syncSprintMetrics(sprintId: string, priority = 4) {
    return createJob("sync_sprint_metrics", { sprintId }, priority);
  },

  archiveOldIssues(projectId?: string, daysOld = 365, priority = 2) {
    return createJob("archive_old_issues", { projectId, daysOld }, priority);
  },

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
 * Submit a single job
 */
export async function submitJob(job: Omit<Job, "scheduledAt">): Promise<JobResult> {
  const response = await submitJobs([job]);
  return response.results[job.id];
}
