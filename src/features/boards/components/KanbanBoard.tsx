import { useState, useCallback, useEffect } from 'react';
import { Filter, Search, MoreHorizontal, Maximize2, Clock, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BoardColumn } from './BoardColumn';
import type { ClassificationLevel } from '@/types/jira';

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
  readonly created_at?: string;
  readonly updated_at?: string;
}

interface KanbanBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly columns: readonly {
    readonly id: string;
    readonly name: string;
    readonly statusCategory: 'todo' | 'in_progress' | 'done';
    readonly maxIssues?: number;
    readonly minIssues?: number;
    /** All status IDs that belong to this column */
    readonly statusIds?: readonly string[];
  }[];
  readonly issues: readonly BoardIssue[];
  readonly teamMembers?: readonly {
    readonly id: string;
    readonly display_name: string;
    readonly avatar_url?: string;
  }[];
  readonly onIssueMove?: (issueId: string, newStatus: string) => void;
  readonly onIssueSelect?: (issueId: string) => void;
  readonly onCreateIssue?: (status?: string) => void;
}

// Default Kanban columns with WIP limits
const DEFAULT_KANBAN_COLUMNS = [
  { id: 'backlog', name: 'Backlog', statusCategory: 'todo' as const },
  { id: 'selected', name: 'Selected for Development', statusCategory: 'todo' as const, maxIssues: 10 },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' as const, maxIssues: 5 },
  { id: 'review', name: 'In Review', statusCategory: 'in_progress' as const, maxIssues: 3 },
  { id: 'done', name: 'Done', statusCategory: 'done' as const },
];

const getWipStatusClass = (wipStatus: 'normal' | 'warning' | 'exceeded'): string => {
  switch (wipStatus) {
    case 'exceeded':
      return 'bg-destructive/20 text-destructive';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function KanbanBoard({
  projectKey = '',
  projectName = 'Project',
  columns = DEFAULT_KANBAN_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
}: Partial<KanbanBoardProps>) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync local state with prop changes (for real-time updates)
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  // Helper to check if issue belongs to a column
  const issueInColumn = (issue: BoardIssue, column: typeof columns[0]): boolean => {
    const statusIds = column.statusIds || [];
    if (statusIds.length === 0) return issue.status === column.id;
    return statusIds.includes(issue.status);
  };

  // Calculate Kanban metrics
  const metrics = {
    totalIssues: issues.length,
    wipIssues: issues.filter(i => 
      columns.find(c => issueInColumn(i, c))?.statusCategory === 'in_progress'
    ).length,
    completedThisWeek: issues.filter(i => {
      const col = columns.find(c => issueInColumn(i, c));
      if (col?.statusCategory !== 'done' || !i.updated_at) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(i.updated_at) >= weekAgo;
    }).length,
    avgCycleTime: 0, // Would calculate from historical data
  };

  // Check WIP limit violations
  const getWipStatus = (column: typeof columns[0]) => {
    const count = issues.filter(i => issueInColumn(i, column)).length;
    if (!column.maxIssues) return 'normal';
    if (count >= column.maxIssues) return 'exceeded';
    if (count >= column.maxIssues * 0.8) return 'warning';
    return 'normal';
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
      return filteredIssues.filter((issue) => issueInColumn(issue, column));
    },
    [filteredIssues, columns]
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
      {/* Kanban Header with Metrics */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">{projectName} Kanban Board</h2>
            <p className="text-sm text-muted-foreground">Continuous flow with WIP limits</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Kanban Metrics */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  WIP: {metrics.wipIssues}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  Completed this week: {metrics.completedThisWeek}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              Blocked Items
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
              <DropdownMenuItem>Configure WIP limits</DropdownMenuItem>
              <DropdownMenuItem>Swimlanes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board Columns with WIP indicators */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const wipStatus = getWipStatus(column);
            const columnIssues = getColumnIssues(column);
            const dropStatusId = column.statusIds?.[0] || column.id;
            
            return (
              <div key={column.id} className="flex flex-col">
                {/* WIP Limit Header */}
                {!!column.maxIssues && (
                  <div className={`text-xs text-center py-1 mb-1 rounded ${getWipStatusClass(wipStatus)}`}>
                    {columnIssues.length}/{column.maxIssues} WIP
                  </div>
                )}
                <BoardColumn
                  id={dropStatusId}
                  name={column.name}
                  issues={columnIssues}
                  statusCategory={column.statusCategory}
                  maxIssues={column.maxIssues}
                  onIssueSelect={onIssueSelect}
                  onCreateIssue={() => onCreateIssue?.(dropStatusId)}
                  onDrop={handleIssueDrop}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
