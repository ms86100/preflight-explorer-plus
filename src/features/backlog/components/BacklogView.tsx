import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  ArrowRight,
  Pencil,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { CreateIssueModal, IssueDetailModal, useIssuesByProject, useStatuses, useDeleteIssue, useUpdateIssue } from '@/features/issues';
import { useProject } from '@/features/projects';
import { useBoardsByProject, useSprintsByBoard, useCreateSprint, useStartSprint, useCompleteSprint, useAddIssueToSprint, useUpdateSprint, useDeleteSprint, useMoveIssuesToBacklog } from '@/features/boards';
// SprintPlanningModal import removed - unused (S1128)
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  readonly id: string;
  readonly issue_key: string;
  readonly summary: string;
  readonly issue_type: { readonly name: string; readonly color: string } | null;
  readonly priority: { readonly name: string; readonly color: string } | null;
  readonly status: { readonly name: string; readonly color: string; readonly category: string } | null;
  readonly assignee: { readonly display_name: string; readonly avatar_url: string | null } | null;
  readonly story_points: number | null;
  readonly classification: string;
  readonly epic?: { readonly issue_key: string; readonly summary: string } | null;
}

interface SprintSection {
  readonly id: string;
  readonly name: string;
  readonly goal: string | null;
  readonly state: SprintState;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly issues: readonly BacklogIssue[];
}

interface TeamMember {
  readonly id: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
}

export function BacklogView() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(['backlog']));
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isSprintPlanningOpen, setIsSprintPlanningOpen] = useState(false);
  // Note: isSprintPlanningOpen is used by handlers below
  const [createIssueContext, setCreateIssueContext] = useState<string | undefined>();
  
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

  const { data: project, isLoading: projectLoading } = useProject(projectKey || '');
  const { data: issues, isLoading: issuesLoading } = useIssuesByProject(project?.id || '');
  const { data: boards } = useBoardsByProject(project?.id || '');
  const { data: sprints } = useSprintsByBoard(boards?.[0]?.id || '');
  useStatuses(); // Fetch statuses for potential use
  
  const createSprint = useCreateSprint();
  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const deleteIssue = useDeleteIssue();
  const updateIssue = useUpdateIssue();
  const addIssueToSprint = useAddIssueToSprint();
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

  // Group issues by sprint
  const backlogIssues = issues?.filter(issue => {
    // Issues not in any sprint
    return true; // For now, show all - we'll enhance with sprint_issues join
  }) || [];

  const filteredIssues = backlogIssues.filter(issue => {
    if (!searchQuery) return true;
    return (
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Create sprint sections
  const sprintSections: SprintSection[] = [
    ...(sprints?.filter(s => s.state !== 'closed').map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      state: sprint.state as SprintState,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      issues: [], // Will be populated with sprint_issues
    })) || []),
  ];

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

  const handleCreateSprint = async () => {
    if (!boards?.[0]?.id) return;
    const sprintNumber = (sprints?.length || 0) + 1;
    await createSprint.mutateAsync({
      board_id: boards[0].id,
      name: `Sprint ${sprintNumber}`,
    });
  };

  const handleStartSprint = async (sprintId: string) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14); // 2 week sprint
    
    await startSprint.mutateAsync({
      id: sprintId,
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const handleCompleteSprint = async (sprintId: string) => {
    await completeSprint.mutateAsync(sprintId);
  };

  const openCreateIssue = (statusId?: string) => {
    setCreateIssueContext(statusId);
    setIsCreateIssueOpen(true);
  };

  const renderIssueRow = (issue: BacklogIssue) => {
    const TypeIcon = issue.issue_type?.name ? ISSUE_TYPE_ICONS[issue.issue_type.name] || CheckSquare : CheckSquare;
    const priorityIcon = issue.priority?.name ? PRIORITY_ICONS[issue.priority.name] : '';
    const isSelected = selectedIssues.has(issue.id);
    const initials = issue.assignee?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '';

    return (
      <div
        key={issue.id}
        className={`flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-muted/50 transition-colors ${
          isSelected ? 'bg-primary/5' : ''
        }`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100" />
        
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleIssueSelection(issue.id)}
        />

        <div className="p-1 rounded" style={{ backgroundColor: `${issue.issue_type?.color}15` }}>
          <TypeIcon className="h-4 w-4" style={{ color: issue.issue_type?.color }} />
        </div>

        <span className="text-sm font-medium text-primary w-24 flex-shrink-0">{issue.issue_key}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{issue.summary}</p>
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
            
            {sprints?.some(s => s.state !== 'closed') ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Add to sprint
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {sprints.filter(s => s.state !== 'closed').map(sprint => (
                      <DropdownMenuItem 
                        key={sprint.id}
                        onClick={async () => {
                          try {
                            await addIssueToSprint.mutateAsync({ sprintId: sprint.id, issueId: issue.id });
                            toast.success(`Added ${issue.issue_key} to ${sprint.name}`);
                          } catch (error) {
                            toast.error('Failed to add issue to sprint');
                          }
                        }}
                      >
                        {sprint.name}
                        {sprint.state === 'active' && (
                          <span className="ml-2 text-xs text-muted-foreground">(active)</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem disabled>
                <ArrowRight className="h-4 w-4 mr-2" />
                Add to sprint
                <span className="ml-2 text-xs text-muted-foreground">(no sprints)</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => {
              setIssueToAssign({ id: issue.id, key: issue.issue_key });
              setAssigneeDialogOpen(true);
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Change assignee
            </DropdownMenuItem>
            
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
      </div>
    );
  };

  const renderSprintSection = (sprint: SprintSection) => {
    const isExpanded = expandedSprints.has(sprint.id);
    const issueCount = sprint.issues.length;
    const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.story_points || 0), 0);

    return (
      <div key={sprint.id} className="border rounded-lg mb-4 overflow-hidden">
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
              </div>
              {sprint.goal && (
                <p className="text-sm text-muted-foreground mt-0.5">{sprint.goal}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sprint.state === 'future' && (
                <Button size="sm" onClick={() => handleStartSprint(sprint.id)}>
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
            <div className="divide-y divide-border">
              {sprint.issues.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No issues in this sprint</p>
                  <Button variant="link" size="sm" onClick={() => openCreateIssue()}>
                    Create an issue
                  </Button>
                </div>
              ) : (
                sprint.issues.map(renderIssueRow)
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
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
              <h1 className="text-xl font-semibold">Backlog</h1>
              
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
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateSprint}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Sprint
              </Button>
              <Button size="sm" onClick={() => openCreateIssue()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Issue
              </Button>
            </div>
          </div>

          {/* Backlog Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Sprint sections */}
            {sprintSections.map(renderSprintSection)}

            {/* Backlog section */}
            <div className="border rounded-lg overflow-hidden">
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
                        {filteredIssues.length} issues • {filteredIssues.reduce((sum, i) => sum + (i.story_points || 0), 0)} points
                      </span>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => openCreateIssue()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Issue
                  </Button>
                </div>

                <CollapsibleContent>
                  <div className="divide-y divide-border">
                    {filteredIssues.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Your backlog is empty</p>
                        <Button variant="link" size="sm" onClick={() => openCreateIssue()}>
                          Create your first issue
                        </Button>
                      </div>
                    ) : (
                      filteredIssues.map(issue => (
                        <div key={issue.id} className="group">
                          {renderIssueRow(issue as BacklogIssue)}
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
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
              <Label htmlFor="sprint-name" className="text-sm font-medium">Name</Label>
              <Input
                id="sprint-name"
                value={editSprintName}
                onChange={(e) => setEditSprintName(e.target.value)}
                placeholder="Sprint name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sprint-goal" className="text-sm font-medium">Goal</Label>
              <Input
                id="sprint-goal"
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
    </>
  );
}
