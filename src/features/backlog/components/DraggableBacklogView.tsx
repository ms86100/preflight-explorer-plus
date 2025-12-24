import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SprintHistoryPage } from './SprintHistoryPage';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  Play,
  Calendar,
  Zap,
  Bug,
  CheckSquare,
  Bookmark,
  Layers,
  Loader2,
  Trash2,
  Eye,
  UserPlus,
  Pencil,
  ArrowLeftRight,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { CreateIssueModal, IssueDetailModal, useIssuesByProject, useStatuses, useDeleteIssue, useUpdateIssue } from '@/features/issues';
import { useProject } from '@/features/projects';
import { 
  useBoardsByProject, 
  useSprintsByBoard, 
  useCreateSprint, 
  useStartSprint, 
  useCompleteSprint, 
  useAddIssueToSprint, 
  useRemoveIssueFromSprint, 
  useUpdateSprint, 
  useDeleteSprint, 
  useMoveIssuesToBacklog 
} from '@/features/boards';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import type { ClassificationLevel, SprintState } from '@/types/jira';

const ISSUE_TYPE_ICONS: Record<string, typeof Bug> = {
  Epic: Zap,
  Story: Bookmark,
  Task: CheckSquare,
  Bug: Bug,
  'Sub-task': Layers,
};

const PRIORITY_ICONS: Record<string, string> = {
  Highest: '⬆⬆',
  High: '⬆',
  Medium: '=',
  Low: '⬇',
  Lowest: '⬇⬇',
};

interface BacklogIssue {
  id: string;
  issue_key: string;
  summary: string;
  issue_type: { name: string; color: string } | null;
  priority: { name: string; color: string } | null;
  status: { name: string; color: string; category: string } | null;
  assignee: { display_name: string; avatar_url: string | null } | null;
  story_points: number | null;
  classification: string;
  epic?: { issue_key: string; summary: string } | null;
}

interface SprintSection {
  id: string;
  name: string;
  goal: string | null;
  state: SprintState;
  start_date: string | null;
  end_date: string | null;
  issues: BacklogIssue[];
}

interface TeamMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function DraggableBacklogView() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'backlog' | 'history'>('backlog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(['backlog']));
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [createIssueContext, setCreateIssueContext] = useState<string | undefined>();

  // Create sprint with dates modal state
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState<Date | undefined>(undefined);
  const [newSprintEndDate, setNewSprintEndDate] = useState<Date | undefined>(undefined);

  // Drag state
  const [draggedIssue, setDraggedIssue] = useState<BacklogIssue | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Issue detail modal state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<{ id: string; key: string } | null>(null);

  // Assignee selection state
  const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
  const [issueToAssign, setIssueToAssign] = useState<{ id: string; key: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Sprint action state
  const [sprintDeleteConfirmOpen, setSprintDeleteConfirmOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editSprintDialogOpen, setEditSprintDialogOpen] = useState(false);
  const [sprintToEdit, setSprintToEdit] = useState<{ id: string; name: string; goal: string | null } | null>(null);
  const [editSprintName, setEditSprintName] = useState('');
  const [editSprintGoal, setEditSprintGoal] = useState('');
  
  // Sprint completion modal state
  const [isSprintCompletionOpen, setIsSprintCompletionOpen] = useState(false);
  const [completionSprintId, setCompletionSprintId] = useState<string>('');
  const [completionSprintName, setCompletionSprintName] = useState<string>('');
  const [completionIncompleteCount, setCompletionIncompleteCount] = useState(0);
  const [completionCompletedCount, setCompletionCompletedCount] = useState(0);
  const [nextSprintForCompletion, setNextSprintForCompletion] = useState<{ id: string; name: string } | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectKey || '');
  const { data: issues, isLoading: issuesLoading } = useIssuesByProject(project?.id || '');
  const { data: boards } = useBoardsByProject(project?.id || '');
  const boardId = boards?.[0]?.id || '';
  const { data: sprints } = useSprintsByBoard(boardId);
  useStatuses(); // Fetch statuses for potential use

  // Fetch ALL sprint issues in a single query instead of per-sprint hooks
  const sprintIds = (sprints || []).filter(s => s.state !== 'closed').map(s => s.id);
  const { data: allSprintIssues } = useQuery({
    queryKey: ['all-sprint-issues', sprintIds],
    queryFn: async () => {
      if (!sprintIds.length) return [];
      const { data, error } = await supabase
        .from('sprint_issues')
        .select(`
          sprint_id,
          issue:issues(
            id, issue_key, summary, story_points, classification, assignee_id,
            issue_type:issue_types(name, color),
            status:issue_statuses(name, color, category),
            priority:priorities(name, color)
          )
        `)
        .in('sprint_id', sprintIds);
      if (error) throw error;
      
      // Fetch profiles separately for assignees
      const assigneeIds = [...new Set(
        (data || [])
          .map((si: any) => si.issue?.assignee_id)
          .filter(Boolean)
      )];
      
      let profileMap = new Map<string, any>();
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', assigneeIds);
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }
      
      // Attach profiles to issues
      return (data || []).map((si: any) => ({
        ...si,
        issue: si.issue ? {
          ...si.issue,
          assignee: si.issue.assignee_id ? profileMap.get(si.issue.assignee_id) || null : null
        } : null
      }));
    },
    enabled: sprintIds.length > 0,
  });

  const createSprint = useCreateSprint();
  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const deleteIssue = useDeleteIssue();
  const updateIssue = useUpdateIssue();
  const addIssueToSprint = useAddIssueToSprint();
  const removeIssueFromSprint = useRemoveIssueFromSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const moveIssuesToBacklog = useMoveIssuesToBacklog();

  const isLoading = projectLoading || issuesLoading;

  // Fetch team members when assignee dialog opens
  useEffect(() => {
    if (assigneeDialogOpen && project?.id) {
      setLoadingMembers(true);
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .then(({ data }) => {
          setTeamMembers(data || []);
          setLoadingMembers(false);
        });
    }
  }, [assigneeDialogOpen, project?.id]);

  // Realtime subscription for sprint_issues and issues
  useEffect(() => {
    const channel = supabase
      .channel('backlog-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_issues' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-sprint-issues'] });
          queryClient.invalidateQueries({ queryKey: ['sprintIssues'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          queryClient.invalidateQueries({ queryKey: ['all-sprint-issues'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprints' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sprints'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build sprint sections with issues from sprint_issues
  const sprintIssueMap = new Map<string, BacklogIssue[]>();
  const allSprintIssueIds = new Set<string>();
  
  (allSprintIssues || []).forEach((si: any) => {
    const sprintId = si.sprint_id;
    const issue = si.issue as BacklogIssue | null;
    if (!issue) return;
    
    if (!sprintIssueMap.has(sprintId)) {
      sprintIssueMap.set(sprintId, []);
    }
    sprintIssueMap.get(sprintId)!.push(issue);
    allSprintIssueIds.add(issue.id);
  });

  // Backlog issues = all issues not in any sprint
  const backlogIssues = (issues || []).filter(issue => !allSprintIssueIds.has(issue.id));

  const filteredBacklogIssues = backlogIssues.filter(issue => {
    if (!searchQuery) return true;
    return (
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Create sprint sections
  const sprintSections: SprintSection[] = (sprints || [])
    .filter(s => s.state !== 'closed')
    .map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      state: sprint.state as SprintState,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      issues: sprintIssueMap.get(sprint.id) || [],
    }));

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints(prev => {
      const next = new Set(prev);
      if (next.has(sprintId)) {
        next.delete(sprintId);
      } else {
        next.add(sprintId);
      }
      return next;
    });
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const openCreateSprintModal = () => {
    const sprintNumber = (sprints?.length || 0) + 1;
    setNewSprintName(`Sprint ${sprintNumber}`);
    setNewSprintGoal('');
    setNewSprintStartDate(new Date());
    setNewSprintEndDate(addDays(new Date(), 14));
    setIsCreateSprintOpen(true);
  };

  const handleCreateSprintWithDates = async () => {
    if (!boardId || !newSprintName.trim()) return;
    try {
      await createSprint.mutateAsync({
        board_id: boardId,
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
        start_date: newSprintStartDate?.toISOString(),
        end_date: newSprintEndDate?.toISOString(),
      });
      setIsCreateSprintOpen(false);
      toast.success('Sprint created successfully');
    } catch {
      toast.error('Failed to create sprint. Please try again.');
    }
  };

  const handleStartSprint = async (sprint: SprintSection) => {
    try {
      const startDate = sprint.start_date || new Date().toISOString();
      const endDate = sprint.end_date || addDays(new Date(), 14).toISOString();
      
      await startSprint.mutateAsync({
        id: sprint.id,
        startDate,
        endDate,
      });
      toast.success(`${sprint.name} started successfully`);
    } catch {
      toast.error('Failed to start sprint');
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    await completeSprint.mutateAsync(sprintId);
  };

  const openCreateIssue = (statusId?: string) => {
    setCreateIssueContext(statusId);
    setIsCreateIssueOpen(true);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, issue: BacklogIssue) => {
    setDraggedIssue(issue);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', issue.id);
  };

  const handleDragEnd = () => {
    setDraggedIssue(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSprintId: string | 'backlog') => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedIssue) return;

    try {
      // Find source (current location of the issue)
      const sourceSprintId = [...sprintIssueMap.entries()].find(
        ([, issues]) => issues.some(i => i.id === draggedIssue.id)
      )?.[0];

      // If dropping to backlog
      if (targetSprintId === 'backlog') {
        if (sourceSprintId) {
          await removeIssueFromSprint.mutateAsync({ 
            sprintId: sourceSprintId, 
            issueId: draggedIssue.id 
          });
          toast.success(`Moved ${draggedIssue.issue_key} to backlog`);
        }
        return;
      }

      // Dropping to a sprint
      if (sourceSprintId === targetSprintId) return; // Same location

      // Remove from source sprint if exists
      if (sourceSprintId) {
        await removeIssueFromSprint.mutateAsync({ 
          sprintId: sourceSprintId, 
          issueId: draggedIssue.id 
        });
      }

      // Add to target sprint
      await addIssueToSprint.mutateAsync({ 
        sprintId: targetSprintId, 
        issueId: draggedIssue.id 
      });

      const targetSprint = sprints?.find(s => s.id === targetSprintId);
      toast.success(`Moved ${draggedIssue.issue_key} to ${targetSprint?.name || 'sprint'}`);
    } catch {
      toast.error('Failed to move issue');
    }
  };

  // Handler extracted to reduce nesting depth (S2004 fix)
  const handleMoveToBacklog = async (issue: BacklogIssue) => {
    const sprintId = [...sprintIssueMap.entries()].find(
      ([, issues]) => issues.some(i => i.id === issue.id)
    )?.[0];
    if (sprintId) {
      await removeIssueFromSprint.mutateAsync({ sprintId, issueId: issue.id });
      toast.success(`Removed ${issue.issue_key} from sprint`);
    }
  };

  const renderIssueRow = (issue: BacklogIssue, inSprint: boolean = false) => {
    const TypeIcon = issue.issue_type?.name ? ISSUE_TYPE_ICONS[issue.issue_type.name] || CheckSquare : CheckSquare;
    const priorityIcon = issue.priority?.name ? PRIORITY_ICONS[issue.priority.name] : '';
    const isSelected = selectedIssues.has(issue.id);
    const initials = issue.assignee?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '';
    const isDragging = draggedIssue?.id === issue.id;

    return (
      <li
        key={issue.id}
        aria-label={`Issue ${issue.issue_key}: ${issue.summary}`}
        draggable
        onDragStart={(e) => handleDragStart(e, issue)}
        onDragEnd={handleDragEnd}
        className={`group flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-muted/50 transition-all cursor-grab active:cursor-grabbing list-none ${
          isSelected ? 'bg-primary/5' : ''
        } ${isDragging ? 'opacity-50 scale-95' : ''}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleIssueSelection(issue.id)}
        />

        <div className="p-1 rounded" style={{ backgroundColor: `${issue.issue_type?.color}15` }}>
          <TypeIcon className="h-4 w-4" style={{ color: issue.issue_type?.color }} />
        </div>

        <button 
          type="button"
          className="text-sm font-medium text-primary w-24 flex-shrink-0 cursor-pointer hover:underline text-left"
          onClick={() => {
            setSelectedIssueId(issue.id);
            setIsDetailModalOpen(true);
          }}
        >
          {issue.issue_key}
        </button>

        <div className="flex-1 min-w-0">
          <button 
            type="button"
            className="text-sm truncate cursor-pointer hover:text-primary w-full text-left"
            onClick={() => {
              setSelectedIssueId(issue.id);
              setIsDetailModalOpen(true);
            }}
          >
            {issue.summary}
          </button>
        </div>

        {issue.epic && (
          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--issue-epic))]/10 text-[hsl(var(--issue-epic))] flex-shrink-0">
            {issue.epic.issue_key}
          </span>
        )}

        <ClassificationBadge level={issue.classification as ClassificationLevel} />

        {priorityIcon && (
          <span className="text-sm w-8 text-center" style={{ color: issue.priority?.color }}>
            {priorityIcon}
          </span>
        )}

        <span className={`lozenge text-xs ${
          issue.status?.category === 'done' ? 'lozenge-success' :
          issue.status?.category === 'in_progress' ? 'lozenge-inprogress' :
          'lozenge-default'
        }`}>
          {issue.status?.name}
        </span>

        {issue.story_points !== null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-8 text-center">
            {issue.story_points}
          </span>
        )}

        {issue.assignee ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={issue.assignee.avatar_url || ''} alt={`${issue.assignee.display_name || 'Assignee'} avatar`} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30" />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedIssueId(issue.id);
              setIsDetailModalOpen(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View details
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => {
              setIssueToAssign({ id: issue.id, key: issue.issue_key });
              setAssigneeDialogOpen(true);
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Change assignee
            </DropdownMenuItem>

            {inSprint && (
              <DropdownMenuItem onClick={() => handleMoveToBacklog(issue)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Move to backlog
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setIssueToDelete({ id: issue.id, key: issue.issue_key });
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  const renderSprintSection = (sprint: SprintSection) => {
    const isExpanded = expandedSprints.has(sprint.id);
    const issueCount = sprint.issues.length;
    const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.story_points || 0), 0);
    const isDropTarget = dragOverTarget === sprint.id;

    return (
      <section 
        key={sprint.id}
        aria-label={`Sprint: ${sprint.name}`}
        className={`border rounded-lg mb-4 overflow-hidden transition-all ${
          isDropTarget ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
        }`}
        onDragOver={(e) => handleDragOver(e, sprint.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, sprint.id)}
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleSprint(sprint.id)}>
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{sprint.name}</h3>
                <span className={`lozenge text-xs ${
                  sprint.state === 'active' ? 'lozenge-inprogress' :
                  sprint.state === 'closed' ? 'lozenge-success' :
                  'lozenge-default'
                }`}>
                  {sprint.state}
                </span>
                <span className="text-xs text-muted-foreground">
                  {issueCount} issues • {totalPoints} points
                </span>
                {sprint.start_date && sprint.end_date && (
                  <span className="text-xs text-muted-foreground">
                    ({new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()})
                  </span>
                )}
              </div>
              {sprint.goal && (
                <p className="text-sm text-muted-foreground mt-0.5">{sprint.goal}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sprint.state === 'future' && (
                <Button size="sm" onClick={() => handleStartSprint(sprint)} disabled={startSprint.isPending}>
                  <Play className="h-3 w-3 mr-1" />
                  Start Sprint
                </Button>
              )}
              {sprint.state === 'active' && (
                <Button size="sm" variant="outline" onClick={() => handleCompleteSprint(sprint.id)}>
                  Complete Sprint
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSprintToEdit({ id: sprint.id, name: sprint.name, goal: sprint.goal });
                    setEditSprintName(sprint.name);
                    setEditSprintGoal(sprint.goal || '');
                    setEditSprintDialogOpen(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit sprint
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    await moveIssuesToBacklog.mutateAsync(sprint.id);
                  }}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Move issues to backlog
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setSprintToDelete({ id: sprint.id, name: sprint.name });
                      setSprintDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete sprint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CollapsibleContent>
            <div className="divide-y divide-border min-h-[60px]">
              {sprint.issues.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <GripVertical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Drag issues here to add them to this sprint</p>
                </div>
              ) : (
                sprint.issues.map(issue => renderIssueRow(issue, true))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    );
  };

  if (isLoading) {
    return (
      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <CreateIssueModal
        projectId={project?.id || ''}
        statusId={createIssueContext}
        open={isCreateIssueOpen}
        onOpenChange={setIsCreateIssueOpen}
      />


      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'backlog' | 'history')}>
                <TabsList>
                  <TabsTrigger value="backlog" className="gap-2">
                    <Layers className="h-4 w-4" />
                    Backlog
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    Sprint History
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTab === 'backlog' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search backlog..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </>
              )}
            </div>

            {activeTab === 'backlog' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={openCreateSprintModal}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Sprint
                </Button>
                <Button size="sm" onClick={() => openCreateIssue()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Issue
                </Button>
              </div>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'backlog' ? (
            <div className="flex-1 overflow-auto p-4">
              {/* Sprint sections */}
              {sprintSections.map(renderSprintSection)}

              {/* Backlog section */}
              <section 
                aria-label="Backlog items"
                className={`border rounded-lg overflow-hidden transition-all ${
                  dragOverTarget === 'backlog' ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, 'backlog')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'backlog')}
              >
                <Collapsible open={expandedSprints.has('backlog')} onOpenChange={() => toggleSprint('backlog')}>
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {expandedSprints.has('backlog') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Backlog</h3>
                        <span className="text-xs text-muted-foreground">
                          {filteredBacklogIssues.length} issues • {filteredBacklogIssues.reduce((sum, i) => sum + (i.story_points || 0), 0)} points
                        </span>
                      </div>
                    </div>

                    <Button size="sm" variant="ghost" onClick={() => openCreateIssue()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Issue
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="divide-y divide-border min-h-[60px]">
                      {filteredBacklogIssues.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Your backlog is empty</p>
                          <Button variant="link" size="sm" onClick={() => openCreateIssue()}>
                            Create your first issue
                          </Button>
                        </div>
                      ) : (
                        filteredBacklogIssues.map(issue => (
                          <div key={issue.id} className="group">
                            {renderIssueRow(issue as BacklogIssue)}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              {boardId && <SprintHistoryPage boardId={boardId} projectKey={projectKey || ''} />}
            </div>
          )}
        </div>
      </AppLayout>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{issueToDelete?.key}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (issueToDelete) {
                  await deleteIssue.mutateAsync(issueToDelete.id);
                  setIssueToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignee Selection Dialog */}
      <Dialog open={assigneeDialogOpen} onOpenChange={setAssigneeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Assignee for {issueToAssign?.key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={async () => {
                    if (issueToAssign) {
                      await updateIssue.mutateAsync({
                        id: issueToAssign.id,
                        updates: { assignee_id: null }
                      });
                      setAssigneeDialogOpen(false);
                      setIssueToAssign(null);
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 mr-3" />
                  Unassigned
                </Button>
                {teamMembers.map(member => (
                  <Button
                    key={member.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={async () => {
                      if (issueToAssign) {
                        await updateIssue.mutateAsync({
                          id: issueToAssign.id,
                          updates: { assignee_id: member.id }
                        });
                        setAssigneeDialogOpen(false);
                        setIssueToAssign(null);
                      }
                    }}
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={member.avatar_url || ''} alt={`${member.display_name || 'Team member'} avatar`} />
                      <AvatarFallback className="text-xs">
                        {member.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {member.display_name || 'Unknown'}
                  </Button>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sprint Delete Confirmation */}
      <AlertDialog open={sprintDeleteConfirmOpen} onOpenChange={setSprintDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{sprintToDelete?.name}</strong>? All issues will be moved to the backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (sprintToDelete) {
                  await deleteSprint.mutateAsync(sprintToDelete.id);
                  setSprintToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sprint Dialog */}
      <Dialog open={editSprintDialogOpen} onOpenChange={setEditSprintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editSprintName}
                onChange={(e) => setEditSprintName(e.target.value)}
                placeholder="Sprint name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Goal</Label>
              <Input
                value={editSprintGoal}
                onChange={(e) => setEditSprintGoal(e.target.value)}
                placeholder="Sprint goal (optional)"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditSprintDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (sprintToEdit) {
                    await updateSprint.mutateAsync({
                      id: sprintToEdit.id,
                      updates: { name: editSprintName, goal: editSprintGoal || null }
                    });
                    setEditSprintDialogOpen(false);
                    setSprintToEdit(null);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Sprint with Dates Modal (Jira DC style) */}
      <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sprint</DialogTitle>
            <DialogDescription>
              Define sprint details including dates. You can start the sprint later from the backlog.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Sprint Name *</Label>
              <Input
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="e.g. Sprint 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {newSprintStartDate ? format(newSprintStartDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newSprintStartDate}
                      onSelect={setNewSprintStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {newSprintEndDate ? format(newSprintEndDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newSprintEndDate}
                      onSelect={setNewSprintEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sprint Goal (optional)</Label>
              <Textarea
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
                placeholder="What do you want to accomplish in this sprint?"
                rows={3}
              />
            </div>

            {newSprintStartDate && newSprintEndDate && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {Math.ceil((newSprintEndDate.getTime() - newSprintStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateSprintOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSprintWithDates} 
              disabled={!newSprintName.trim() || createSprint.isPending}
            >
              {createSprint.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
