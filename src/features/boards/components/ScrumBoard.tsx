import { useState, useCallback, useEffect, useMemo } from 'react';
import { Filter, Search, MoreHorizontal, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SprintHeader } from './SprintHeader';
import { BoardColumn } from './BoardColumn';
import { useBoardTransitionValidation } from '../hooks/useBoardTransitionValidation';
import type { ClassificationLevel, SprintState } from '@/types/jira';

interface BoardIssue {
  readonly id: string;
  readonly issue_key: string;
  readonly summary: string;
  readonly issue_type: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
  readonly priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  readonly status: string;
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

interface ColumnStatus {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
}

interface ScrumBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly sprint?: {
    readonly id: string;
    readonly name: string;
    readonly goal?: string;
    readonly state: SprintState;
    readonly start_date?: string;
    readonly end_date?: string;
  };
  readonly columns: readonly {
    readonly id: string;
    readonly name: string;
    readonly statusCategory: 'todo' | 'in_progress' | 'done';
    readonly maxIssues?: number;
    /** All status IDs that belong to this column */
    readonly statusIds?: readonly string[];
    /** Status details for multi-status columns */
    readonly statuses?: readonly ColumnStatus[];
  }[];
  readonly issues: readonly BoardIssue[];
  /** Map of status ID to status category for stats calculation */
  readonly statusCategoryMap?: ReadonlyMap<string, string>;
  readonly teamMembers?: readonly {
    readonly id: string;
    readonly display_name: string;
    readonly avatar_url?: string;
  }[];
  readonly onIssueMove?: (issueId: string, newStatus: string) => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onCreateIssue?: (status?: string) => void;
  readonly onOpenSettings?: () => void;
}

// Default columns when none provided
const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'To Do', statusCategory: 'todo' as const },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' as const, maxIssues: 5 },
  { id: 'done', name: 'Done', statusCategory: 'done' as const },
];

export function ScrumBoard({
  projectKey = '',
  projectName = 'Project',
  sprint,
  columns = DEFAULT_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  statusCategoryMap,
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
  onOpenSettings,
}: Partial<ScrumBoardProps>) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { createDropValidator } = useBoardTransitionValidation();

  // Sync local state with prop changes (for real-time updates)
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  // Build issue status map for validation
  const issueStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach(issue => {
      map.set(issue.id, issue.status);
    });
    return map;
  }, [issues]);

  // Create the drop validator
  const validateDrop = useMemo(
    () => createDropValidator(issueStatusMap),
    [createDropValidator, issueStatusMap]
  );

  // Helper to check if an issue is done (by status category)
  const isIssueDone = (issue: BoardIssue): boolean => {
    if (statusCategoryMap) {
      return statusCategoryMap.get(issue.status) === 'done';
    }
    // Fallback: check if the status string matches 'done' directly
    return issue.status === 'done';
  };

  // Calculate sprint stats
  const sprintStats = {
    totalIssues: issues.length,
    completedIssues: issues.filter(isIssueDone).length,
    totalPoints: issues.reduce((sum, i) => sum + (i.story_points || 0), 0),
    completedPoints: issues
      .filter(isIssueDone)
      .reduce((sum, i) => sum + (i.story_points || 0), 0),
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      !searchQuery ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAssignee =
      selectedAssignees.length === 0 ||
      (issue.assignee && selectedAssignees.includes(issue.assignee.display_name));

    return matchesSearch && matchesAssignee;
  });

  // Get issues by column - match any status in the column's statusIds array
  const getColumnIssues = useCallback(
    (column: typeof columns[0]) => {
      const statusIds = column.statusIds || [];
      if (statusIds.length === 0) {
        // Fallback to direct column ID match for backward compatibility
        return filteredIssues.filter((issue) => issue.status === column.id);
      }
      return filteredIssues.filter((issue) => statusIds.includes(issue.status));
    },
    [filteredIssues, columns]
  );

  // Handle drag and drop - now with workflow validation
  const handleIssueDrop = (issueId: string, targetStatusId: string) => {
    // Optimistic update
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: targetStatusId } : issue))
    );
    onIssueMove?.(issueId, targetStatusId);
  };

  // Build status info for columns with multiple statuses
  const getColumnStatuses = (column: typeof columns[0]): ColumnStatus[] => {
    if (column.statuses && column.statuses.length > 0) {
      return [...column.statuses];
    }
    if (column.statusIds && column.statusIds.length > 1) {
      return column.statusIds.map(id => ({ id, name: id }));
    }
    return [];
  };

  // Toggle assignee filter
  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Board Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {/* Team Avatars Filter */}
          <div className="flex items-center gap-1">
            {teamMembers?.map((member) => {
              const isSelected = selectedAssignees.includes(member.display_name);
              const initials = member.display_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => toggleAssignee(member.display_name)}
                  aria-label={`Filter by ${member.display_name}`}
                  aria-pressed={isSelected}
                  className={`rounded-full transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url} alt={`${member.display_name} avatar`} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>

        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenSettings}>Board settings</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings}>Configure columns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sprint Header */}
      {sprint && (
        <div className="p-4 bg-muted/30">
          <SprintHeader sprint={sprint} stats={sprintStats} />
        </div>
      )}

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            // Use the first status ID for dropping issues, or fall back to column ID
            const dropStatusId = column.statusIds?.[0] || column.id;
            const columnStatuses = getColumnStatuses(column);
            return (
              <BoardColumn
                key={column.id}
                id={dropStatusId}
                name={column.name}
                issues={getColumnIssues(column)}
                statusCategory={column.statusCategory}
                maxIssues={column.maxIssues}
                statuses={columnStatuses.length > 1 ? columnStatuses : undefined}
                issueStatusMap={issueStatusMap}
                onIssueSelect={onIssueSelect}
                onCreateIssue={() => onCreateIssue?.(dropStatusId)}
                onDrop={handleIssueDrop}
                onValidateDrop={validateDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
