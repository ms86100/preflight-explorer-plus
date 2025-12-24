import { useState, useCallback, useEffect } from 'react';
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
}: Partial<ScrumBoardProps>) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync local state with prop changes (for real-time updates)
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

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

  // Get issues by column
  const getColumnIssues = useCallback(
    (columnId: string) => filteredIssues.filter((issue) => issue.status === columnId),
    [filteredIssues]
  );

  // Handle drag and drop
  const handleIssueDrop = (issueId: string, columnId: string) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: columnId } : issue))
    );
    onIssueMove?.(issueId, columnId);
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

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button className="quick-filter quick-filter-inactive">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Only My Issues
            </button>
            <button className="quick-filter quick-filter-inactive">
              Recently Updated
            </button>
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
              <DropdownMenuItem>Board settings</DropdownMenuItem>
              <DropdownMenuItem>Configure columns</DropdownMenuItem>
              <DropdownMenuItem>Quick filters</DropdownMenuItem>
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
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              name={column.name}
              issues={getColumnIssues(column.id)}
              statusCategory={column.statusCategory}
              maxIssues={column.maxIssues}
              onIssueSelect={onIssueSelect}
              onCreateIssue={() => onCreateIssue?.(column.id)}
              onDrop={handleIssueDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
