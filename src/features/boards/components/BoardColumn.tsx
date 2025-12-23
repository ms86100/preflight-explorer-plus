import { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IssueCard } from './IssueCard';
import type { ClassificationLevel } from '@/types/jira';

interface BoardIssue {
  readonly id: string;
  readonly issue_key: string;
  readonly summary: string;
  readonly issue_type: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
  readonly priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  readonly assignee?: {
    readonly display_name: string;
    readonly avatar_url?: string;
  };
  readonly story_points?: number;
  readonly classification?: ClassificationLevel;
  readonly labels?: readonly string[];
  readonly epic_name?: string;
  readonly epic_color?: string;
}

interface BoardColumnProps {
  readonly id: string;
  readonly name: string;
  readonly issues: readonly BoardIssue[];
  readonly statusCategory: 'todo' | 'in_progress' | 'done';
  readonly minIssues?: number;
  readonly maxIssues?: number;
  readonly onCreateIssue?: () => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onDrop?: (issueId: string, columnId: string) => void;
}

const STATUS_CATEGORY_STYLES = {
  todo: 'bg-[hsl(var(--status-todo))]/10 border-[hsl(var(--status-todo))]/30',
  in_progress: 'bg-[hsl(var(--status-in-progress))]/10 border-[hsl(var(--status-in-progress))]/30',
  done: 'bg-[hsl(var(--status-done))]/10 border-[hsl(var(--status-done))]/30',
};

const STATUS_CATEGORY_DOT = {
  todo: 'bg-[hsl(var(--status-todo))]',
  in_progress: 'bg-[hsl(var(--status-in-progress))]',
  done: 'bg-[hsl(var(--status-done))]',
};

const getIssueLimitBadgeClass = (isOverLimit: boolean, isUnderLimit: boolean): string => {
  if (isOverLimit) return 'bg-destructive/10 text-destructive';
  if (isUnderLimit) return 'bg-warning/10 text-warning';
  return 'bg-muted text-muted-foreground';
};

export function BoardColumn({
  id,
  name,
  issues,
  statusCategory,
  minIssues,
  maxIssues,
  onCreateIssue,
  onIssueSelect,
  onDrop,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const issueCount = issues.length;
  const isOverLimit = maxIssues !== undefined && issueCount > maxIssues;
  const isUnderLimit = minIssues !== undefined && issueCount < minIssues;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const issueId = e.dataTransfer.getData('issueId');
    if (issueId && onDrop) {
      onDrop(issueId, id);
    }
  };

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('issueId', issueId);
  };

  return (
    <section
      aria-label={`Board column: ${name}`}
      className={`flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg ${
        isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`px-3 py-2 rounded-t-lg border-b ${STATUS_CATEGORY_STYLES[statusCategory]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_CATEGORY_DOT[statusCategory]}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {name}
            </h3>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${getIssueLimitBadgeClass(isOverLimit, isUnderLimit)}`}
            >
              {issueCount}
              {maxIssues !== undefined && ` / ${maxIssues}`}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`${name} column options`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateIssue}>
                <Plus className="h-4 w-4 mr-2" />
                Create issue
              </DropdownMenuItem>
              <DropdownMenuItem>Set column limit</DropdownMenuItem>
              <DropdownMenuItem>Column settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Issue List */}
      <ul className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {issues.map((issue) => (
          <li
            key={issue.id}
            draggable
            onDragStart={(e) => handleDragStart(e, issue.id)}
          >
            <IssueCard
              issue={issue}
              onSelect={() => onIssueSelect?.(issue.id)}
            />
          </li>
        ))}

        {issues.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground list-none">
            No issues
          </li>
        )}
      </ul>

      {/* Add Issue Button */}
      <div className="p-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onCreateIssue}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create issue
        </Button>
      </div>
    </section>
  );
}
