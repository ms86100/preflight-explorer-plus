// Hook for fetching development info for an issue

import { useQuery } from '@tanstack/react-query';
import {
  getIssueDevelopmentInfo,
  getCommitsForIssue,
  getBranchesForIssue,
  getPullRequestsForIssue,
  getBuildsForIssue,
  getDeploymentsForIssue,
} from '../services/gitIntegrationService';

const QUERY_KEY = 'issue-development-info';

export function useIssueDevelopmentInfo(issueId: string | undefined, issueKey: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, issueId],
    queryFn: () => {
      if (!issueId || !issueKey) return null;
      return getIssueDevelopmentInfo(issueId, issueKey);
    },
    enabled: !!issueId && !!issueKey,
    staleTime: 30000, // 30 seconds
  });
}

export function useIssueCommits(issueId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'commits', issueId],
    queryFn: () => (issueId ? getCommitsForIssue(issueId) : []),
    enabled: !!issueId,
  });
}

export function useIssueBranches(issueId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'branches', issueId],
    queryFn: () => (issueId ? getBranchesForIssue(issueId) : []),
    enabled: !!issueId,
  });
}

export function useIssuePullRequests(issueId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'pull-requests', issueId],
    queryFn: () => (issueId ? getPullRequestsForIssue(issueId) : []),
    enabled: !!issueId,
  });
}

export function useIssueBuilds(issueId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'builds', issueId],
    queryFn: () => (issueId ? getBuildsForIssue(issueId) : []),
    enabled: !!issueId,
  });
}

export function useIssueDeployments(issueId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'deployments', issueId],
    queryFn: () => (issueId ? getDeploymentsForIssue(issueId) : []),
    enabled: !!issueId,
  });
}
