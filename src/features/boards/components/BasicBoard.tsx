import { useState, useCallback, useEffect } from 'react';
import { Filter, Search, MoreHorizontal, Maximize2, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  readonly due_date?: string;
}

interface BasicBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly columns: readonly {
    readonly id: string;
    readonly name: string;
    readonly statusCategory: 'todo' | 'in_progress' | 'done';
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

// Simple default columns for basic/business projects
const DEFAULT_BASIC_COLUMNS = [
  { id: 'todo', name: 'To Do', statusCategory: 'todo' as const },
  { id: 'in_progress', name: 'In Progress', statusCategory: 'in_progress' as const },
  { id: 'done', name: 'Done', statusCategory: 'done' as const },
];

export function BasicBoard({
  projectKey = '',
  projectName = 'Project',
  columns = DEFAULT_BASIC_COLUMNS,
  issues: initialIssues = [],
  teamMembers = [],
  onIssueMove,
  onIssueSelect,
  onCreateIssue,
}: Partial<BasicBoardProps>) {
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

  // Calculate progress stats
  const stats = {
    total: issues.length,
    todo: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'todo').length,
    inProgress: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'in_progress').length,
    done: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'done').length,
  };
  
  const progressPercentage = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

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
      {/* Simple Header with Progress */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{projectName}</h2>
            <p className="text-sm text-muted-foreground">Task Management Board</p>
          </div>
          
          {/* Progress Overview */}
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  {stats.todo} To Do
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {stats.inProgress} In Progress
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {stats.done} Done
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simplified Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
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

          {/* Simple Filters */}
          <div className="flex items-center gap-2">
            <button className="quick-filter quick-filter-inactive">
              <Filter className="h-3.5 w-3.5 mr-1" />
              My Tasks
            </button>
            <button className="quick-filter quick-filter-inactive">
              Due Soon
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => onCreateIssue?.()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          
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
              <DropdownMenuItem>Export tasks</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const dropStatusId = column.statusIds?.[0] || column.id;
            return (
              <BoardColumn
                key={column.id}
                id={dropStatusId}
                name={column.name}
                issues={getColumnIssues(column)}
                statusCategory={column.statusCategory}
                onIssueSelect={onIssueSelect}
                onCreateIssue={() => onCreateIssue?.(dropStatusId)}
                onDrop={handleIssueDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
