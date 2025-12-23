// Git Integration Types
// Based on Jira Data Center DVCS architecture

export type GitProviderType = 'gitlab' | 'github' | 'bitbucket';

export type PullRequestStatus = 'open' | 'merged' | 'declined' | 'closed';

export type BuildStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled';

export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'testing' | 'other';

export type DeploymentStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';

// Smart commit action types
export type SmartCommitActionType = 'comment' | 'time' | 'transition';

export interface SmartCommitAction {
  type: SmartCommitActionType;
  value: string;
  issueKey: string;
}

export interface ParsedSmartCommit {
  issueKeys: string[];
  actions: SmartCommitAction[];
  rawMessage: string;
}

// Database entity types
export interface GitOrganization {
  id: string;
  name: string;
  host_url: string;
  provider_type: GitProviderType;
  oauth_client_id?: string;
  oauth_client_secret_encrypted?: string;
  access_token_encrypted?: string;
  webhook_secret?: string;
  is_active: boolean;
  last_sync_at?: string;
  last_sync_error?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface GitRepository {
  id: string;
  organization_id: string;
  project_id?: string;
  remote_id: string;
  name: string;
  slug: string;
  clone_url?: string;
  web_url?: string;
  default_branch: string;
  smartcommits_enabled: boolean;
  last_commit_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  organization?: GitOrganization;
}

export interface GitCommit {
  id: string;
  repository_id: string;
  commit_hash: string;
  author_name?: string;
  author_email?: string;
  message?: string;
  committed_at?: string;
  files_changed: number;
  additions: number;
  deletions: number;
  web_url?: string;
  created_at: string;
  // Joined data
  repository?: GitRepository;
}

export interface GitCommitIssue {
  id: string;
  commit_id: string;
  issue_id: string;
  issue_key: string;
  smartcommit_processed: boolean;
  smartcommit_actions: SmartCommitAction[];
  created_at: string;
  // Joined data
  commit?: GitCommit;
}

export interface GitBranch {
  id: string;
  repository_id: string;
  issue_id?: string;
  name: string;
  web_url?: string;
  is_default: boolean;
  last_commit_hash?: string;
  last_commit_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  repository?: GitRepository;
}

export interface GitPullRequest {
  id: string;
  repository_id: string;
  remote_id: string;
  title?: string;
  description?: string;
  author_name?: string;
  author_email?: string;
  source_branch?: string;
  destination_branch?: string;
  status: PullRequestStatus;
  web_url?: string;
  reviewers: GitReviewer[];
  created_at: string;
  updated_at: string;
  merged_at?: string;
  // Joined data
  repository?: GitRepository;
}

export interface GitReviewer {
  name: string;
  email?: string;
  approved?: boolean;
}

export interface GitPullRequestIssue {
  id: string;
  pull_request_id: string;
  issue_id: string;
  issue_key: string;
  created_at: string;
  // Joined data
  pull_request?: GitPullRequest;
}

export interface GitBuild {
  id: string;
  repository_id: string;
  commit_id?: string;
  remote_id?: string;
  build_number?: string;
  pipeline_name?: string;
  status: BuildStatus;
  web_url?: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  repository?: GitRepository;
  commit?: GitCommit;
}

export interface GitDeployment {
  id: string;
  repository_id: string;
  commit_id?: string;
  build_id?: string;
  remote_id?: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  web_url?: string;
  deployed_at: string;
  deployed_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  repository?: GitRepository;
  commit?: GitCommit;
  build?: GitBuild;
}

export interface GitDeploymentIssue {
  id: string;
  deployment_id: string;
  issue_id: string;
  issue_key: string;
  created_at: string;
  // Joined data
  deployment?: GitDeployment;
}

// Aggregated development info for an issue
export interface IssueDevelopmentInfo {
  issueId: string;
  issueKey: string;
  commits: GitCommit[];
  branches: GitBranch[];
  pullRequests: GitPullRequest[];
  builds: GitBuild[];
  deployments: GitDeployment[];
  summary: {
    commitCount: number;
    branchCount: number;
    openPRCount: number;
    mergedPRCount: number;
    latestBuildStatus?: BuildStatus;
    deployedEnvironments: DeploymentEnvironment[];
  };
}

// Webhook payload types
export interface GitWebhookPayload {
  provider: GitProviderType;
  event: string;
  organizationId: string;
  payload: unknown;
}

// Form types for creating/updating
export interface CreateGitOrganizationInput {
  name: string;
  host_url: string;
  provider_type: GitProviderType;
  oauth_client_id?: string;
  oauth_client_secret_encrypted?: string;
  access_token?: string;
  access_token_encrypted?: string;
  webhook_secret?: string;
}

export interface UpdateGitOrganizationInput {
  is_active?: boolean;
  webhook_secret?: string;
  last_sync_at?: string;
  last_sync_error?: string;
}

export interface LinkRepositoryInput {
  organization_id: string;
  project_id: string;
  remote_id: string;
  name: string;
  slug: string;
  clone_url?: string;
  web_url?: string;
  default_branch?: string;
  smartcommits_enabled?: boolean;
}

export interface UpdateRepositoryInput {
  smartcommits_enabled?: boolean;
  is_active?: boolean;
  project_id?: string;
}
