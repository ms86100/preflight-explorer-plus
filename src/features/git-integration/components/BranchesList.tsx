// Branches List Component
// Shows branches linked to an issue

import { GitBranch as GitBranchIcon, ExternalLink, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { GitBranch } from '../types';

interface BranchesListProps {
  readonly branches: readonly GitBranch[];
  readonly onCreateBranch?: () => void;
  readonly showCreateButton?: boolean;
}

export function BranchesList({ branches, onCreateBranch, showCreateButton = true }: BranchesListProps) {
  if (branches.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground italic">
          No branches linked yet
        </div>
        {showCreateButton && onCreateBranch && (
          <Button variant="outline" size="sm" onClick={onCreateBranch} className="gap-1">
            <Plus className="h-3 w-3" />
            Create branch
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {branches.map((branch) => (
        <BranchItem key={branch.id} branch={branch} />
      ))}
      {showCreateButton && onCreateBranch && (
        <Button variant="ghost" size="sm" onClick={onCreateBranch} className="gap-1 w-full justify-center">
          <Plus className="h-3 w-3" />
          Create another branch
        </Button>
      )}
    </div>
  );
}

function BranchItem({ branch }: { readonly branch: GitBranch }) {
  const getTimeAgo = () => {
    if (branch.last_commit_at) {
      return formatDistanceToNow(new Date(branch.last_commit_at), { addSuffix: true });
    }
    if (branch.created_at) {
      return formatDistanceToNow(new Date(branch.created_at), { addSuffix: true });
    }
    return '';
  };
  const timeAgo = getTimeAgo();
  
  const repoName = branch.repository?.name;
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
      <GitBranchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded truncate">
            {branch.name}
          </code>
          {branch.web_url && (
            <a
              href={branch.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {repoName && <span>{repoName}</span>}
          {timeAgo && <span>• {timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
