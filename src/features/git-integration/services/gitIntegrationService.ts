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
  return (data || []).map((d: any) => ({
    ...d,
    provider_type: d.provider || d.provider_type,
    access_token_encrypted: d.access_token,
  })) as GitOrganization[];
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
  return {
    ...data,
    provider_type: (data as any).provider || (data as any).provider_type,
    access_token_encrypted: (data as any).access_token,
  } as GitOrganization;
}

export async function createGitOrganization(input: CreateGitOrganizationInput): Promise<GitOrganization> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('git_organizations')
    .insert({
      name: input.name,
      host_url: input.host_url,
      provider: input.provider_type,
      access_token: input.access_token_encrypted || input.access_token,
      created_by: user.user.id,
    } as any)
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...data,
    provider_type: (data as any).provider || (data as any).provider_type,
    access_token_encrypted: (data as any).access_token,
  } as GitOrganization;
}

export async function updateGitOrganization(
  id: string,
  updates: UpdateGitOrganizationInput
): Promise<GitOrganization> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  const { data, error } = await supabase
    .from('git_organizations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...data,
    provider_type: (data as any).provider || (data as any).provider_type,
    access_token_encrypted: (data as any).access_token,
  } as GitOrganization;
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

// Helper to map DB row to GitRepository interface
function mapToGitRepository(row: any): GitRepository {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    remote_id: row.remote_id || row.id,
    name: row.name,
    slug: row.slug || row.name,
    clone_url: row.clone_url || row.url,
    web_url: row.web_url || row.url,
    default_branch: row.default_branch || 'main',
    smartcommits_enabled: row.smartcommits_enabled ?? true,
    is_active: row.is_active ?? row.is_linked ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    organization: row.organization ? {
      ...row.organization,
      provider_type: row.organization.provider || row.organization.provider_type,
    } : undefined,
  };
}

export async function getGitRepositories(projectId?: string): Promise<GitRepository[]> {
  let query = supabase
    .from('git_repositories')
    .select('*, organization:git_organizations(*)');
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return (data || []).map(mapToGitRepository);
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
  return mapToGitRepository(data);
}

export async function linkRepository(input: LinkRepositoryInput): Promise<GitRepository> {
  const { data, error } = await supabase
    .from('git_repositories')
    .insert({
      organization_id: input.organization_id,
      project_id: input.project_id,
      name: input.name,
      url: input.web_url || input.clone_url,
      default_branch: input.default_branch || 'main',
      is_linked: true,
    } as any)
    .select()
    .single();
  
  if (error) throw error;
  return mapToGitRepository(data);
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
  
  if (updates.is_active !== undefined) updateData.is_linked = updates.is_active;
  if (updates.project_id !== undefined) updateData.project_id = updates.project_id;

  const { data, error } = await supabase
    .from('git_repositories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return mapToGitRepository(data);
}

// =============================================
// ISSUE DEVELOPMENT INFO
// =============================================

export async function getIssueDevelopmentInfo(issueId: string, issueKey: string): Promise<IssueDevelopmentInfo> {
  // Fetch all development data for an issue in parallel
  const [branchesResult] = await Promise.all([
    // Get branches linked to this issue
    supabase
      .from('git_branches')
      .select('*, repository:git_repositories(*)')
      .eq('issue_id', issueId),
  ]);

  // Get commits for this issue
  const { data: commitsData } = await supabase
    .from('git_commits')
    .select('*, repository:git_repositories(*)')
    .eq('issue_id', issueId);

  // Get PRs for this issue
  const { data: prsData } = await supabase
    .from('git_pull_requests')
    .select('*, repository:git_repositories(*)')
    .eq('issue_id', issueId);

  const commits = (commitsData || []) as unknown as GitCommit[];
  const branches = (branchesResult.data || []) as unknown as GitBranch[];
  const pullRequests = (prsData || []) as unknown as GitPullRequest[];
  const builds: GitBuild[] = [];
  const deployments: GitDeployment[] = [];

  // Calculate summary
  const openPRs = pullRequests.filter(pr => pr.status === 'open');
  const mergedPRs = pullRequests.filter(pr => pr.status === 'merged');
  const sortedBuilds = [...builds].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestBuild = sortedBuilds[0];
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
    .from('git_commits')
    .select('*, repository:git_repositories(*)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as unknown as GitCommit[];
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
  return (data || []).map((b: any) => ({
    ...b,
    is_default: b.is_default ?? false,
    updated_at: b.updated_at || b.created_at,
    web_url: b.web_url || b.url,
  })) as GitBranch[];
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
      url: webUrl,
    } as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown as GitBranch;
}

// =============================================
// PULL REQUESTS
// =============================================

export async function getPullRequestsForIssue(issueId: string): Promise<GitPullRequest[]> {
  const { data, error } = await supabase
    .from('git_pull_requests')
    .select('*, repository:git_repositories(*)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as unknown as GitPullRequest[];
}

// =============================================
// BUILDS
// =============================================

export async function getBuildsForIssue(_issueId: string): Promise<GitBuild[]> {
  // Builds not directly linked to issues in current schema
  return [];
}

// =============================================
// DEPLOYMENTS
// =============================================

export async function getDeploymentsForIssue(_issueId: string): Promise<GitDeployment[]> {
  // Deployments not directly linked to issues in current schema
  return [];
}

