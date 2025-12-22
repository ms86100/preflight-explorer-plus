// Commits List Component
// Shows commits linked to an issue

import { GitCommit as GitCommitIcon, ExternalLink, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import type { GitCommit } from '../types';

interface CommitsListProps {
  commits: GitCommit[];
  maxVisible?: number;
}

export function CommitsList({ commits, maxVisible = 3 }: CommitsListProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (commits.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No commits linked yet
      </div>
    );
  }
  
  const visibleCommits = isOpen ? commits : commits.slice(0, maxVisible);
  const hasMore = commits.length > maxVisible;
  
  return (
    <div className="space-y-2">
      {visibleCommits.map((commit) => (
        <CommitItem key={commit.id} commit={commit} />
      ))}
      
      {hasMore && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-center gap-1">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              {isOpen ? 'Show less' : `Show ${commits.length - maxVisible} more`}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {commits.slice(maxVisible).map((commit) => (
              <CommitItem key={commit.id} commit={commit} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function CommitItem({ commit }: { commit: GitCommit }) {
  const shortHash = commit.commit_hash.substring(0, 7);
  const message = commit.message?.split('\n')[0] || 'No message';
  const timeAgo = commit.committed_at
    ? formatDistanceToNow(new Date(commit.committed_at), { addSuffix: true })
    : '';
  
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 group">
      <GitCommitIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
            {shortHash}
          </code>
          <span className="text-xs text-muted-foreground truncate">
            {commit.author_name}
          </span>
          {commit.web_url && (
            <a
              href={commit.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
        <p className="text-sm truncate mt-0.5">{message}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {timeAgo && <span>{timeAgo}</span>}
          {commit.files_changed > 0 && (
            <span>
              {commit.files_changed} file{commit.files_changed !== 1 ? 's' : ''}
            </span>
          )}
          {(commit.additions > 0 || commit.deletions > 0) && (
            <span>
              <span className="text-green-600">+{commit.additions}</span>
              {' / '}
              <span className="text-red-600">-{commit.deletions}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
