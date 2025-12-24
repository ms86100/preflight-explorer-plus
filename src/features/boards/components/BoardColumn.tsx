import { useState } from 'react';
import { MoreHorizontal, Plus, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface StatusInfo {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
}

interface BoardColumnProps {
  readonly id: string;
  readonly name: string;
  readonly issues: readonly BoardIssue[];
  readonly statusCategory: 'todo' | 'in_progress' | 'done';
  readonly minIssues?: number;
  readonly maxIssues?: number;
  /** Multiple statuses mapped to this column */
  readonly statuses?: readonly StatusInfo[];
  readonly onCreateIssue?: () => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onDrop?: (issueId: string, targetStatusId: string) => void;
  /** Callback to check if a transition is valid before dropping */
  readonly onValidateDrop?: (issueId: string, targetStatusId: string) => Promise<{ valid: boolean; error?: string }>;
  /** Map of issue ID to its current status */
  readonly issueStatusMap?: Map<string, string>;
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
  statuses = [],
  onCreateIssue,
  onIssueSelect,
  onDrop,
  onValidateDrop,
  issueStatusMap,
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showSubStatuses, setShowSubStatuses] = useState(false);
  
  const issueCount = issues.length;
  const isOverLimit = maxIssues !== undefined && issueCount > maxIssues;
  const isUnderLimit = minIssues !== undefined && issueCount < minIssues;
  const hasMultipleStatuses = statuses.length > 1;

  // Get issues for a specific status within this column
  const getIssuesForStatus = (statusId: string) => {
    if (!issueStatusMap) return [];
    return issues.filter(issue => issueStatusMap.get(issue.id) === statusId);
  };

  const handleDragOver = (e: React.DragEvent, statusId?: string) => {
    e.preventDefault();
    setIsDragOver(true);
    if (statusId) {
      setDragOverStatusId(statusId);
    }
    setDropError(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set drag over to false if we're leaving the column entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
      setDragOverStatusId(null);
      setDropError(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId?: string) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverStatusId(null);
    
    const issueId = e.dataTransfer.getData('issueId');
    if (!issueId) return;

    // Determine the target status ID
    const finalTargetStatusId = targetStatusId || (statuses.length > 0 ? statuses[0].id : id);

    // Validate transition if validator is provided
    if (onValidateDrop) {
      setIsValidating(true);
      try {
        const result = await onValidateDrop(issueId, finalTargetStatusId);
        if (!result.valid) {
          setDropError(result.error || 'This transition is not allowed');
          setIsValidating(false);
          return;
        }
      } catch (error) {
        setDropError('Failed to validate transition');
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    if (onDrop) {
      onDrop(issueId, finalTargetStatusId);
    }
  };

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('issueId', issueId);
  };

  // Render sub-status drop zones when column has multiple statuses
  const renderSubStatusDropZones = () => {
    if (!hasMultipleStatuses || !showSubStatuses) return null;

    return (
      <div className="px-2 pb-2 space-y-1">
        {statuses.map(status => {
          const statusIssues = getIssuesForStatus(status.id);
          const isStatusDragOver = dragOverStatusId === status.id;
          
          return (
            <div
              key={status.id}
              className={`p-2 rounded border-2 border-dashed transition-colors ${
                isStatusDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/20 hover:border-muted-foreground/40'
              }`}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {status.name}
                </span>
                <Badge variant="secondary" className="text-xs h-5">
                  {statusIssues.length}
                </Badge>
              </div>
              {statusIssues.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Drop here for "{status.name}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section
      aria-label={`Board column: ${name}`}
      className={`flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg transition-all ${
        isDragOver && !hasMultipleStatuses ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${dropError ? 'ring-2 ring-destructive ring-offset-2' : ''}`}
      onDragOver={!hasMultipleStatuses ? (e) => handleDragOver(e) : undefined}
      onDragLeave={handleDragLeave}
      onDrop={!hasMultipleStatuses ? (e) => handleDrop(e) : undefined}
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
            {hasMultipleStatuses && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setShowSubStatuses(!showSubStatuses)}
                  >
                    {showSubStatuses ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showSubStatuses ? 'Hide' : 'Show'} sub-statuses ({statuses.length})
                </TooltipContent>
              </Tooltip>
            )}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Show mapped statuses indicator */}
        {hasMultipleStatuses && (
          <div className="mt-1 flex flex-wrap gap-1">
            {statuses.map(status => (
              <Badge key={status.id} variant="outline" className="text-xs py-0 h-5">
                {status.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Drop Error Modal */}
      <AlertDialog open={!!dropError} onOpenChange={(open) => !open && setDropError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Transition Not Allowed
            </AlertDialogTitle>
            <AlertDialogDescription>{dropError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDropError(null)}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sub-Status Drop Zones */}
      {renderSubStatusDropZones()}

      {/* Issue List */}
      <ul 
        className={`flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] ${
          hasMultipleStatuses && isDragOver && !showSubStatuses ? 'ring-2 ring-primary ring-inset rounded' : ''
        }`}
        onDragOver={hasMultipleStatuses ? (e) => handleDragOver(e) : undefined}
        onDrop={hasMultipleStatuses && !showSubStatuses ? (e) => handleDrop(e) : undefined}
      >
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

    </section>
  );
}
