// Pull Requests List Component
// Shows PRs/MRs linked to an issue

import { GitPullRequest as GitPRIcon, GitMerge, ExternalLink, X, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GitPullRequest, PullRequestStatus } from '../types';

interface PullRequestsListProps {
  readonly pullRequests: readonly GitPullRequest[];
  readonly onCreatePR?: () => void;
  readonly showCreateButton?: boolean;
}

const statusConfig: Record<PullRequestStatus, {
  icon: typeof GitPRIcon;
  label: string;
  className: string;
}> = {
  open: {
    icon: GitPRIcon,
    label: 'Open',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  merged: {
    icon: GitMerge,
    label: 'Merged',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  declined: {
    icon: X,
    label: 'Declined',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  closed: {
    icon: X,
    label: 'Closed',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const getPRStatusIconColor = (status: PullRequestStatus): string => {
  switch (status) {
    case 'merged':
      return 'text-purple-600';
    case 'open':
      return 'text-green-600';
    default:
      return 'text-muted-foreground';
  }
};

export function PullRequestsList({ pullRequests, onCreatePR, showCreateButton = true }: PullRequestsListProps) {
  if (pullRequests.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground italic">
          No pull requests linked yet
        </div>
        {showCreateButton && onCreatePR && (
          <Button variant="outline" size="sm" onClick={onCreatePR} className="gap-1">
            <Plus className="h-3 w-3" />
            Create pull request
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {pullRequests.map((pr) => (
        <PullRequestItem key={pr.id} pullRequest={pr} />
      ))}
      {showCreateButton && onCreatePR && (
        <Button variant="ghost" size="sm" onClick={onCreatePR} className="gap-1 w-full justify-center">
          <Plus className="h-3 w-3" />
          Create another PR
        </Button>
      )}
    </div>
  );
}

function PullRequestItem({ pullRequest }: { pullRequest: GitPullRequest }) {
  const config = statusConfig[pullRequest.status];
  const Icon = config.icon;
  
  const timeAgo = pullRequest.merged_at
    ? `Merged ${formatDistanceToNow(new Date(pullRequest.merged_at), { addSuffix: true })}`
    : pullRequest.updated_at
      ? `Updated ${formatDistanceToNow(new Date(pullRequest.updated_at), { addSuffix: true })}`
      : pullRequest.created_at
        ? `Created ${formatDistanceToNow(new Date(pullRequest.created_at), { addSuffix: true })}`
        : '';
  
  const repoName = pullRequest.repository?.name;
  
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 group">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${getPRStatusIconColor(pullRequest.status)}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate flex-1">
            {pullRequest.title || `PR #${pullRequest.remote_id}`}
          </span>
          <Badge variant="outline" className={`shrink-0 ${config.className}`}>
            {config.label}
          </Badge>
          {pullRequest.web_url && (
            <a
              href={pullRequest.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {repoName && <span>{repoName}</span>}
          {pullRequest.source_branch && pullRequest.destination_branch && (
            <span className="font-mono">
              {pullRequest.source_branch} → {pullRequest.destination_branch}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {pullRequest.author_name && <span>by {pullRequest.author_name}</span>}
          {timeAgo && <span>• {timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
