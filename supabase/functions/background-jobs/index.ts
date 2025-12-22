import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Job types and handlers
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
  scheduledAt: string;
}

interface JobResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// Job handlers
async function handleCleanupRateLimits(
  supabase: AnySupabaseClient
): Promise<JobResult> {
  const { data, error } = await supabase.rpc("cleanup_rate_limits");
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { 
    success: true, 
    message: `Cleaned up ${data} old rate limit entries`,
    data: { deletedCount: data }
  };
}

async function handleSendNotifications(
  supabase: AnySupabaseClient,
  payload: Record<string, unknown>
): Promise<JobResult> {
  const { userIds, title, message, type = "info" } = payload;
  
  if (!userIds || !Array.isArray(userIds) || !title || !message) {
    return { success: false, message: "Invalid payload: userIds, title, message required" };
  }

  const notifications = (userIds as string[]).map(userId => ({
    user_id: userId,
    title: String(title),
    message: String(message),
    type: String(type),
    is_read: false,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { 
    success: true, 
    message: `Sent ${notifications.length} notifications`,
    data: { count: notifications.length }
  };
}

async function handleSyncSprintMetrics(
  supabase: AnySupabaseClient,
  payload: Record<string, unknown>
): Promise<JobResult> {
  const { sprintId } = payload;
  
  if (!sprintId) {
    return { success: false, message: "sprintId required" };
  }

  // Get sprint issues with their story points
  const { data: sprintIssues, error: issuesError } = await supabase
    .from("sprint_issues")
    .select(`
      issue_id,
      issues (
        story_points,
        status_id,
        issue_statuses (category)
      )
    `)
    .eq("sprint_id", sprintId);

  if (issuesError) {
    return { success: false, message: issuesError.message };
  }

  // Calculate metrics
  let totalPoints = 0;
  let completedPoints = 0;
  let issueCount = 0;
  let completedCount = 0;

  // deno-lint-ignore no-explicit-any
  for (const si of (sprintIssues || []) as any[]) {
    const issue = si.issues as { story_points?: number; issue_statuses?: { category?: string } } | null;
    if (issue) {
      issueCount++;
      totalPoints += issue.story_points || 0;
      
      if (issue.issue_statuses?.category === "done") {
        completedCount++;
        completedPoints += issue.story_points || 0;
      }
    }
  }

  return { 
    success: true, 
    message: `Sprint metrics synced`,
    data: { 
      sprintId,
      totalPoints,
      completedPoints,
      issueCount,
      completedCount,
      completionRate: totalPoints > 0 ? (completedPoints / totalPoints * 100).toFixed(1) : 0
    }
  };
}

async function handleArchiveOldIssues(
  supabase: AnySupabaseClient,
  payload: Record<string, unknown>
): Promise<JobResult> {
  const { projectId, daysOld = 365 } = payload;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (daysOld as number));

  let query = supabase
    .from("issues")
    .select("id, issue_key")
    .lt("updated_at", cutoffDate.toISOString())
    .not("resolution_id", "is", null); // Only resolved issues

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: oldIssues, error } = await query.limit(100);

  if (error) {
    return { success: false, message: error.message };
  }

  // deno-lint-ignore no-explicit-any
  const issueList = (oldIssues || []) as any[];
  
  return { 
    success: true, 
    message: `Found ${issueList.length} issues eligible for archiving`,
    data: { 
      eligibleCount: issueList.length,
      issueKeys: issueList.map(i => i.issue_key)
    }
  };
}

async function handleGenerateReport(
  _supabase: AnySupabaseClient,
  payload: Record<string, unknown>
): Promise<JobResult> {
  const { reportType, projectId, startDate, endDate } = payload;

  if (!reportType || !projectId) {
    return { success: false, message: "reportType and projectId required" };
  }

  // This is a placeholder - in production, you'd generate actual reports
  console.log(`Generating ${reportType} report for project ${projectId}`);

  return { 
    success: true, 
    message: `Report generation initiated`,
    data: { 
      reportType,
      projectId,
      startDate,
      endDate,
      status: "queued"
    }
  };
}

// Main job processor
async function processJob(
  supabase: AnySupabaseClient,
  job: Job
): Promise<JobResult> {
  console.log(`[Jobs] Processing job: ${job.type} (${job.id})`);
  
  switch (job.type) {
    case "cleanup_rate_limits":
      return handleCleanupRateLimits(supabase);
    case "send_notifications":
      return handleSendNotifications(supabase, job.payload);
    case "sync_sprint_metrics":
      return handleSyncSprintMetrics(supabase, job.payload);
    case "archive_old_issues":
      return handleArchiveOldIssues(supabase, job.payload);
    case "generate_report":
      return handleGenerateReport(supabase, job.payload);
    default:
      return { success: false, message: `Unknown job type: ${job.type}` };
  }
}

// Declare EdgeRuntime for Deno edge functions
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { jobs } = body as { jobs: Job[] };

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return new Response(
        JSON.stringify({ error: "jobs array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by priority (higher = first)
    const sortedJobs = [...jobs].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log(`[Jobs] Processing ${sortedJobs.length} jobs`);

    // Process jobs using background tasks for non-blocking execution
    const results: Record<string, JobResult> = {};
    
    // Process high-priority jobs immediately
    const highPriorityJobs = sortedJobs.filter(j => (j.priority || 0) >= 5);
    const lowPriorityJobs = sortedJobs.filter(j => (j.priority || 0) < 5);

    // Execute high-priority jobs synchronously
    for (const job of highPriorityJobs) {
      results[job.id] = await processJob(supabaseAdmin, job);
    }

    // Queue low-priority jobs as background tasks
    if (lowPriorityJobs.length > 0) {
      EdgeRuntime.waitUntil(
        (async () => {
          for (const job of lowPriorityJobs) {
            try {
              const result = await processJob(supabaseAdmin, job);
              console.log(`[Jobs] Background job ${job.id} completed:`, result);
            } catch (err) {
              console.error(`[Jobs] Background job ${job.id} failed:`, err);
            }
          }
        })()
      );
      
      // Mark low-priority jobs as queued
      for (const job of lowPriorityJobs) {
        results[job.id] = { success: true, message: "Queued for background processing" };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        processed: highPriorityJobs.length,
        queued: lowPriorityJobs.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Jobs] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
