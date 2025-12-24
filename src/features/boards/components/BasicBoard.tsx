import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useBoardTransitionValidation } from '../hooks/useBoardTransitionValidation';
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

interface ColumnStatus {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
}

interface BasicBoardProps {
  readonly projectKey: string;
  readonly projectName: string;
  readonly columns: readonly {
    readonly id: string;
    readonly name: string;
    readonly statusCategory: 'todo' | 'in_progress' | 'done';
    readonly statusIds?: readonly string[];
    readonly statuses?: readonly ColumnStatus[];
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
  readonly onOpenSettings?: () => void;
}

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
  onOpenSettings,
}: Partial<BasicBoardProps>) {
  const [issues, setIssues] = useState(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { createDropValidator } = useBoardTransitionValidation();

  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  const issueStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach(issue => map.set(issue.id, issue.status));
    return map;
  }, [issues]);

  const validateDrop = useMemo(
    () => createDropValidator(issueStatusMap),
    [createDropValidator, issueStatusMap]
  );

  const issueInColumn = (issue: BoardIssue, column: typeof columns[0]): boolean => {
    const statusIds = column.statusIds || [];
    if (statusIds.length === 0) return issue.status === column.id;
    return statusIds.includes(issue.status);
  };

  const stats = {
    total: issues.length,
    todo: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'todo').length,
    inProgress: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'in_progress').length,
    done: issues.filter(i => columns.find(c => issueInColumn(i, c))?.statusCategory === 'done').length,
  };
  
  const progressPercentage = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = !searchQuery ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssignee = selectedAssignees.length === 0 ||
      (issue.assignee && selectedAssignees.includes(issue.assignee.display_name));
    return matchesSearch && matchesAssignee;
  });

  const getColumnIssues = useCallback(
    (column: typeof columns[0]) => filteredIssues.filter((issue) => issueInColumn(issue, column)),
    [filteredIssues, columns]
  );

  const handleIssueDrop = (issueId: string, targetStatusId: string) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: targetStatusId } : issue))
    );
    onIssueMove?.(issueId, targetStatusId);
  };

  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const getColumnStatuses = (column: typeof columns[0]): ColumnStatus[] => {
    if (column.statuses && column.statuses.length > 0) return [...column.statuses];
    if (column.statusIds && column.statusIds.length > 1) return column.statusIds.map(id => ({ id, name: id }));
    return [];
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{projectName}</h2>
            <p className="text-sm text-muted-foreground">Task Management Board</p>
          </div>
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Circle className="h-3 w-3" />{stats.todo} To Do</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" />{stats.inProgress} In Progress</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{stats.done} Done</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
          </div>
          <div className="flex items-center gap-1">
            {teamMembers?.map((member) => {
              const isSelected = selectedAssignees.includes(member.display_name);
              const initials = member.display_name.split(' ').map((n) => n[0]).join('').toUpperCase();
              return (
                <button type="button" key={member.id} onClick={() => toggleAssignee(member.display_name)}
                  className={`rounded-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onCreateIssue?.()} size="sm"><Plus className="h-4 w-4 mr-1" />Add Task</Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}><Maximize2 className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenSettings}>Board settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const dropStatusId = column.statusIds?.[0] || column.id;
            const columnStatuses = getColumnStatuses(column);
            return (
              <BoardColumn
                key={column.id}
                id={dropStatusId}
                name={column.name}
                issues={getColumnIssues(column)}
                statusCategory={column.statusCategory}
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
