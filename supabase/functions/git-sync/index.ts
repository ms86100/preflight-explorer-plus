import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  organization_id: string;
  organization_name: string;
  repositories_synced: number;
  commits_added: number;
  branches_updated: number;
  pull_requests_updated: number;
  builds_updated: number;
  errors: string[];
}

// Fetch recent commits from GitHub
async function syncGitHubCommits(
  supabase: any,
  accessToken: string,
  repositoryId: string,
  owner: string,
  repo: string,
  since?: string
): Promise<number> {
  let addedCount = 0;
  const sinceParam = since ? `&since=${since}` : '';
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100${sinceParam}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) return 0;

  const commits = await response.json();
  
  for (const commit of commits) {
    // Check if commit already exists
    const { data: existing } = await supabase
      .from('git_commits')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('commit_hash', commit.sha)
      .single();

    if (!existing) {
      const { error } = await supabase.from('git_commits').insert({
        repository_id: repositoryId,
        commit_hash: commit.sha,
        author_name: commit.commit?.author?.name,
        author_email: commit.commit?.author?.email,
        message: commit.commit?.message,
        committed_at: commit.commit?.author?.date,
        web_url: commit.html_url,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        files_changed: commit.files?.length || 0,
      });

      if (!error) addedCount++;
    }
  }

  return addedCount;
}

// Fetch recent commits from GitLab
async function syncGitLabCommits(
  supabase: any,
  hostUrl: string,
  accessToken: string,
  repositoryId: string,
  projectPath: string,
  since?: string
): Promise<number> {
  let addedCount = 0;
  const sinceParam = since ? `&since=${since}` : '';
  
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/commits?per_page=100${sinceParam}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return 0;

  const commits = await response.json();
  
  for (const commit of commits) {
    const { data: existing } = await supabase
      .from('git_commits')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('commit_hash', commit.id)
      .single();

    if (!existing) {
      const { error } = await supabase.from('git_commits').insert({
        repository_id: repositoryId,
        commit_hash: commit.id,
        author_name: commit.author_name,
        author_email: commit.author_email,
        message: commit.message,
        committed_at: commit.committed_date,
        web_url: commit.web_url,
      });

      if (!error) addedCount++;
    }
  }

  return addedCount;
}

// Fetch branches from GitHub
async function syncGitHubBranches(
  supabase: any,
  accessToken: string,
  repositoryId: string,
  owner: string,
  repo: string
): Promise<number> {
  let updatedCount = 0;
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) return 0;

  const branches = await response.json();
  
  for (const branch of branches) {
    const { data: existing } = await supabase
      .from('git_branches')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('name', branch.name)
      .single();

    if (existing) {
      await supabase
        .from('git_branches')
        .update({
          last_commit_hash: branch.commit?.sha,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('git_branches').insert({
        repository_id: repositoryId,
        name: branch.name,
        last_commit_hash: branch.commit?.sha,
        web_url: `https://github.com/${owner}/${repo}/tree/${branch.name}`,
        is_default: branch.name === 'main' || branch.name === 'master',
      });
    }
    updatedCount++;
  }

  return updatedCount;
}

// Fetch branches from GitLab
async function syncGitLabBranches(
  supabase: any,
  hostUrl: string,
  accessToken: string,
  repositoryId: string,
  projectPath: string,
  webUrl: string
): Promise<number> {
  let updatedCount = 0;
  
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/repository/branches?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return 0;

  const branches = await response.json();
  
  for (const branch of branches) {
    const { data: existing } = await supabase
      .from('git_branches')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('name', branch.name)
      .single();

    if (existing) {
      await supabase
        .from('git_branches')
        .update({
          last_commit_hash: branch.commit?.id,
          last_commit_at: branch.commit?.committed_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('git_branches').insert({
        repository_id: repositoryId,
        name: branch.name,
        last_commit_hash: branch.commit?.id,
        last_commit_at: branch.commit?.committed_date,
        web_url: `${webUrl}/-/tree/${branch.name}`,
        is_default: branch.default,
      });
    }
    updatedCount++;
  }

  return updatedCount;
}

// Fetch pull requests from GitHub
async function syncGitHubPullRequests(
  supabase: any,
  accessToken: string,
  repositoryId: string,
  owner: string,
  repo: string
): Promise<number> {
  let updatedCount = 0;
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) return 0;

  const prs = await response.json();
  
  for (const pr of prs) {
    let status: string;
    if (pr.merged_at) {
      status = 'merged';
    } else if (pr.state === 'closed') {
      status = 'closed';
    } else {
      status = 'open';
    }
    
    const { data: existing } = await supabase
      .from('git_pull_requests')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('remote_id', String(pr.number))
      .single();

    const prData = {
      title: pr.title,
      description: pr.body,
      author_name: pr.user?.login,
      source_branch: pr.head?.ref,
      destination_branch: pr.base?.ref,
      status,
      web_url: pr.html_url,
      merged_at: pr.merged_at,
      reviewers: pr.requested_reviewers?.map((r: any) => ({ name: r.login })) || [],
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('git_pull_requests')
        .update(prData)
        .eq('id', existing.id);
    } else {
      await supabase.from('git_pull_requests').insert({
        repository_id: repositoryId,
        remote_id: String(pr.number),
        ...prData,
      });
    }
    updatedCount++;
  }

  return updatedCount;
}

// Fetch merge requests from GitLab
async function syncGitLabMergeRequests(
  supabase: any,
  hostUrl: string,
  accessToken: string,
  repositoryId: string,
  projectPath: string
): Promise<number> {
  let updatedCount = 0;
  
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/merge_requests?state=all&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return 0;

  const mrs = await response.json();
  
  for (const mr of mrs) {
    let status: string;
    if (mr.state === 'merged') {
      status = 'merged';
    } else if (mr.state === 'closed') {
      status = 'closed';
    } else {
      status = 'open';
    }
    
    const { data: existing } = await supabase
      .from('git_pull_requests')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('remote_id', String(mr.iid))
      .single();

    const mrData = {
      title: mr.title,
      description: mr.description,
      author_name: mr.author?.username,
      author_email: mr.author?.email,
      source_branch: mr.source_branch,
      destination_branch: mr.target_branch,
      status,
      web_url: mr.web_url,
      merged_at: mr.merged_at,
      reviewers: mr.reviewers?.map((r: any) => ({ name: r.username })) || [],
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('git_pull_requests')
        .update(mrData)
        .eq('id', existing.id);
    } else {
      await supabase.from('git_pull_requests').insert({
        repository_id: repositoryId,
        remote_id: String(mr.iid),
        ...mrData,
      });
    }
    updatedCount++;
  }

  return updatedCount;
}

// Fetch pipelines/builds from GitLab
async function syncGitLabPipelines(
  supabase: any,
  hostUrl: string,
  accessToken: string,
  repositoryId: string,
  projectPath: string
): Promise<number> {
  let updatedCount = 0;
  
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/pipelines?per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return 0;

  const pipelines = await response.json();
  
  for (const pipeline of pipelines) {
    const { data: existing } = await supabase
      .from('git_builds')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('remote_id', String(pipeline.id))
      .single();

    const statusMap: Record<string, string> = {
      pending: 'pending',
      running: 'running',
      success: 'success',
      failed: 'failed',
      canceled: 'canceled',
      skipped: 'canceled',
    };

    const buildData = {
      build_number: String(pipeline.id),
      pipeline_name: pipeline.ref,
      status: statusMap[pipeline.status] || 'pending',
      web_url: pipeline.web_url,
      started_at: pipeline.started_at,
      finished_at: pipeline.finished_at,
      duration_seconds: pipeline.duration,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('git_builds')
        .update(buildData)
        .eq('id', existing.id);
    } else {
      await supabase.from('git_builds').insert({
        repository_id: repositoryId,
        remote_id: String(pipeline.id),
        ...buildData,
      });
    }
    updatedCount++;
  }

  return updatedCount;
}

// Main sync function for an organization
async function syncOrganization(supabase: any, org: any): Promise<SyncResult> {
  const result: SyncResult = {
    organization_id: org.id,
    organization_name: org.name,
    repositories_synced: 0,
    commits_added: 0,
    branches_updated: 0,
    pull_requests_updated: 0,
    builds_updated: 0,
    errors: [],
  };

  if (!org.access_token_encrypted) {
    result.errors.push('No access token configured');
    return result;
  }

  // Get linked repositories for this organization
  const { data: repos, error: reposError } = await supabase
    .from('git_repositories')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_active', true);

  if (reposError) {
    result.errors.push(`Failed to fetch repositories: ${reposError.message}`);
    return result;
  }

  for (const repo of repos || []) {
    try {
      // Calculate since date (last sync or 30 days ago)
      const sinceDate = repo.last_commit_at 
        ? new Date(repo.last_commit_at).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      if (org.provider_type === 'github') {
        const [owner, repoName] = repo.slug.split('/');
        
        result.commits_added += await syncGitHubCommits(
          supabase, org.access_token_encrypted, repo.id, owner, repoName, sinceDate
        );
        result.branches_updated += await syncGitHubBranches(
          supabase, org.access_token_encrypted, repo.id, owner, repoName
        );
        result.pull_requests_updated += await syncGitHubPullRequests(
          supabase, org.access_token_encrypted, repo.id, owner, repoName
        );
      } else if (org.provider_type === 'gitlab') {
        result.commits_added += await syncGitLabCommits(
          supabase, org.host_url, org.access_token_encrypted, repo.id, repo.slug, sinceDate
        );
        result.branches_updated += await syncGitLabBranches(
          supabase, org.host_url, org.access_token_encrypted, repo.id, repo.slug, repo.web_url
        );
        result.pull_requests_updated += await syncGitLabMergeRequests(
          supabase, org.host_url, org.access_token_encrypted, repo.id, repo.slug
        );
        result.builds_updated += await syncGitLabPipelines(
          supabase, org.host_url, org.access_token_encrypted, repo.id, repo.slug
        );
      }

      // Update last_commit_at on repository
      await supabase
        .from('git_repositories')
        .update({ last_commit_at: new Date().toISOString() })
        .eq('id', repo.id);

      result.repositories_synced++;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to sync ${repo.name}: ${errorMessage}`);
    }
  }

  // Update organization sync status
  await supabase
    .from('git_organizations')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: result.errors.length > 0 ? result.errors.join('; ') : null,
    })
    .eq('id', org.id);

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // POST /git-sync/organization - Sync a single organization
    if (req.method === 'POST' && action === 'organization') {
      const { organization_id } = await req.json();

      console.log(`[git-sync] Starting sync for organization ${organization_id}`);

      const { data: org, error: orgError } = await supabase
        .from('git_organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      if (orgError || !org) {
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await syncOrganization(supabase, org);

      console.log(`[git-sync] Sync completed:`, result);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-sync/all - Sync all active organizations (for scheduled jobs)
    if (req.method === 'POST' && action === 'all') {
      console.log('[git-sync] Starting full sync of all organizations');

      const { data: orgs, error: orgsError } = await supabase
        .from('git_organizations')
        .select('*')
        .eq('is_active', true);

      if (orgsError) {
        throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
      }

      const results: SyncResult[] = [];

      for (const org of orgs || []) {
        try {
          const result = await syncOrganization(supabase, org);
          results.push(result);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            organization_id: org.id,
            organization_name: org.name,
            repositories_synced: 0,
            commits_added: 0,
            branches_updated: 0,
            pull_requests_updated: 0,
            builds_updated: 0,
            errors: [errorMessage],
          });
        }
      }

      const summary = {
        organizations_synced: results.length,
        total_repositories: results.reduce((sum, r) => sum + r.repositories_synced, 0),
        total_commits: results.reduce((sum, r) => sum + r.commits_added, 0),
        total_branches: results.reduce((sum, r) => sum + r.branches_updated, 0),
        total_prs: results.reduce((sum, r) => sum + r.pull_requests_updated, 0),
        total_builds: results.reduce((sum, r) => sum + r.builds_updated, 0),
        errors: results.flatMap(r => r.errors),
        details: results,
      };

      console.log('[git-sync] Full sync completed:', summary);

      return new Response(
        JSON.stringify(summary),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[git-sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
