import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo mode constants - must match git-demo-seed
const DEMO_ORG_ID = 'de000000-0000-0000-0000-000000000001';
const DEMO_MODE_TOKEN = 'DEMO_MODE_TOKEN';

function isDemoOrganization(org: { id?: string; access_token_encrypted?: string | null }): boolean {
  return org.id === DEMO_ORG_ID || org.access_token_encrypted === DEMO_MODE_TOKEN;
}

interface GitRepository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  web_url: string;
  clone_url?: string;
  default_branch: string;
  private: boolean;
}

// Fetch repositories from GitHub
async function fetchGitHubRepos(accessToken: string, page = 1, perPage = 100): Promise<GitRepository[]> {
  const response = await fetch(
    `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[git-api] GitHub repos fetch failed:', errorText);
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos = await response.json();
  return repos.map((repo: any) => ({
    id: String(repo.id),
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    web_url: repo.html_url,
    clone_url: repo.clone_url,
    default_branch: repo.default_branch,
    private: repo.private,
  }));
}

// Fetch repositories from GitLab
async function fetchGitLabRepos(hostUrl: string, accessToken: string, page = 1, perPage = 100): Promise<GitRepository[]> {
  const response = await fetch(
    `${hostUrl}/api/v4/projects?membership=true&per_page=${perPage}&page=${page}&order_by=updated_at`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[git-api] GitLab repos fetch failed:', errorText);
    throw new Error(`GitLab API error: ${response.status}`);
  }

  const repos = await response.json();
  return repos.map((repo: any) => ({
    id: String(repo.id),
    name: repo.name,
    full_name: repo.path_with_namespace,
    description: repo.description,
    web_url: repo.web_url,
    clone_url: repo.http_url_to_repo,
    default_branch: repo.default_branch || 'main',
    private: repo.visibility === 'private',
  }));
}

// Fetch repositories from Bitbucket
async function fetchBitbucketRepos(accessToken: string, page = 1, perPage = 100): Promise<GitRepository[]> {
  // First get workspaces
  const workspacesResponse = await fetch(
    'https://api.bitbucket.org/2.0/user/permissions/workspaces',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!workspacesResponse.ok) {
    const errorText = await workspacesResponse.text();
    console.error('[git-api] Bitbucket workspaces fetch failed:', errorText);
    throw new Error(`Bitbucket API error: ${workspacesResponse.status}`);
  }

  const workspacesData = await workspacesResponse.json();
  const allRepos: GitRepository[] = [];

  // Fetch repos from each workspace
  for (const ws of workspacesData.values || []) {
    const workspace = ws.workspace?.slug;
    if (!workspace) continue;

    const reposResponse = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${workspace}?pagelen=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (reposResponse.ok) {
      const reposData = await reposResponse.json();
      for (const repo of reposData.values || []) {
        allRepos.push({
          id: repo.uuid,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          web_url: repo.links?.html?.href || '',
          clone_url: repo.links?.clone?.find((c: any) => c.name === 'https')?.href,
          default_branch: repo.mainbranch?.name || 'main',
          private: repo.is_private,
        });
      }
    }
  }

  return allRepos;
}

// Create a branch in GitHub
async function createGitHubBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  fromBranch: string
): Promise<{ success: boolean; web_url?: string; error?: string }> {
  // Get the SHA of the source branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!refResponse.ok) {
    return { success: false, error: `Source branch not found: ${fromBranch}` };
  }

  const refData = await refResponse.json();
  const sha = refData.object.sha;

  // Create the new branch
  const createResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha,
      }),
    }
  );

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    return { success: false, error: errorData.message || 'Failed to create branch' };
  }

  return {
    success: true,
    web_url: `https://github.com/${owner}/${repo}/tree/${branchName}`,
  };
}

// Create a branch in GitLab
async function createGitLabBranch(
  hostUrl: string,
  accessToken: string,
  projectId: string,
  branchName: string,
  fromBranch: string
): Promise<{ success: boolean; web_url?: string; error?: string }> {
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: branchName,
        ref: fromBranch,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || 'Failed to create branch' };
  }

  const branchData = await response.json();
  return {
    success: true,
    web_url: branchData.web_url,
  };
}

// Create a branch in Bitbucket
async function createBitbucketBranch(
  accessToken: string,
  workspace: string,
  repoSlug: string,
  branchName: string,
  fromBranch: string
): Promise<{ success: boolean; web_url?: string; error?: string }> {
  // First get the commit hash of the source branch
  const refResponse = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/refs/branches/${fromBranch}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!refResponse.ok) {
    return { success: false, error: `Source branch not found: ${fromBranch}` };
  }

  const refData = await refResponse.json();
  const commitHash = refData.target?.hash;

  if (!commitHash) {
    return { success: false, error: 'Could not get commit hash from source branch' };
  }

  // Create the new branch
  const createResponse = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/refs/branches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: branchName,
        target: {
          hash: commitHash,
        },
      }),
    }
  );

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    return { success: false, error: errorData.error?.message || 'Failed to create branch' };
  }

  const branchData = await createResponse.json();
  return {
    success: true,
    web_url: branchData.links?.html?.href || `https://bitbucket.org/${workspace}/${repoSlug}/branch/${branchName}`,
  };
}

// Create a pull request in GitHub
async function createGitHubPR(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  headBranch: string,
  baseBranch: string
): Promise<{ success: boolean; web_url?: string; pr_id?: string; error?: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || 'Failed to create PR' };
  }

  const prData = await response.json();
  return {
    success: true,
    web_url: prData.html_url,
    pr_id: String(prData.number),
  };
}

// Create a merge request in GitLab
async function createGitLabMR(
  hostUrl: string,
  accessToken: string,
  projectId: string,
  title: string,
  description: string,
  sourceBranch: string,
  targetBranch: string
): Promise<{ success: boolean; web_url?: string; mr_id?: string; error?: string }> {
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        source_branch: sourceBranch,
        target_branch: targetBranch,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || 'Failed to create MR' };
  }

  const mrData = await response.json();
  return {
    success: true,
    web_url: mrData.web_url,
    mr_id: String(mrData.iid),
  };
}

// Create a pull request in Bitbucket
async function createBitbucketPR(
  accessToken: string,
  workspace: string,
  repoSlug: string,
  title: string,
  description: string,
  sourceBranch: string,
  destinationBranch: string
): Promise<{ success: boolean; web_url?: string; pr_id?: string; error?: string }> {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        source: {
          branch: {
            name: sourceBranch,
          },
        },
        destination: {
          branch: {
            name: destinationBranch,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.error?.message || 'Failed to create PR' };
  }

  const prData = await response.json();
  return {
    success: true,
    web_url: prData.links?.html?.href,
    pr_id: String(prData.id),
  };
}

// Trigger a GitHub Actions workflow
async function triggerGitHubWorkflow(
  accessToken: string,
  owner: string,
  repo: string,
  workflowId: string,
  ref: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || 'Failed to trigger workflow' };
  }

  return { success: true };
}

// Trigger a GitLab pipeline
async function triggerGitLabPipeline(
  hostUrl: string,
  accessToken: string,
  projectId: string,
  ref: string
): Promise<{ success: boolean; pipeline_id?: string; web_url?: string; error?: string }> {
  const response = await fetch(
    `${hostUrl}/api/v4/projects/${encodeURIComponent(projectId)}/pipeline`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || 'Failed to trigger pipeline' };
  }

  const pipelineData = await response.json();
  return {
    success: true,
    pipeline_id: String(pipelineData.id),
    web_url: pipelineData.web_url,
  };
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

    // POST /git-api/repositories - List repositories from a Git organization
    if (req.method === 'POST' && action === 'repositories') {
      const { organization_id } = await req.json();

      console.log(`[git-api] Fetching repositories for organization ${organization_id}`);

      // Get organization details
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

      if (!org.access_token_encrypted) {
        return new Response(
          JSON.stringify({ error: 'No access token configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Demo mode: return mock repositories
      if (isDemoOrganization(org)) {
        console.log('[git-api] Demo mode: returning mock repositories');
        const mockRepos: GitRepository[] = [
          { id: 'demo-1', name: 'demo-project', full_name: 'demo-org/demo-project', web_url: 'https://github.com/demo-org/demo-project', default_branch: 'main', private: false, description: 'Demo project for testing' },
          { id: 'demo-2', name: 'frontend-app', full_name: 'demo-org/frontend-app', web_url: 'https://github.com/demo-org/frontend-app', default_branch: 'main', private: true, description: 'Frontend application' },
          { id: 'demo-3', name: 'api-service', full_name: 'demo-org/api-service', web_url: 'https://github.com/demo-org/api-service', default_branch: 'develop', private: true, description: 'Backend API service' },
        ];
        return new Response(
          JSON.stringify({ repositories: mockRepos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let repos: GitRepository[] = [];

      if (org.provider_type === 'github') {
        repos = await fetchGitHubRepos(org.access_token_encrypted);
      } else if (org.provider_type === 'gitlab') {
        repos = await fetchGitLabRepos(org.host_url, org.access_token_encrypted);
      } else if (org.provider_type === 'bitbucket') {
        repos = await fetchBitbucketRepos(org.access_token_encrypted);
      }

      console.log(`[git-api] Found ${repos.length} repositories`);

      return new Response(
        JSON.stringify({ repositories: repos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-api/create-branch - Create a branch
    if (req.method === 'POST' && action === 'create-branch') {
      const { organization_id, repository_slug, branch_name, from_branch } = await req.json();

      console.log(`[git-api] Creating branch ${branch_name} from ${from_branch}`);

      const { data: org } = await supabase
        .from('git_organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      if (!org?.access_token_encrypted) {
        return new Response(
          JSON.stringify({ error: 'Organization not found or no access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Demo mode: return mock success
      if (isDemoOrganization(org)) {
        console.log('[git-api] Demo mode: mock branch creation');
        return new Response(
          JSON.stringify({ success: true, web_url: `https://github.com/demo-org/demo-repo/tree/${branch_name}`, demo: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let result;
      if (org.provider_type === 'github') {
        const [owner, repo] = repository_slug.split('/');
        result = await createGitHubBranch(org.access_token_encrypted, owner, repo, branch_name, from_branch);
      } else if (org.provider_type === 'gitlab') {
        result = await createGitLabBranch(org.host_url, org.access_token_encrypted, repository_slug, branch_name, from_branch);
      } else if (org.provider_type === 'bitbucket') {
        // Bitbucket slug format: workspace/repo-slug
        const [workspace, repoSlug] = repository_slug.split('/');
        result = await createBitbucketBranch(org.access_token_encrypted, workspace, repoSlug, branch_name, from_branch);
      } else {
        return new Response(
          JSON.stringify({ error: 'Branch creation not supported for this provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-api/create-pr - Create a pull request
    if (req.method === 'POST' && action === 'create-pr') {
      const { organization_id, repository_slug, title, body, head_branch, base_branch } = await req.json();

      console.log(`[git-api] Creating PR: ${title}`);

      const { data: org } = await supabase
        .from('git_organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      if (!org?.access_token_encrypted) {
        return new Response(
          JSON.stringify({ error: 'Organization not found or no access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Demo mode: return mock success
      if (isDemoOrganization(org)) {
        console.log('[git-api] Demo mode: mock PR creation');
        return new Response(
          JSON.stringify({ success: true, web_url: `https://github.com/demo-org/demo-repo/pull/99`, pr_id: '99', demo: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let result;
      if (org.provider_type === 'github') {
        const [owner, repo] = repository_slug.split('/');
        result = await createGitHubPR(org.access_token_encrypted, owner, repo, title, body, head_branch, base_branch);
      } else if (org.provider_type === 'gitlab') {
        result = await createGitLabMR(org.host_url, org.access_token_encrypted, repository_slug, title, body, head_branch, base_branch);
      } else if (org.provider_type === 'bitbucket') {
        const [workspace, repoSlug] = repository_slug.split('/');
        result = await createBitbucketPR(org.access_token_encrypted, workspace, repoSlug, title, body, head_branch, base_branch);
      } else {
        return new Response(
          JSON.stringify({ error: 'PR creation not supported for this provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /git-api/trigger-build - Trigger a CI/CD pipeline
    if (req.method === 'POST' && action === 'trigger-build') {
      const { organization_id, repository_slug, ref, workflow_id } = await req.json();

      console.log(`[git-api] Triggering build for ref ${ref}`);

      const { data: org } = await supabase
        .from('git_organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      if (!org?.access_token_encrypted) {
        return new Response(
          JSON.stringify({ error: 'Organization not found or no access token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let result;
      if (org.provider_type === 'github') {
        const [owner, repo] = repository_slug.split('/');
        result = await triggerGitHubWorkflow(org.access_token_encrypted, owner, repo, workflow_id || 'ci.yml', ref);
      } else if (org.provider_type === 'gitlab') {
        result = await triggerGitLabPipeline(org.host_url, org.access_token_encrypted, repository_slug, ref);
      } else {
        return new Response(
          JSON.stringify({ error: 'Build trigger not supported for this provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[git-api] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
