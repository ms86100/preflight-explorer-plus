import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo data constants - using valid UUIDs with recognizable pattern
const DEMO_ORG_ID = 'de000000-0000-0000-0000-000000000001';
const DEMO_REPO_ID = 'de000000-0000-0000-0000-000000000002';

const DEMO_COMMITS = [
  {
    id: 'de000000-0000-0000-0001-000000000001',
    commit_hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    message: 'DEMO-1 feat: Add user authentication module',
    author_name: 'Alice Developer',
    author_email: 'alice@example.com',
    committed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    additions: 245,
    deletions: 12,
    files_changed: 8,
    web_url: 'https://github.com/demo-org/demo-repo/commit/a1b2c3d',
  },
  {
    id: 'de000000-0000-0000-0001-000000000002',
    commit_hash: 'b2c3d4e5f6789012345678901234567890abcde',
    message: 'DEMO-1 #time 2h fix: Resolve login timeout issue',
    author_name: 'Bob Engineer',
    author_email: 'bob@example.com',
    committed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    additions: 32,
    deletions: 15,
    files_changed: 3,
    web_url: 'https://github.com/demo-org/demo-repo/commit/b2c3d4e',
  },
  {
    id: 'de000000-0000-0000-0001-000000000003',
    commit_hash: 'c3d4e5f6789012345678901234567890abcdef',
    message: 'DEMO-2 chore: Update dependencies and security patches',
    author_name: 'Charlie DevOps',
    author_email: 'charlie@example.com',
    committed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    additions: 890,
    deletions: 456,
    files_changed: 2,
    web_url: 'https://github.com/demo-org/demo-repo/commit/c3d4e5f',
  },
  {
    id: 'de000000-0000-0000-0001-000000000004',
    commit_hash: 'd4e5f6789012345678901234567890abcdef01',
    message: 'DEMO-3 feat: Implement dashboard analytics #resolve',
    author_name: 'Diana PM',
    author_email: 'diana@example.com',
    committed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    additions: 567,
    deletions: 89,
    files_changed: 12,
    web_url: 'https://github.com/demo-org/demo-repo/commit/d4e5f67',
  },
];

const DEMO_BRANCHES = [
  {
    id: 'de000000-0000-0000-0002-000000000001',
    name: 'feature/DEMO-1-user-auth',
    is_default: false,
    last_commit_hash: 'b2c3d4e5f6789012345678901234567890abcde',
    last_commit_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    web_url: 'https://github.com/demo-org/demo-repo/tree/feature/DEMO-1-user-auth',
  },
  {
    id: 'de000000-0000-0000-0002-000000000002',
    name: 'feature/DEMO-2-security-updates',
    is_default: false,
    last_commit_hash: 'c3d4e5f6789012345678901234567890abcdef',
    last_commit_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    web_url: 'https://github.com/demo-org/demo-repo/tree/feature/DEMO-2-security-updates',
  },
  {
    id: 'de000000-0000-0000-0002-000000000003',
    name: 'main',
    is_default: true,
    last_commit_hash: 'd4e5f6789012345678901234567890abcdef01',
    last_commit_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    web_url: 'https://github.com/demo-org/demo-repo/tree/main',
  },
];

const DEMO_PULL_REQUESTS = [
  {
    id: 'de000000-0000-0000-0003-000000000001',
    remote_id: '42',
    title: 'DEMO-1: Add user authentication module',
    description: 'This PR implements the complete user authentication flow including login, logout, and session management.',
    source_branch: 'feature/DEMO-1-user-auth',
    destination_branch: 'main',
    status: 'open',
    author_name: 'Alice Developer',
    author_email: 'alice@example.com',
    reviewers: JSON.stringify([{ name: 'Bob Engineer', status: 'approved' }, { name: 'Charlie DevOps', status: 'pending' }]),
    web_url: 'https://github.com/demo-org/demo-repo/pull/42',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'de000000-0000-0000-0003-000000000002',
    remote_id: '41',
    title: 'DEMO-3: Dashboard analytics implementation',
    description: 'Adds comprehensive analytics dashboard with charts and real-time data.',
    source_branch: 'feature/DEMO-3-dashboard',
    destination_branch: 'main',
    status: 'merged',
    author_name: 'Diana PM',
    author_email: 'diana@example.com',
    reviewers: JSON.stringify([{ name: 'Alice Developer', status: 'approved' }]),
    merged_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    web_url: 'https://github.com/demo-org/demo-repo/pull/41',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_BUILDS = [
  {
    id: 'de000000-0000-0000-0004-000000000001',
    remote_id: 'run-12345',
    build_number: '1234',
    pipeline_name: 'CI/CD Pipeline',
    status: 'success',
    started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    finished_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    duration_seconds: 300,
    web_url: 'https://github.com/demo-org/demo-repo/actions/runs/12345',
    commit_id: 'de000000-0000-0000-0001-000000000002',
  },
  {
    id: 'de000000-0000-0000-0004-000000000002',
    remote_id: 'run-12346',
    build_number: '1235',
    pipeline_name: 'CI/CD Pipeline',
    status: 'running',
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    web_url: 'https://github.com/demo-org/demo-repo/actions/runs/12346',
    commit_id: 'de000000-0000-0000-0001-000000000004',
  },
];

const DEMO_DEPLOYMENTS = [
  {
    id: 'de000000-0000-0000-0005-000000000001',
    remote_id: 'deploy-789',
    environment: 'staging',
    status: 'success',
    deployed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    deployed_by: 'Charlie DevOps',
    web_url: 'https://github.com/demo-org/demo-repo/deployments/staging',
    commit_id: 'de000000-0000-0000-0001-000000000003',
    build_id: 'de000000-0000-0000-0004-000000000001',
  },
  {
    id: 'de000000-0000-0000-0005-000000000002',
    remote_id: 'deploy-790',
    environment: 'production',
    status: 'success',
    deployed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    deployed_by: 'Diana PM',
    web_url: 'https://github.com/demo-org/demo-repo/deployments/production',
    commit_id: 'de000000-0000-0000-0001-000000000004',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'seed') {
      console.log('[git-demo-seed] Starting demo data seeding...');

      // Get current user
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get first project to link demo data to
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_key')
        .limit(1);

      const projectId = projects?.[0]?.id;

      // Get first issue to link demo data to
      const { data: issues } = await supabase
        .from('issues')
        .select('id, issue_key')
        .limit(5);

      // Clean up existing demo data first (use specific IDs since LIKE doesn't work with UUID)
      console.log('[git-demo-seed] Cleaning up existing demo data...');
      const demoDeploymentIds = DEMO_DEPLOYMENTS.map(d => d.id);
      const demoPRIds = DEMO_PULL_REQUESTS.map(p => p.id);
      const demoCommitIds = DEMO_COMMITS.map(c => c.id);
      const demoBranchIds = DEMO_BRANCHES.map(b => b.id);
      const demoBuildIds = DEMO_BUILDS.map(b => b.id);
      
      await supabase.from('git_deployment_issues').delete().in('deployment_id', demoDeploymentIds);
      await supabase.from('git_pull_request_issues').delete().in('pull_request_id', demoPRIds);
      await supabase.from('git_commit_issues').delete().in('commit_id', demoCommitIds);
      await supabase.from('git_deployments').delete().in('id', demoDeploymentIds);
      await supabase.from('git_builds').delete().in('id', demoBuildIds);
      await supabase.from('git_pull_requests').delete().in('id', demoPRIds);
      await supabase.from('git_branches').delete().in('id', demoBranchIds);
      await supabase.from('git_commits').delete().in('id', demoCommitIds);
      await supabase.from('git_repositories').delete().eq('id', DEMO_REPO_ID);
      await supabase.from('git_organizations').delete().eq('id', DEMO_ORG_ID);

      // 1. Create demo organization
      console.log('[git-demo-seed] Creating demo organization...');
      const { error: orgError } = await supabase.from('git_organizations').insert({
        id: DEMO_ORG_ID,
        name: 'Demo GitHub Organization',
        host_url: 'https://github.com',
        provider_type: 'github',
        is_active: true,
        created_by: user.id,
        last_sync_at: new Date().toISOString(),
        access_token_encrypted: 'DEMO_MODE_TOKEN', // Marker for demo mode
      });
      if (orgError) console.error('[git-demo-seed] Org error:', orgError);

      // 2. Create demo repository
      console.log('[git-demo-seed] Creating demo repository...');
      const { error: repoError } = await supabase.from('git_repositories').insert({
        id: DEMO_REPO_ID,
        organization_id: DEMO_ORG_ID,
        project_id: projectId,
        remote_id: 'demo-12345',
        name: 'demo-project',
        slug: 'demo-org/demo-project',
        clone_url: 'https://github.com/demo-org/demo-project.git',
        web_url: 'https://github.com/demo-org/demo-project',
        default_branch: 'main',
        is_active: true,
        smartcommits_enabled: true,
      });
      if (repoError) console.error('[git-demo-seed] Repo error:', repoError);

      // 3. Create demo commits
      console.log('[git-demo-seed] Creating demo commits...');
      for (const commit of DEMO_COMMITS) {
        await supabase.from('git_commits').insert({
          ...commit,
          repository_id: DEMO_REPO_ID,
        });
      }

      // 4. Create demo branches with issue links
      console.log('[git-demo-seed] Creating demo branches...');
      for (let i = 0; i < DEMO_BRANCHES.length; i++) {
        const branch = DEMO_BRANCHES[i];
        const issueId = issues?.[i % (issues?.length || 1)]?.id;
        await supabase.from('git_branches').insert({
          ...branch,
          repository_id: DEMO_REPO_ID,
          issue_id: branch.is_default ? null : issueId,
        });
      }

      // 5. Create demo pull requests
      console.log('[git-demo-seed] Creating demo pull requests...');
      for (const pr of DEMO_PULL_REQUESTS) {
        await supabase.from('git_pull_requests').insert({
          ...pr,
          repository_id: DEMO_REPO_ID,
        });
      }

      // 6. Create demo builds
      console.log('[git-demo-seed] Creating demo builds...');
      for (const build of DEMO_BUILDS) {
        await supabase.from('git_builds').insert({
          ...build,
          repository_id: DEMO_REPO_ID,
        });
      }

      // 7. Create demo deployments
      console.log('[git-demo-seed] Creating demo deployments...');
      for (const deploy of DEMO_DEPLOYMENTS) {
        await supabase.from('git_deployments').insert({
          ...deploy,
          repository_id: DEMO_REPO_ID,
        });
      }

      // 8. Link commits, PRs, and deployments to issues
      console.log('[git-demo-seed] Creating issue links...');
      if (issues && issues.length > 0) {
        // Link commits to issues
        for (let i = 0; i < DEMO_COMMITS.length; i++) {
          const issue = issues[i % issues.length];
          await supabase.from('git_commit_issues').insert({
            commit_id: DEMO_COMMITS[i].id,
            issue_id: issue.id,
            issue_key: issue.issue_key,
          });
        }

        // Link PRs to issues
        for (let i = 0; i < DEMO_PULL_REQUESTS.length; i++) {
          const issue = issues[i % issues.length];
          await supabase.from('git_pull_request_issues').insert({
            pull_request_id: DEMO_PULL_REQUESTS[i].id,
            issue_id: issue.id,
            issue_key: issue.issue_key,
          });
        }

        // Link deployments to issues
        for (let i = 0; i < DEMO_DEPLOYMENTS.length; i++) {
          const issue = issues[i % issues.length];
          await supabase.from('git_deployment_issues').insert({
            deployment_id: DEMO_DEPLOYMENTS[i].id,
            issue_id: issue.id,
            issue_key: issue.issue_key,
          });
        }
      }

      console.log('[git-demo-seed] Demo data seeding completed!');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Demo data seeded successfully',
          data: {
            organization_id: DEMO_ORG_ID,
            repository_id: DEMO_REPO_ID,
            commits: DEMO_COMMITS.length,
            branches: DEMO_BRANCHES.length,
            pull_requests: DEMO_PULL_REQUESTS.length,
            builds: DEMO_BUILDS.length,
            deployments: DEMO_DEPLOYMENTS.length,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cleanup') {
      console.log('[git-demo-seed] Cleaning up demo data...');

      // Remove all demo data using specific IDs
      const demoDeploymentIds = DEMO_DEPLOYMENTS.map(d => d.id);
      const demoPRIds = DEMO_PULL_REQUESTS.map(p => p.id);
      const demoCommitIds = DEMO_COMMITS.map(c => c.id);
      const demoBranchIds = DEMO_BRANCHES.map(b => b.id);
      const demoBuildIds = DEMO_BUILDS.map(b => b.id);
      
      await supabase.from('git_deployment_issues').delete().in('deployment_id', demoDeploymentIds);
      await supabase.from('git_pull_request_issues').delete().in('pull_request_id', demoPRIds);
      await supabase.from('git_commit_issues').delete().in('commit_id', demoCommitIds);
      await supabase.from('git_deployments').delete().in('id', demoDeploymentIds);
      await supabase.from('git_builds').delete().in('id', demoBuildIds);
      await supabase.from('git_pull_requests').delete().in('id', demoPRIds);
      await supabase.from('git_branches').delete().in('id', demoBranchIds);
      await supabase.from('git_commits').delete().in('id', demoCommitIds);
      await supabase.from('git_repositories').delete().eq('id', DEMO_REPO_ID);
      await supabase.from('git_organizations').delete().eq('id', DEMO_ORG_ID);

      console.log('[git-demo-seed] Demo data cleanup completed!');

      return new Response(
        JSON.stringify({ success: true, message: 'Demo data cleaned up successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "seed" or "cleanup"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[git-demo-seed] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
