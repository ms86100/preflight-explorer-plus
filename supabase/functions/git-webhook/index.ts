import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256, x-hub-signature, x-gitlab-token, x-event-key, x-hook-uuid',
};

// ==================== SIGNATURE VERIFICATION ====================

// Crypto utilities for HMAC verification
async function createHmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createHmacSha1(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.codePointAt(i) ?? 0) ^ (b.codePointAt(i) ?? 0);
  }
  return result === 0;
}

// Verify GitHub webhook signature (supports both SHA-256 and SHA-1)
async function verifyGitHubSignature(payload: string, headers: Headers, secret: string): Promise<boolean> {
  if (!secret) {
    console.log('[git-webhook] No webhook secret configured, skipping verification');
    return true; // Allow if no secret configured
  }
  
  // Try SHA-256 first (preferred)
  const sha256Sig = headers.get('x-hub-signature-256');
  if (sha256Sig) {
    const expectedSig = sha256Sig.replace('sha256=', '');
    const computedSig = await createHmacSha256(secret, payload);
    const isValid = timingSafeEqual(expectedSig.toLowerCase(), computedSig.toLowerCase());
    console.log(`[git-webhook] GitHub SHA-256 verification: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }
  
  // Fall back to SHA-1 (legacy)
  const sha1Sig = headers.get('x-hub-signature');
  if (sha1Sig) {
    const expectedSig = sha1Sig.replace('sha1=', '');
    const computedSig = await createHmacSha1(secret, payload);
    const isValid = timingSafeEqual(expectedSig.toLowerCase(), computedSig.toLowerCase());
    console.log(`[git-webhook] GitHub SHA-1 verification: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }
  
  console.warn('[git-webhook] No GitHub signature header found');
  return false;
}

// Verify GitLab webhook signature (token-based)
function verifyGitLabSignature(headers: Headers, secret: string): boolean {
  if (!secret) {
    console.log('[git-webhook] No webhook secret configured, skipping verification');
    return true;
  }
  
  const gitlabToken = headers.get('x-gitlab-token');
  if (!gitlabToken) {
    console.warn('[git-webhook] No GitLab token header found');
    return false;
  }
  
  const isValid = timingSafeEqual(gitlabToken, secret);
  console.log(`[git-webhook] GitLab token verification: ${isValid ? 'PASS' : 'FAIL'}`);
  return isValid;
}

// Verify Bitbucket webhook (no native HMAC, uses IP allowlist typically)
// For self-hosted, we use a custom header or UUID comparison
function verifyBitbucketWebhook(headers: Headers, secret: string): boolean {
  if (!secret) {
    console.log('[git-webhook] No webhook secret configured, skipping verification');
    return true;
  }
  
  // Bitbucket Cloud sends x-hook-uuid which can be compared
  const hookUuid = headers.get('x-hook-uuid');
  if (hookUuid && secret) {
    const isValid = timingSafeEqual(hookUuid, secret);
    console.log(`[git-webhook] Bitbucket UUID verification: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }
  
  // For Bitbucket Server, check custom authorization header
  const authHeader = headers.get('authorization');
  if (authHeader) {
    const expectedAuth = `Bearer ${secret}`;
    const isValid = timingSafeEqual(authHeader, expectedAuth);
    console.log(`[git-webhook] Bitbucket auth verification: ${isValid ? 'PASS' : 'FAIL'}`);
    return isValid;
  }
  
  console.warn('[git-webhook] No Bitbucket verification headers found');
  return false;
}

// ==================== SMART COMMITS ====================

// Issue key pattern: PROJECT-123
const ISSUE_KEY_PATTERN = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

// Smart commit patterns
const SMART_COMMIT_PATTERNS = {
  comment: /#comment\s+(.+?)(?=#|$)/gi,
  time: /#time\s+(\d+[wdhm](?:\d+[wdhm])*)/gi,
  resolve: /#(resolve|done|close|fixed)\b/gi,
  inProgress: /#(in-progress|start|working)\b/gi,
  reopen: /#reopen\b/gi,
};

interface SmartCommitAction {
  type: 'comment' | 'time' | 'transition';
  value: string;
}

function parseSmartCommits(message: string): SmartCommitAction[] {
  const actions: SmartCommitAction[] = [];
  
  // Parse comments
  let match;
  while ((match = SMART_COMMIT_PATTERNS.comment.exec(message)) !== null) {
    actions.push({ type: 'comment', value: match[1].trim() });
  }
  
  // Parse time
  SMART_COMMIT_PATTERNS.time.lastIndex = 0;
  while ((match = SMART_COMMIT_PATTERNS.time.exec(message)) !== null) {
    actions.push({ type: 'time', value: match[1] });
  }
  
  // Parse transitions
  SMART_COMMIT_PATTERNS.resolve.lastIndex = 0;
  if (SMART_COMMIT_PATTERNS.resolve.test(message)) {
    actions.push({ type: 'transition', value: 'done' });
  }
  
  SMART_COMMIT_PATTERNS.inProgress.lastIndex = 0;
  if (SMART_COMMIT_PATTERNS.inProgress.test(message)) {
    actions.push({ type: 'transition', value: 'in_progress' });
  }
  
  SMART_COMMIT_PATTERNS.reopen.lastIndex = 0;
  if (SMART_COMMIT_PATTERNS.reopen.test(message)) {
    actions.push({ type: 'transition', value: 'todo' });
  }
  
  return actions;
}

function extractIssueKeys(text: string): string[] {
  const matches = text.match(ISSUE_KEY_PATTERN) || [];
  return [...new Set(matches)];
}

// Trigger automation rules for Git events
async function triggerAutomationRules(
  supabase: any,
  triggerType: string,
  eventData: {
    repositoryId?: string;
    projectId?: string;
    issueIds?: string[];
    commitHash?: string;
    prId?: string;
    buildStatus?: string;
    environment?: string;
    provider?: string;
  }
) {
  try {
    console.log(`Looking for automation rules with trigger: ${triggerType}`);
    
    // Find matching automation rules
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching automation rules:', error);
      return;
    }

    if (!rules || rules.length === 0) {
      console.log(`No automation rules found for trigger: ${triggerType}`);
      return;
    }

    console.log(`Found ${rules.length} automation rules for trigger: ${triggerType}`);

    for (const rule of rules) {
      // Check if rule is for specific project
      if (rule.project_id && rule.project_id !== eventData.projectId) {
        console.log(`Skipping rule ${rule.id} - project mismatch`);
        continue;
      }

      // Log the automation execution start
      const { data: logEntry, error: logError } = await supabase
        .from('automation_logs')
        .insert({
          rule_id: rule.id,
          status: 'running',
          trigger_event: {
            trigger_type: triggerType,
            ...eventData,
          },
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Error creating automation log:', logError);
        continue;
      }

      try {
        // Execute actions for each linked issue
        const issueIds = eventData.issueIds || [];
        let actionsExecuted = 0;

        for (const issueId of issueIds) {
          for (const action of rule.actions || []) {
            await executeAutomationAction(supabase, action, issueId, eventData);
            actionsExecuted++;
          }
        }

        // Update log with success
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            result: {
              issues_processed: issueIds.length,
              actions_executed: actionsExecuted,
            },
          })
          .eq('id', logEntry.id);

        console.log(`Rule ${rule.id} executed successfully: ${actionsExecuted} actions on ${issueIds.length} issues`);
      } catch (actionError) {
        // Update log with failure
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
        await supabase
          .from('automation_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: errorMessage,
          })
          .eq('id', logEntry.id);

        console.error(`Rule ${rule.id} failed:`, errorMessage);
      }
    }
  } catch (error) {
    console.error('Error triggering automation rules:', error);
  }
}

// Execute a single automation action
async function executeAutomationAction(
  supabase: any,
  action: any,
  issueId: string,
  eventData: any
) {
  console.log(`Executing action ${action.type} on issue ${issueId}`);

  switch (action.type) {
    case 'transition_issue':
      if (action.status_id) {
        await supabase
          .from('issues')
          .update({ status_id: action.status_id })
          .eq('id', issueId);
      } else if (action.status_category) {
        // Find status by category
        const { data: status } = await supabase
          .from('issue_statuses')
          .select('id')
          .eq('category', action.status_category)
          .limit(1)
          .single();

        if (status) {
          await supabase
            .from('issues')
            .update({ status_id: status.id })
            .eq('id', issueId);
        }
      }
      break;

    case 'add_comment':
      if (action.comment) {
        // Replace placeholders in comment
        let commentBody = action.comment;
        commentBody = commentBody.replace('{{commit_hash}}', eventData.commitHash || 'N/A');
        commentBody = commentBody.replace('{{pr_id}}', eventData.prId || 'N/A');
        commentBody = commentBody.replace('{{build_status}}', eventData.buildStatus || 'N/A');
        commentBody = commentBody.replace('{{environment}}', eventData.environment || 'N/A');

        await supabase.from('comments').insert({
          issue_id: issueId,
          author_id: action.author_id || null,
          body: commentBody,
        });
      }
      break;

    case 'assign_issue':
      if (action.assignee_id) {
        await supabase
          .from('issues')
          .update({ assignee_id: action.assignee_id })
          .eq('id', issueId);
      }
      break;

    case 'set_field':
      if (action.field_name && action.field_value !== undefined) {
        const updateData: Record<string, any> = {};
        updateData[action.field_name] = action.field_value;
        await supabase.from('issues').update(updateData).eq('id', issueId);
      }
      break;

    default:
      console.log(`Unknown action type: ${action.type}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected path: /git-webhook/{provider}/{orgId}
    // After function name extraction, we get: /{provider}/{orgId}
    const provider = pathParts[0];
    const orgId = pathParts[1];

    if (!provider || !orgId) {
      console.error('Missing provider or orgId in path:', url.pathname);
      return new Response(
        JSON.stringify({ error: 'Missing provider or organization ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('git_organizations')
      .select('id, provider_type, webhook_secret')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgId, orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // ==================== SIGNATURE VERIFICATION ====================
    let signatureValid = false;
    const webhookSecret = org.webhook_secret || '';
    
    switch (provider) {
      case 'github':
        signatureValid = await verifyGitHubSignature(rawBody, req.headers, webhookSecret);
        break;
      case 'gitlab':
        signatureValid = verifyGitLabSignature(req.headers, webhookSecret);
        break;
      case 'bitbucket':
        signatureValid = verifyBitbucketWebhook(req.headers, webhookSecret);
        break;
      default:
        console.warn(`[git-webhook] Unknown provider ${provider}, skipping verification`);
        signatureValid = true; // Allow unknown providers to proceed
    }
    
    if (!signatureValid && webhookSecret) {
      console.error(`[git-webhook] Signature verification FAILED for ${provider}`);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[git-webhook] Signature verification: ${signatureValid ? 'PASSED' : 'SKIPPED (no secret)'}`);
    // ================================================================

    // Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[git-webhook] Failed to parse JSON payload:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Received ${provider} webhook for org ${orgId}:`, JSON.stringify(payload).slice(0, 500));

    let result = { processed: false, message: 'Unknown event', verified: signatureValid };

    switch (provider) {
      case 'gitlab':
        result = { ...await handleGitLabWebhook(supabase, org.id, payload, req.headers), verified: signatureValid };
        break;
      case 'github':
        result = { ...await handleGitHubWebhook(supabase, org.id, payload, req.headers), verified: signatureValid };
        break;
      case 'bitbucket':
        result = { ...await handleBitbucketWebhook(supabase, org.id, payload, req.headers), verified: signatureValid };
        break;
      default:
        console.error('Unknown provider:', provider);
        return new Response(
          JSON.stringify({ error: 'Unknown provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Webhook processing result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGitLabWebhook(supabase: any, orgId: string, payload: any, headers: Headers) {
  const eventType = headers.get('x-gitlab-event');
  console.log('GitLab event type:', eventType);

  switch (eventType) {
    case 'Push Hook':
      return await handlePushEvent(supabase, orgId, 'gitlab', payload);
    case 'Merge Request Hook':
      return await handleMergeRequestEvent(supabase, orgId, 'gitlab', payload);
    case 'Pipeline Hook':
      return await handlePipelineEvent(supabase, orgId, 'gitlab', payload);
    case 'Deployment Hook':
      return await handleDeploymentEvent(supabase, orgId, 'gitlab', payload);
    default:
      return { processed: false, message: `Unhandled GitLab event: ${eventType}` };
  }
}

async function handleGitHubWebhook(supabase: any, orgId: string, payload: any, headers: Headers) {
  const eventType = headers.get('x-github-event');
  console.log('GitHub event type:', eventType);

  switch (eventType) {
    case 'push':
      return await handlePushEvent(supabase, orgId, 'github', payload);
    case 'pull_request':
      return await handlePullRequestEvent(supabase, orgId, 'github', payload);
    case 'workflow_run':
    case 'check_run':
      return await handleBuildEvent(supabase, orgId, 'github', payload);
    case 'deployment':
    case 'deployment_status':
      return await handleDeploymentEvent(supabase, orgId, 'github', payload);
    default:
      return { processed: false, message: `Unhandled GitHub event: ${eventType}` };
  }
}

async function handleBitbucketWebhook(supabase: any, orgId: string, payload: any, headers: Headers) {
  const eventType = headers.get('x-event-key');
  console.log('Bitbucket event type:', eventType);

  switch (eventType) {
    case 'repo:push':
      return await handlePushEvent(supabase, orgId, 'bitbucket', payload);
    case 'pullrequest:created':
    case 'pullrequest:updated':
    case 'pullrequest:fulfilled':
    case 'pullrequest:rejected':
      return await handlePullRequestEvent(supabase, orgId, 'bitbucket', payload);
    default:
      return { processed: false, message: `Unhandled Bitbucket event: ${eventType}` };
  }
}

async function handlePushEvent(supabase: any, orgId: string, provider: string, payload: any) {
  let repoSlug = '';
  let commits: any[] = [];
  let repoWebUrl = '';
  let repoName = '';
  let remoteId = '';

  // Normalize payload based on provider
  if (provider === 'gitlab') {
    repoSlug = payload.project?.path_with_namespace || payload.repository?.name || '';
    repoName = payload.project?.name || payload.repository?.name || '';
    repoWebUrl = payload.project?.web_url || payload.repository?.homepage || '';
    remoteId = String(payload.project?.id || payload.project_id || '');
    commits = payload.commits || [];
  } else if (provider === 'github') {
    repoSlug = payload.repository?.full_name || '';
    repoName = payload.repository?.name || '';
    repoWebUrl = payload.repository?.html_url || '';
    remoteId = String(payload.repository?.id || '');
    commits = payload.commits || [];
  } else if (provider === 'bitbucket') {
    repoSlug = payload.repository?.full_name || '';
    repoName = payload.repository?.name || '';
    repoWebUrl = payload.repository?.links?.html?.href || '';
    remoteId = payload.repository?.uuid || '';
    commits = payload.push?.changes?.[0]?.commits || [];
  }

  if (!repoSlug) {
    return { processed: false, message: 'Could not determine repository' };
  }

  // Find or create repository
  let { data: repo, error: repoError } = await supabase
    .from('git_repositories')
    .select('id, project_id, smartcommits_enabled')
    .eq('organization_id', orgId)
    .eq('remote_id', remoteId)
    .single();

  if (repoError || !repo) {
    // Repository not linked yet - just log and skip
    console.log('Repository not linked:', repoSlug);
    return { processed: false, message: 'Repository not linked to any project' };
  }

  let processedCount = 0;
  let linkedIssues: string[] = [];

  for (const commit of commits) {
    // Normalize commit data
    let commitHash = '';
    let authorName = '';
    let authorEmail = '';
    let message = '';
    let committedAt = '';
    let webUrl = '';

    if (provider === 'gitlab') {
      commitHash = commit.id || '';
      authorName = commit.author?.name || '';
      authorEmail = commit.author?.email || '';
      message = commit.message || '';
      committedAt = commit.timestamp || '';
      webUrl = commit.url || '';
    } else if (provider === 'github') {
      commitHash = commit.id || '';
      authorName = commit.author?.name || '';
      authorEmail = commit.author?.email || '';
      message = commit.message || '';
      committedAt = commit.timestamp || '';
      webUrl = commit.url || '';
    } else if (provider === 'bitbucket') {
      commitHash = commit.hash || '';
      authorName = commit.author?.user?.display_name || commit.author?.raw || '';
      authorEmail = commit.author?.user?.email || '';
      message = commit.message || '';
      committedAt = commit.date || '';
      webUrl = commit.links?.html?.href || '';
    }

    if (!commitHash) continue;

    // Insert or update commit
    const { data: commitData, error: commitError } = await supabase
      .from('git_commits')
      .upsert({
        repository_id: repo.id,
        commit_hash: commitHash,
        author_name: authorName,
        author_email: authorEmail,
        message: message,
        committed_at: committedAt,
        web_url: webUrl,
      }, { onConflict: 'commit_hash' })
      .select('id')
      .single();

    if (commitError) {
      console.error('Error inserting commit:', commitError);
      continue;
    }

    // Extract issue keys from commit message
    const issueKeys = extractIssueKeys(message || '');
    
    for (const issueKey of issueKeys) {
      // Find issue by key
      const { data: issue } = await supabase
        .from('issues')
        .select('id')
        .eq('issue_key', issueKey)
        .single();

      if (issue) {
        // Link commit to issue
        await supabase
          .from('git_commit_issues')
          .upsert({
            commit_id: commitData.id,
            issue_id: issue.id,
            issue_key: issueKey,
            smartcommit_processed: false,
          }, { onConflict: 'commit_id,issue_id' });

        linkedIssues.push(issueKey);

        // Process smart commits if enabled
        if (repo.smartcommits_enabled) {
          const actions = parseSmartCommits(message || '');
          
          for (const action of actions) {
            if (action.type === 'comment') {
              // Add comment to issue
              await supabase.from('comments').insert({
                issue_id: issue.id,
                author_id: null, // System comment
                body: `[Git commit ${commitHash.slice(0, 7)}] ${action.value}`,
              });
            } else if (action.type === 'transition') {
              // Find status by category
              const statusCategory = action.value === 'done' ? 'done' 
                : action.value === 'in_progress' ? 'in_progress' 
                : 'todo';
              
              const { data: status } = await supabase
                .from('issue_statuses')
                .select('id')
                .eq('category', statusCategory)
                .limit(1)
                .single();

              if (status) {
                await supabase
                  .from('issues')
                  .update({ status_id: status.id })
                  .eq('id', issue.id);
              }
            }
          }

          // Mark as processed
          await supabase
            .from('git_commit_issues')
            .update({ smartcommit_processed: true })
            .eq('commit_id', commitData.id)
            .eq('issue_id', issue.id);
        }
      }
    }

    processedCount++;
  }

  // Update repository last commit time
  await supabase
    .from('git_repositories')
    .update({ last_commit_at: new Date().toISOString() })
    .eq('id', repo.id);

  // Collect issue IDs for automation
  const linkedIssueIds: string[] = [];
  const uniqueLinkedIssues = new Set(linkedIssues);
  for (const issueKey of uniqueLinkedIssues) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id')
      .eq('issue_key', issueKey)
      .single();
    if (issue) linkedIssueIds.push(issue.id);
  }

  // Trigger automation rules for commit_pushed
  if (linkedIssueIds.length > 0) {
    await triggerAutomationRules(supabase, 'commit_pushed', {
      repositoryId: repo.id,
      projectId: repo.project_id,
      issueIds: linkedIssueIds,
      provider,
    });
  }

  return { 
    processed: true, 
    message: `Processed ${processedCount} commits, linked to issues: ${[...new Set(linkedIssues)].join(', ') || 'none'}` 
  };
}

async function handleMergeRequestEvent(supabase: any, orgId: string, provider: string, payload: any) {
  // GitLab Merge Request
  const mr = payload.object_attributes;
  const project = payload.project;

  if (!mr || !project) {
    return { processed: false, message: 'Invalid merge request payload' };
  }

  // Find repository
  const { data: repo } = await supabase
    .from('git_repositories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('remote_id', String(project.id))
    .single();

  if (!repo) {
    return { processed: false, message: 'Repository not linked' };
  }

  // Map status
  let status = 'open';
  if (mr.state === 'merged') status = 'merged';
  else if (mr.state === 'closed') status = 'closed';

  // Upsert merge request
  const { data: prData, error: prError } = await supabase
    .from('git_pull_requests')
    .upsert({
      repository_id: repo.id,
      remote_id: String(mr.iid),
      title: mr.title,
      description: mr.description,
      author_name: payload.user?.name,
      author_email: payload.user?.email,
      source_branch: mr.source_branch,
      destination_branch: mr.target_branch,
      status: status,
      web_url: mr.url,
      merged_at: mr.merged_at,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'repository_id,remote_id' })
    .select('id')
    .single();

  if (prError) {
    console.error('Error upserting MR:', prError);
    return { processed: false, message: 'Failed to save merge request' };
  }

  // Extract issue keys from title and description
  const text = `${mr.title || ''} ${mr.description || ''} ${mr.source_branch || ''}`;
  const issueKeys = extractIssueKeys(text);

  for (const issueKey of issueKeys) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id')
      .eq('issue_key', issueKey)
      .single();

    if (issue) {
      await supabase
        .from('git_pull_request_issues')
        .upsert({
          pull_request_id: prData.id,
          issue_id: issue.id,
          issue_key: issueKey,
        }, { onConflict: 'pull_request_id,issue_id' });
    }
  }

  // Collect issue IDs for automation
  const linkedIssueIds: string[] = [];
  for (const issueKey of issueKeys) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id')
      .eq('issue_key', issueKey)
      .single();
    if (issue) linkedIssueIds.push(issue.id);
  }

  // Trigger automation rules based on MR state
  if (linkedIssueIds.length > 0) {
    const triggerType = status === 'merged' ? 'pull_request_merged' : 'pull_request_opened';
    await triggerAutomationRules(supabase, triggerType, {
      repositoryId: repo.id,
      projectId: undefined, // GitLab MR doesn't have direct project link here
      issueIds: linkedIssueIds,
      prId: String(mr.iid),
      provider: 'gitlab',
    });
  }

  return { processed: true, message: `Processed MR !${mr.iid}, linked issues: ${issueKeys.join(', ') || 'none'}` };
}

async function handlePullRequestEvent(supabase: any, orgId: string, provider: string, payload: any) {
  let pr: any;
  let repoRemoteId: string;

  if (provider === 'github') {
    pr = payload.pull_request;
    repoRemoteId = String(payload.repository?.id);
  } else if (provider === 'bitbucket') {
    pr = payload.pullrequest;
    repoRemoteId = payload.repository?.uuid;
  } else {
    return { processed: false, message: 'Unknown provider for PR event' };
  }

  if (!pr) {
    return { processed: false, message: 'Invalid pull request payload' };
  }

  // Find repository
  const { data: repo } = await supabase
    .from('git_repositories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('remote_id', repoRemoteId)
    .single();

  if (!repo) {
    return { processed: false, message: 'Repository not linked' };
  }

  // Normalize PR data
  let remoteId: string;
  let title: string;
  let description: string;
  let authorName: string;
  let sourceBranch: string;
  let destBranch: string;
  let status: string;
  let webUrl: string;
  let mergedAt: string | null;

  if (provider === 'github') {
    remoteId = String(pr.number);
    title = pr.title;
    description = pr.body;
    authorName = pr.user?.login;
    sourceBranch = pr.head?.ref;
    destBranch = pr.base?.ref;
    status = pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';
    webUrl = pr.html_url;
    mergedAt = pr.merged_at;
  } else {
    // Bitbucket
    remoteId = String(pr.id);
    title = pr.title;
    description = pr.description;
    authorName = pr.author?.display_name;
    sourceBranch = pr.source?.branch?.name;
    destBranch = pr.destination?.branch?.name;
    status = pr.state?.toLowerCase() === 'merged' ? 'merged' 
      : pr.state?.toLowerCase() === 'declined' ? 'declined' 
      : 'open';
    webUrl = pr.links?.html?.href;
    mergedAt = null;
  }

  const { data: prData, error: prError } = await supabase
    .from('git_pull_requests')
    .upsert({
      repository_id: repo.id,
      remote_id: remoteId,
      title,
      description,
      author_name: authorName,
      source_branch: sourceBranch,
      destination_branch: destBranch,
      status,
      web_url: webUrl,
      merged_at: mergedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'repository_id,remote_id' })
    .select('id')
    .single();

  if (prError) {
    console.error('Error upserting PR:', prError);
    return { processed: false, message: 'Failed to save pull request' };
  }

  // Extract issue keys
  const text = `${title || ''} ${description || ''} ${sourceBranch || ''}`;
  const issueKeys = extractIssueKeys(text);

  for (const issueKey of issueKeys) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id')
      .eq('issue_key', issueKey)
      .single();

    if (issue) {
      await supabase
        .from('git_pull_request_issues')
        .upsert({
          pull_request_id: prData.id,
          issue_id: issue.id,
          issue_key: issueKey,
        }, { onConflict: 'pull_request_id,issue_id' });
    }
  }

  // Collect issue IDs for automation
  const linkedIssueIds: string[] = [];
  for (const issueKey of issueKeys) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id')
      .eq('issue_key', issueKey)
      .single();
    if (issue) linkedIssueIds.push(issue.id);
  }

  // Trigger automation rules based on PR state
  if (linkedIssueIds.length > 0) {
    const triggerType = status === 'merged' ? 'pull_request_merged' : 'pull_request_opened';
    await triggerAutomationRules(supabase, triggerType, {
      repositoryId: repo.id,
      issueIds: linkedIssueIds,
      prId: remoteId,
      provider,
    });
  }

  return { processed: true, message: `Processed PR #${remoteId}, linked issues: ${issueKeys.join(', ') || 'none'}` };
}

async function handlePipelineEvent(supabase: any, orgId: string, provider: string, payload: any) {
  // GitLab Pipeline
  const pipeline = payload.object_attributes;
  const project = payload.project;

  if (!pipeline || !project) {
    return { processed: false, message: 'Invalid pipeline payload' };
  }

  const { data: repo } = await supabase
    .from('git_repositories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('remote_id', String(project.id))
    .single();

  if (!repo) {
    return { processed: false, message: 'Repository not linked' };
  }

  // Find commit
  const { data: commit } = await supabase
    .from('git_commits')
    .select('id')
    .eq('repository_id', repo.id)
    .eq('commit_hash', pipeline.sha)
    .single();

  // Map status
  let status = 'pending';
  if (pipeline.status === 'running') status = 'running';
  else if (pipeline.status === 'success') status = 'success';
  else if (pipeline.status === 'failed') status = 'failed';
  else if (pipeline.status === 'canceled') status = 'canceled';

  await supabase
    .from('git_builds')
    .upsert({
      repository_id: repo.id,
      commit_id: commit?.id,
      remote_id: String(pipeline.id),
      build_number: String(pipeline.id),
      pipeline_name: pipeline.ref,
      status,
      web_url: `${project.web_url}/-/pipelines/${pipeline.id}`,
      started_at: pipeline.created_at,
      finished_at: pipeline.finished_at,
      duration_seconds: pipeline.duration,
    }, { onConflict: 'repository_id,remote_id' });

  // Trigger automation rules for build events
  if (commit && (status === 'success' || status === 'failed')) {
    // Get issues linked to this commit
    const { data: commitIssues } = await supabase
      .from('git_commit_issues')
      .select('issue_id')
      .eq('commit_id', commit.id);

    const issueIds = (commitIssues || []).map((ci: any) => ci.issue_id);
    
    if (issueIds.length > 0) {
      const triggerType = status === 'failed' ? 'build_failed' : 'build_completed';
      await triggerAutomationRules(supabase, triggerType, {
        repositoryId: repo.id,
        issueIds,
        buildStatus: status,
        provider: 'gitlab',
      });
    }
  }

  return { processed: true, message: `Processed pipeline #${pipeline.id} with status ${status}` };
}

async function handleBuildEvent(supabase: any, orgId: string, provider: string, payload: any) {
  // GitHub workflow_run or check_run
  const run = payload.workflow_run || payload.check_run;
  const repoRemoteId = String(payload.repository?.id);

  if (!run) {
    return { processed: false, message: 'Invalid build payload' };
  }

  const { data: repo } = await supabase
    .from('git_repositories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('remote_id', repoRemoteId)
    .single();

  if (!repo) {
    return { processed: false, message: 'Repository not linked' };
  }

  // Find commit
  const commitHash = run.head_sha || run.head_commit?.id;
  const { data: commit } = await supabase
    .from('git_commits')
    .select('id')
    .eq('repository_id', repo.id)
    .eq('commit_hash', commitHash)
    .single();

  // Map status
  let status = 'pending';
  const conclusion = run.conclusion?.toLowerCase();
  if (run.status === 'in_progress') status = 'running';
  else if (conclusion === 'success') status = 'success';
  else if (conclusion === 'failure') status = 'failed';
  else if (conclusion === 'cancelled') status = 'canceled';

  await supabase
    .from('git_builds')
    .upsert({
      repository_id: repo.id,
      commit_id: commit?.id,
      remote_id: String(run.id),
      build_number: String(run.run_number || run.id),
      pipeline_name: run.name,
      status,
      web_url: run.html_url,
      started_at: run.started_at || run.created_at,
      finished_at: run.completed_at,
    }, { onConflict: 'repository_id,remote_id' });

  // Trigger automation rules for build events
  if (commit && (status === 'success' || status === 'failed')) {
    // Get issues linked to this commit
    const { data: commitIssues } = await supabase
      .from('git_commit_issues')
      .select('issue_id')
      .eq('commit_id', commit.id);

    const issueIds = (commitIssues || []).map((ci: any) => ci.issue_id);
    
    if (issueIds.length > 0) {
      const triggerType = status === 'failed' ? 'build_failed' : 'build_completed';
      await triggerAutomationRules(supabase, triggerType, {
        repositoryId: repo.id,
        issueIds,
        buildStatus: status,
        provider,
      });
    }
  }

  return { processed: true, message: `Processed build #${run.id} with status ${status}` };
}

async function handleDeploymentEvent(supabase: any, orgId: string, provider: string, payload: any) {
  let deployment: any;
  let repoRemoteId: string;
  let environment: string;
  let status: string;
  let webUrl: string;
  let commitHash: string;

  if (provider === 'gitlab') {
    deployment = payload.object_attributes || payload;
    repoRemoteId = String(payload.project?.id);
    environment = deployment.environment || 'production';
    status = deployment.status === 'success' ? 'success' 
      : deployment.status === 'failed' ? 'failed' 
      : 'pending';
    webUrl = deployment.deployable_url || `${payload.project?.web_url}/-/environments`;
    commitHash = deployment.sha;
  } else if (provider === 'github') {
    deployment = payload.deployment;
    const deploymentStatus = payload.deployment_status;
    repoRemoteId = String(payload.repository?.id);
    environment = deployment?.environment || 'production';
    status = deploymentStatus?.state === 'success' ? 'success'
      : deploymentStatus?.state === 'failure' ? 'failed'
      : deploymentStatus?.state === 'in_progress' ? 'in_progress'
      : 'pending';
    webUrl = deploymentStatus?.target_url || deployment?.url;
    commitHash = deployment?.sha;
  } else {
    return { processed: false, message: 'Unsupported provider for deployment' };
  }

  const { data: repo } = await supabase
    .from('git_repositories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('remote_id', repoRemoteId)
    .single();

  if (!repo) {
    return { processed: false, message: 'Repository not linked' };
  }

  // Find commit
  const { data: commit } = await supabase
    .from('git_commits')
    .select('id')
    .eq('repository_id', repo.id)
    .eq('commit_hash', commitHash)
    .single();

  const { data: deployData, error } = await supabase
    .from('git_deployments')
    .upsert({
      repository_id: repo.id,
      commit_id: commit?.id,
      remote_id: String(deployment?.id || Date.now()),
      environment,
      status,
      web_url: webUrl,
      deployed_at: new Date().toISOString(),
    }, { onConflict: 'repository_id,remote_id' })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving deployment:', error);
    return { processed: false, message: 'Failed to save deployment' };
  }

  // Link to issues via commit and trigger automation
  const linkedIssueIds: string[] = [];
  if (commit) {
    const { data: commitIssues } = await supabase
      .from('git_commit_issues')
      .select('issue_id, issue_key')
      .eq('commit_id', commit.id);

    for (const ci of commitIssues || []) {
      await supabase
        .from('git_deployment_issues')
        .upsert({
          deployment_id: deployData.id,
          issue_id: ci.issue_id,
          issue_key: ci.issue_key,
        }, { onConflict: 'deployment_id,issue_id' });
      linkedIssueIds.push(ci.issue_id);
    }
  }

  // Trigger automation rules for deployment_completed
  if (linkedIssueIds.length > 0 && status === 'success') {
    await triggerAutomationRules(supabase, 'deployment_completed', {
      repositoryId: repo.id,
      issueIds: linkedIssueIds,
      environment,
      provider,
    });
  }

  return { processed: true, message: `Processed deployment to ${environment} with status ${status}` };
}
