// Git Integration Service
// CRUD operations for Git integration entities

import { supabase } from '@/integrations/supabase/client';
import type {
  GitOrganization,
  GitRepository,
  GitCommit,
  GitBranch,
  GitPullRequest,
  GitBuild,
  GitDeployment,
  IssueDevelopmentInfo,
  CreateGitOrganizationInput,
  UpdateGitOrganizationInput,
  LinkRepositoryInput,
  UpdateRepositoryInput,
} from '../types';

// =============================================
// GIT ORGANIZATIONS
// =============================================

export async function getGitOrganizations(): Promise<GitOrganization[]> {
  const { data, error } = await supabase
    .from('git_organizations')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as GitOrganization[];
}

export async function getGitOrganization(id: string): Promise<GitOrganization | null> {
  const { data, error } = await supabase
    .from('git_organizations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as GitOrganization;
}

export async function createGitOrganization(input: CreateGitOrganizationInput): Promise<GitOrganization> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('git_organizations')
    .insert({
      name: input.name,
      host_url: input.host_url,
      provider_type: input.provider_type,
      oauth_client_id: input.oauth_client_id,
      oauth_client_secret_encrypted: input.oauth_client_secret_encrypted,
      access_token_encrypted: input.access_token_encrypted || input.access_token,
      webhook_secret: input.webhook_secret,
      created_by: user.user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as GitOrganization;
}

export async function updateGitOrganization(
  id: string,
  updates: UpdateGitOrganizationInput
): Promise<GitOrganization> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.webhook_secret !== undefined) updateData.webhook_secret = updates.webhook_secret;
  if (updates.last_sync_at !== undefined) updateData.last_sync_at = updates.last_sync_at;
  if (updates.last_sync_error !== undefined) updateData.last_sync_error = updates.last_sync_error;

  const { data, error } = await supabase
    .from('git_organizations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as GitOrganization;
}

export async function deleteGitOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('git_organizations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// =============================================
// GIT REPOSITORIES
// =============================================

export async function getGitRepositories(projectId?: string): Promise<GitRepository[]> {
  let query = supabase
    .from('git_repositories')
    .select('*, organization:git_organizations(*)');
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return data as GitRepository[];
}

export async function getGitRepository(id: string): Promise<GitRepository | null> {
  const { data, error } = await supabase
    .from('git_repositories')
    .select('*, organization:git_organizations(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as GitRepository;
}

export async function linkRepository(input: LinkRepositoryInput): Promise<GitRepository> {
  const { data, error } = await supabase
    .from('git_repositories')
    .insert({
      organization_id: input.organization_id,
      project_id: input.project_id,
      remote_id: input.remote_id,
      name: input.name,
      slug: input.slug,
      clone_url: input.clone_url,
      web_url: input.web_url,
      default_branch: input.default_branch || 'main',
      smartcommits_enabled: input.smartcommits_enabled ?? true,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as GitRepository;
}

export async function unlinkRepository(id: string): Promise<void> {
  const { error } = await supabase
    .from('git_repositories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function updateRepository(
  id: string,
  updates: UpdateRepositoryInput
): Promise<GitRepository> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.smartcommits_enabled !== undefined) updateData.smartcommits_enabled = updates.smartcommits_enabled;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.project_id !== undefined) updateData.project_id = updates.project_id;

  const { data, error } = await supabase
    .from('git_repositories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as GitRepository;
}

// =============================================
// ISSUE DEVELOPMENT INFO
// =============================================

export async function getIssueDevelopmentInfo(issueId: string, issueKey: string): Promise<IssueDevelopmentInfo> {
  // Fetch all development data for an issue in parallel
  const [commitsResult, branchesResult, prsResult, deploymentsResult] = await Promise.all([
    // Get commits linked to this issue
    supabase
      .from('git_commit_issues')
      .select('*, commit:git_commits(*, repository:git_repositories(*))')
      .eq('issue_id', issueId),
    
    // Get branches linked to this issue
    supabase
      .from('git_branches')
      .select('*, repository:git_repositories(*)')
      .eq('issue_id', issueId),
    
    // Get PRs linked to this issue
    supabase
      .from('git_pull_request_issues')
      .select('*, pull_request:git_pull_requests(*, repository:git_repositories(*))')
      .eq('issue_id', issueId),
    
    // Get deployments linked to this issue
    supabase
      .from('git_deployment_issues')
      .select('*, deployment:git_deployments(*, repository:git_repositories(*), commit:git_commits(*))')
      .eq('issue_id', issueId),
  ]);

  const commits = (commitsResult.data || []).map(ci => ci.commit).filter(Boolean) as unknown as GitCommit[];
  const branches = (branchesResult.data || []) as unknown as GitBranch[];
  const pullRequests = (prsResult.data || []).map(pri => pri.pull_request).filter(Boolean) as unknown as GitPullRequest[];
  // Get builds separately to avoid subquery issues
  const commitIds = commits.map(c => c.id);
  let builds: GitBuild[] = [];
  if (commitIds.length > 0) {
    const buildsResult = await supabase
      .from('git_builds')
      .select('*, commit:git_commits(*), repository:git_repositories(*)')
      .in('commit_id', commitIds);
    builds = (buildsResult.data || []) as unknown as GitBuild[];
  }
  const deployments = (deploymentsResult.data || []).map(di => di.deployment).filter(Boolean) as unknown as GitDeployment[];

  // Calculate summary
  const openPRs = pullRequests.filter(pr => pr.status === 'open');
  const mergedPRs = pullRequests.filter(pr => pr.status === 'merged');
  const latestBuild = builds.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const deployedEnvs = [...new Set(
    deployments
      .filter(d => d.status === 'success')
      .map(d => d.environment)
  )];

  return {
    issueId,
    issueKey,
    commits,
    branches,
    pullRequests,
    builds,
    deployments,
    summary: {
      commitCount: commits.length,
      branchCount: branches.length,
      openPRCount: openPRs.length,
      mergedPRCount: mergedPRs.length,
      latestBuildStatus: latestBuild?.status,
      deployedEnvironments: deployedEnvs,
    },
  };
}

// =============================================
// COMMITS
// =============================================

export async function getCommitsForIssue(issueId: string): Promise<GitCommit[]> {
  const { data, error } = await supabase
    .from('git_commit_issues')
    .select('*, commit:git_commits(*, repository:git_repositories(*))')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(ci => ci.commit).filter(Boolean) as GitCommit[];
}

// =============================================
// BRANCHES
// =============================================

export async function getBranchesForIssue(issueId: string): Promise<GitBranch[]> {
  const { data, error } = await supabase
    .from('git_branches')
    .select('*, repository:git_repositories(*)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as GitBranch[];
}

export async function createBranchForIssue(
  repositoryId: string,
  issueId: string,
  branchName: string,
  webUrl?: string
): Promise<GitBranch> {
  const { data, error } = await supabase
    .from('git_branches')
    .insert({
      repository_id: repositoryId,
      issue_id: issueId,
      name: branchName,
      web_url: webUrl,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as GitBranch;
}

// =============================================
// PULL REQUESTS
// =============================================

export async function getPullRequestsForIssue(issueId: string): Promise<GitPullRequest[]> {
  const { data, error } = await supabase
    .from('git_pull_request_issues')
    .select('*, pull_request:git_pull_requests(*, repository:git_repositories(*))')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(pri => pri.pull_request).filter(Boolean) as unknown as GitPullRequest[];
}

// =============================================
// BUILDS
// =============================================

export async function getBuildsForIssue(issueId: string): Promise<GitBuild[]> {
  // Get builds via commit-issue links
  const { data: commitIssues, error: ciError } = await supabase
    .from('git_commit_issues')
    .select('commit_id')
    .eq('issue_id', issueId);
  
  if (ciError) throw ciError;
  
  const commitIds = (commitIssues || []).map(ci => ci.commit_id);
  if (commitIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('git_builds')
    .select('*, commit:git_commits(*), repository:git_repositories(*)')
    .in('commit_id', commitIds)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as GitBuild[];
}

// =============================================
// DEPLOYMENTS
// =============================================

export async function getDeploymentsForIssue(issueId: string): Promise<GitDeployment[]> {
  const { data, error } = await supabase
    .from('git_deployment_issues')
    .select('*, deployment:git_deployments(*, repository:git_repositories(*), commit:git_commits(*))')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(di => di.deployment).filter(Boolean) as GitDeployment[];
}
