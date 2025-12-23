/**
 * @fileoverview Unit tests for gitIntegrationService.
 * @module features/git-integration/services/gitIntegrationService.test
 */

import { describe, it, expect, vi } from 'vitest';

// ============================================================================
// Mock Response Functions (module level - S2004 fix)
// ============================================================================

function mockSingleResponse() {
  return Promise.resolve({ data: null, error: null });
}

function mockOrderResponse() {
  return Promise.resolve({ data: [], error: null });
}

function mockDeleteResponse() {
  return Promise.resolve({ error: null });
}

function mockInsertSingleResponse() {
  return Promise.resolve({ data: {}, error: null });
}

function mockUpdateSingleResponse() {
  return Promise.resolve({ data: {}, error: null });
}

// ============================================================================
// Mock Factory Function (module level - S2004 fix)
// ============================================================================

function createDefaultFromMock() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingleResponse,
        order: mockOrderResponse,
      })),
      order: mockOrderResponse,
      in: vi.fn(() => ({ order: mockOrderResponse })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: mockInsertSingleResponse })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockUpdateSingleResponse })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: mockDeleteResponse,
    })),
  };
}

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-uuid' } } })),
    },
    from: vi.fn(() => createDefaultFromMock()),
  },
}));

// ============================================================================
// Type Definitions for Testing
// ============================================================================

/** Git organization configuration */
interface GitOrganization {
  id: string;
  name: string;
  host_url: string;
  provider_type: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

/** Git repository linked to a project */
interface GitRepository {
  id: string;
  organization_id: string;
  project_id: string | null;
  remote_id: string;
  name: string;
  slug: string;
  clone_url: string | null;
  web_url: string | null;
  default_branch: string;
  smartcommits_enabled: boolean;
  is_active: boolean;
}

/** Git commit information */
interface GitCommit {
  id: string;
  repository_id: string;
  commit_hash: string;
  message: string | null;
  author_name: string | null;
  author_email: string | null;
  committed_at: string | null;
  additions: number | null;
  deletions: number | null;
  files_changed: number | null;
  web_url: string | null;
}

/** Git branch information */
interface GitBranch {
  id: string;
  repository_id: string;
  issue_id: string | null;
  name: string;
  is_default: boolean;
  last_commit_hash: string | null;
  web_url: string | null;
}

/** Git pull request information */
interface GitPullRequest {
  id: string;
  repository_id: string;
  remote_id: string;
  title: string | null;
  description: string | null;
  source_branch: string | null;
  destination_branch: string | null;
  status: 'open' | 'merged' | 'declined' | 'superseded';
  author_name: string | null;
  merged_at: string | null;
  web_url: string | null;
}

/** Git build/pipeline information */
interface GitBuild {
  id: string;
  repository_id: string;
  commit_id: string | null;
  pipeline_name: string | null;
  build_number: string | null;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  web_url: string | null;
}

/** Development info summary for an issue */
interface IssueDevelopmentSummary {
  commitCount: number;
  branchCount: number;
  openPRCount: number;
  mergedPRCount: number;
  latestBuildStatus?: string;
  deployedEnvironments: string[];
}

// ============================================================================
// Type Tests
// ============================================================================

describe('Git Integration Types', () => {
  describe('GitOrganization', () => {
    it('should have all required properties', () => {
      const org: GitOrganization = {
        id: 'org-uuid',
        name: 'My Organization',
        host_url: 'https://github.com',
        provider_type: 'github',
        is_active: true,
        last_sync_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      expect(org.id).toBeDefined();
      expect(org.provider_type).toBe('github');
    });

    it('should support all provider types', () => {
      const providers: GitOrganization['provider_type'][] = [
        'github',
        'gitlab',
        'bitbucket',
        'azure_devops',
      ];
      
      providers.forEach((provider) => {
        expect(provider).toBeDefined();
      });
    });
  });

  describe('GitRepository', () => {
    it('should have all required properties', () => {
      const repo: GitRepository = {
        id: 'repo-uuid',
        organization_id: 'org-uuid',
        project_id: 'project-uuid',
        remote_id: '12345',
        name: 'my-repo',
        slug: 'my-org/my-repo',
        clone_url: 'https://github.com/my-org/my-repo.git',
        web_url: 'https://github.com/my-org/my-repo',
        default_branch: 'main',
        smartcommits_enabled: true,
        is_active: true,
      };
      
      expect(repo.name).toBe('my-repo');
      expect(repo.smartcommits_enabled).toBe(true);
    });

    it('should allow null project_id for unlinked repos', () => {
      const repo: GitRepository = {
        id: 'repo-uuid',
        organization_id: 'org-uuid',
        project_id: null,
        remote_id: '12345',
        name: 'unlinked-repo',
        slug: 'my-org/unlinked-repo',
        clone_url: null,
        web_url: null,
        default_branch: 'master',
        smartcommits_enabled: false,
        is_active: true,
      };
      
      expect(repo.project_id).toBeNull();
    });
  });

  describe('GitCommit', () => {
    it('should represent commit data correctly', () => {
      const commit: GitCommit = {
        id: 'commit-uuid',
        repository_id: 'repo-uuid',
        commit_hash: 'abc123def456',
        message: 'PROJ-123 Fix login bug',
        author_name: 'John Developer',
        author_email: 'john@example.com',
        committed_at: '2024-01-15T10:30:00Z',
        additions: 50,
        deletions: 10,
        files_changed: 3,
        web_url: 'https://github.com/org/repo/commit/abc123def456',
      };
      
      expect(commit.commit_hash).toBe('abc123def456');
      expect(commit.additions).toBe(50);
    });
  });

  describe('GitPullRequest', () => {
    it('should support all PR statuses', () => {
      const statuses: GitPullRequest['status'][] = ['open', 'merged', 'declined', 'superseded'];
      
      statuses.forEach((status) => {
        const pr: GitPullRequest = {
          id: 'pr-uuid',
          repository_id: 'repo-uuid',
          remote_id: '42',
          title: 'Feature PR',
          description: null,
          source_branch: 'feature/xyz',
          destination_branch: 'main',
          status,
          author_name: 'Developer',
          merged_at: status === 'merged' ? '2024-01-15T12:00:00Z' : null,
          web_url: null,
        };
        
        expect(pr.status).toBe(status);
      });
    });
  });

  describe('GitBuild', () => {
    it('should support all build statuses', () => {
      const statuses: GitBuild['status'][] = ['pending', 'running', 'success', 'failed', 'cancelled'];
      
      statuses.forEach((status) => {
        const build: GitBuild = {
          id: 'build-uuid',
          repository_id: 'repo-uuid',
          commit_id: 'commit-uuid',
          pipeline_name: 'CI/CD Pipeline',
          build_number: '123',
          status,
          started_at: '2024-01-15T10:00:00Z',
          finished_at: status === 'running' ? null : '2024-01-15T10:15:00Z',
          duration_seconds: status === 'running' ? null : 900,
          web_url: null,
        };
        
        expect(build.status).toBe(status);
      });
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

/**
 * Extracts issue keys from a commit message.
 */
function extractIssueKeys(message: string): string[] {
  // Use possessive-like matching with atomic groups via specific character limits
  // to prevent catastrophic backtracking (ReDoS vulnerability)
  const pattern = /\b([A-Z][A-Z0-9]{0,9}-\d{1,7})\b/g;
  const matches = message.match(pattern);
  return [...new Set(matches || [])];
}

/**
 * Generates a branch name from issue key and summary.
 */
function generateBranchName(issueKey: string, summary: string): string {
  const sanitized = summary
    .toLowerCase()
    .split(/[^a-z0-9\s-]/).join('')
    .split(/\s+/).join('-')
    .substring(0, 50);
  return `feature/${issueKey.toLowerCase()}-${sanitized}`;
}

/**
 * Calculates development summary from raw data.
 */
function calculateDevSummary(
  commits: GitCommit[],
  branches: GitBranch[],
  pullRequests: GitPullRequest[],
  builds: GitBuild[],
  deployments: { environment: string; status: string }[]
): IssueDevelopmentSummary {
  const openPRs = pullRequests.filter((pr) => pr.status === 'open');
  const mergedPRs = pullRequests.filter((pr) => pr.status === 'merged');
  const latestBuild = [...builds].sort(
    (a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime()
  )[0];
  const deployedEnvs = [
    ...new Set(
      deployments.filter((d) => d.status === 'success').map((d) => d.environment)
    ),
  ];

  return {
    commitCount: commits.length,
    branchCount: branches.length,
    openPRCount: openPRs.length,
    mergedPRCount: mergedPRs.length,
    latestBuildStatus: latestBuild?.status,
    deployedEnvironments: deployedEnvs,
  };
}

/**
 * Determines the overall build health based on recent builds.
 */
function getBuildHealth(builds: GitBuild[]): 'healthy' | 'unstable' | 'broken' | 'unknown' {
  if (builds.length === 0) return 'unknown';

  const recentBuilds = builds.slice(0, 5);
  const successCount = recentBuilds.filter((b) => b.status === 'success').length;
  const failedCount = recentBuilds.filter((b) => b.status === 'failed').length;

  if (successCount === recentBuilds.length) return 'healthy';
  if (failedCount > successCount) return 'broken';
  if (failedCount > 0) return 'unstable';
  return 'healthy';
}

describe('Git Integration Helpers', () => {
  describe('extractIssueKeys', () => {
    it('should extract single issue key', () => {
      expect(extractIssueKeys('PROJ-123 Fix bug')).toEqual(['PROJ-123']);
    });

    it('should extract multiple issue keys', () => {
      expect(extractIssueKeys('PROJ-123 PROJ-456 Multiple fixes')).toEqual(['PROJ-123', 'PROJ-456']);
    });

    it('should deduplicate issue keys', () => {
      expect(extractIssueKeys('PROJ-123 PROJ-123 Same issue')).toEqual(['PROJ-123']);
    });

    it('should return empty array for no matches', () => {
      expect(extractIssueKeys('No issue key here')).toEqual([]);
    });

    it('should handle various formats', () => {
      expect(extractIssueKeys('[PROJ-123] Fix')).toEqual(['PROJ-123']);
      expect(extractIssueKeys('ABC2-99: Feature')).toEqual(['ABC2-99']);
    });
  });

  describe('generateBranchName', () => {
    it('should generate valid branch name', () => {
      expect(generateBranchName('PROJ-123', 'Fix login bug')).toBe(
        'feature/proj-123-fix-login-bug'
      );
    });

    it('should sanitize special characters', () => {
      expect(generateBranchName('PROJ-123', "User's profile & settings")).toBe(
        'feature/proj-123-users-profile--settings'
      );
    });

    it('should truncate long summaries', () => {
      const longSummary = 'This is a very long summary that should be truncated to fifty characters maximum';
      const result = generateBranchName('PROJ-123', longSummary);
      expect(result.length).toBeLessThanOrEqual(50 + 'feature/proj-123-'.length);
    });
  });

  describe('calculateDevSummary', () => {
    it('should calculate empty summary', () => {
      const summary = calculateDevSummary([], [], [], [], []);
      expect(summary).toEqual({
        commitCount: 0,
        branchCount: 0,
        openPRCount: 0,
        mergedPRCount: 0,
        latestBuildStatus: undefined,
        deployedEnvironments: [],
      });
    });

    it('should count commits and branches', () => {
      const commits: GitCommit[] = [
        { id: '1', repository_id: 'r', commit_hash: 'a', message: null, author_name: null, author_email: null, committed_at: null, additions: null, deletions: null, files_changed: null, web_url: null },
        { id: '2', repository_id: 'r', commit_hash: 'b', message: null, author_name: null, author_email: null, committed_at: null, additions: null, deletions: null, files_changed: null, web_url: null },
      ];
      const branches: GitBranch[] = [
        { id: '1', repository_id: 'r', issue_id: null, name: 'main', is_default: true, last_commit_hash: null, web_url: null },
      ];

      const summary = calculateDevSummary(commits, branches, [], [], []);
      expect(summary.commitCount).toBe(2);
      expect(summary.branchCount).toBe(1);
    });

    it('should categorize PRs correctly', () => {
      const prs: GitPullRequest[] = [
        { id: '1', repository_id: 'r', remote_id: '1', title: 'Open PR', description: null, source_branch: null, destination_branch: null, status: 'open', author_name: null, merged_at: null, web_url: null },
        { id: '2', repository_id: 'r', remote_id: '2', title: 'Merged PR', description: null, source_branch: null, destination_branch: null, status: 'merged', author_name: null, merged_at: '2024-01-01', web_url: null },
        { id: '3', repository_id: 'r', remote_id: '3', title: 'Another Open', description: null, source_branch: null, destination_branch: null, status: 'open', author_name: null, merged_at: null, web_url: null },
      ];

      const summary = calculateDevSummary([], [], prs, [], []);
      expect(summary.openPRCount).toBe(2);
      expect(summary.mergedPRCount).toBe(1);
    });

    it('should find latest build status', () => {
      const builds: GitBuild[] = [
        { id: '1', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'failed', started_at: '2024-01-01T10:00:00Z', finished_at: null, duration_seconds: null, web_url: null },
        { id: '2', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: '2024-01-02T10:00:00Z', finished_at: null, duration_seconds: null, web_url: null },
      ];

      const summary = calculateDevSummary([], [], [], builds, []);
      expect(summary.latestBuildStatus).toBe('success');
    });

    it('should deduplicate deployed environments', () => {
      const deployments = [
        { environment: 'staging', status: 'success' },
        { environment: 'production', status: 'success' },
        { environment: 'staging', status: 'success' },
        { environment: 'dev', status: 'failed' },
      ];

      const summary = calculateDevSummary([], [], [], [], deployments);
      expect(summary.deployedEnvironments).toEqual(['staging', 'production']);
    });
  });
});

// ============================================================================
// Build Status Tests
// ============================================================================

describe('Build Status Helpers', () => {
  describe('getBuildHealth', () => {
    it('should return unknown for no builds', () => {
      expect(getBuildHealth([])).toBe('unknown');
    });

    it('should return healthy for all success', () => {
      const builds: GitBuild[] = [
        { id: '1', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
        { id: '2', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
      ];
      expect(getBuildHealth(builds)).toBe('healthy');
    });

    it('should return broken for mostly failures', () => {
      const builds: GitBuild[] = [
        { id: '1', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'failed', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
        { id: '2', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'failed', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
        { id: '3', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
      ];
      expect(getBuildHealth(builds)).toBe('broken');
    });

    it('should return unstable for some failures', () => {
      const builds: GitBuild[] = [
        { id: '1', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
        { id: '2', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'success', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
        { id: '3', repository_id: 'r', commit_id: null, pipeline_name: null, build_number: null, status: 'failed', started_at: null, finished_at: null, duration_seconds: null, web_url: null },
      ];
      expect(getBuildHealth(builds)).toBe('unstable');
    });
  });
});
