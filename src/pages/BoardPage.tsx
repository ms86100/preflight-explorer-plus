import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ScrumBoard, KanbanBoard, BasicBoard } from '@/features/boards';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useBoardsByProject, useBoardColumns, useActiveSprint, useSprintIssues, useSprintsByBoard, useStartSprint } from '@/features/boards/hooks/useBoards';
import { boardService } from '@/features/boards/services/boardService';
import { CreateIssueModal } from '@/features/issues/components/CreateIssueModal';
import { IssueDetailModal } from '@/features/issues/components/IssueDetailModal';
import { useExecuteTransition } from '@/features/workflows';
import { useIssuesByProject } from '@/features/issues';
import { Loader2, LayoutList, ArrowRight, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function BoardPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isInitializingColumns, setIsInitializingColumns] = useState(false);
  const [didAttemptInitColumns, setDidAttemptInitColumns] = useState(false);
  
  // Start sprint modal state
  const [startSprintOpen, setStartSprintOpen] = useState(false);
  const [sprintToStart, setSprintToStart] = useState<{ id: string; name: string } | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));

  // Get project
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const project = projects?.find(p => p.pkey === projectKey);

  // Get board for project
  const { data: boards, isLoading: boardsLoading } = useBoardsByProject(project?.id || '');
  const board = boards?.[0]; // Use first board

  // Get columns for board
  const { data: columns, isLoading: columnsLoading, refetch: refetchColumns } = useBoardColumns(board?.id || '');

  // Get active sprint (for Scrum only)
  const { data: activeSprint, isLoading: sprintLoading } = useActiveSprint(board?.id || '');
  
  // Get all sprints to check for future sprints
  const { data: allSprints } = useSprintsByBoard(board?.id || '');
  const futureSprints = (allSprints || []).filter(s => s.state === 'future');
  const startSprintMutation = useStartSprint();

  // Get sprint issues for Scrum boards
  const { data: sprintIssues, isLoading: sprintIssuesLoading, refetch: refetchSprintIssues } = useSprintIssues(activeSprint?.id || '');
  
  // Get all project issues for Kanban/Basic boards
  const { data: projectIssues, isLoading: projectIssuesLoading, refetch: refetchProjectIssues } = useIssuesByProject(project?.id || '');

  const executeTransition = useExecuteTransition();

  // Determine board type from project template
  const template = project?.template || 'scrum';
  const boardType = template === 'kanban' ? 'kanban' : template === 'basic' ? 'basic' : 'scrum';
  
  // For Scrum, use sprint issues; for Kanban/Basic, use project issues
  const isScrum = boardType === 'scrum';
  const issuesData = isScrum ? sprintIssues : projectIssues;
  const issuesLoading = isScrum ? sprintIssuesLoading : projectIssuesLoading;
  const refetchIssues = isScrum ? refetchSprintIssues : refetchProjectIssues;

  const isLoading = projectsLoading || boardsLoading || columnsLoading || 
    (isScrum && sprintLoading) || issuesLoading || isInitializingColumns;

  // Ensure the board has default columns (required for issues to show up in columns)
  useEffect(() => {
    if (!board?.id) return;
    if (columnsLoading) return;
    if (didAttemptInitColumns) return;

    const colCount = columns?.length ?? 0;
    if (colCount > 0) return;

    setDidAttemptInitColumns(true);

    let cancelled = false;
    const init = async () => {
      setIsInitializingColumns(true);
      try {
        // Pass the template to create appropriate columns
        const templateType = template === 'kanban' ? 'kanban' : template === 'basic' ? 'basic' : 'scrum';
        await boardService.createDefaultColumns(board.id, templateType);
        await refetchColumns();
      } catch (error) {
        console.error('Failed to initialize board columns:', error);
        toast.error('Failed to initialize board columns');
      } finally {
        if (!cancelled) setIsInitializingColumns(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [board?.id, columnsLoading, columns?.length, didAttemptInitColumns, refetchColumns, template]);

  // Real-time subscription for issues - refetch when issues change
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel(`board-issues-${project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues', filter: `project_id=eq.${project.id}` },
        () => {
          refetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, refetchIssues]);

  // For Scrum boards, sprint membership changes must also be real-time
  useEffect(() => {
    if (!isScrum || !activeSprint?.id) return;

    const channel = supabase
      .channel(`board-sprint-issues-${activeSprint.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprint_issues', filter: `sprint_id=eq.${activeSprint.id}` },
        () => {
          refetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isScrum, activeSprint?.id, refetchIssues]);

  const addCreatedIssueToActiveSprint = async (issueKey: string) => {
    if (!isScrum || !activeSprint?.id) return;

    try {
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .select('id')
        .eq('issue_key', issueKey)
        .maybeSingle();

      if (issueError) throw issueError;
      if (!issue?.id) return;

      const { error: insertError } = await supabase
        .from('sprint_issues')
        .insert({ sprint_id: activeSprint.id, issue_id: issue.id });

      // If already added, ignore
      if (insertError && !String(insertError.message || '').toLowerCase().includes('duplicate')) {
        throw insertError;
      }

      refetchIssues();
    } catch {
      toast.error('Issue created but could not be added to the active sprint');
      refetchIssues();
    }
  };

  const handleIssueMove = async (issueId: string, statusId: string) => {
    try {
      const result = await executeTransition.mutateAsync({ issueId, toStatusId: statusId });
      if (result.success) {
        refetchIssues();
      } else {
        toast.error(result.error || 'Cannot move issue - transition not allowed by workflow');
      }
    } catch {
      toast.error('Failed to move issue');
    }
  };

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssueId(issueId);
    setDetailModalOpen(true);
  };

  // Transform columns to board format
  const boardColumns = columns?.map(col => ({
    id: col.column_statuses?.[0]?.status?.id || col.id,
    name: col.name,
    statusCategory: (col.column_statuses?.[0]?.status?.category || 'todo') as 'todo' | 'in_progress' | 'done',
    maxIssues: col.max_issues || undefined,
    minIssues: col.min_issues || undefined,
  })) || [];

  // Transform issues to board format
  const boardIssues = (issuesData || []).map((issue: any) => ({
    id: issue.id,
    issue_key: issue.issue_key,
    summary: issue.summary,
    issue_type: issue.issue_type?.name || 'Task',
    priority: issue.priority?.name || 'Medium',
    status: issue.status?.id || '',
    assignee: issue.assignee ? {
      display_name: issue.assignee.display_name,
      avatar_url: issue.assignee.avatar_url,
    } : undefined,
    story_points: issue.story_points,
    classification: issue.classification,
    due_date: issue.due_date,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  // Get unique assignees
  type TeamMember = { id: string; display_name: string; avatar_url?: string };
  const teamMembersMap = new Map<string, TeamMember>();
  (issuesData || []).forEach((i: any) => {
    if (i.assignee && !teamMembersMap.has(i.assignee.id)) {
      teamMembersMap.set(i.assignee.id, {
        id: i.assignee.id,
        display_name: i.assignee.display_name,
        avatar_url: i.assignee.avatar_url,
      });
    }
  });
  const teamMembers: TeamMember[] = Array.from(teamMembersMap.values());

  if (isLoading) {
    return (
      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // Handle starting a sprint
  const handleOpenStartSprint = (sprint: { id: string; name: string }) => {
    setSprintToStart(sprint);
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 14));
    setStartSprintOpen(true);
  };

  const handleStartSprint = async () => {
    if (!sprintToStart) return;
    try {
      await startSprintMutation.mutateAsync({
        id: sprintToStart.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setStartSprintOpen(false);
      setSprintToStart(null);
    } catch {
      // Error is already handled by the mutation's onError handler
    }
  };

  // Render empty state for Scrum board when no active sprint but has future sprints
  const renderFutureSprintsState = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Play className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Ready to start a sprint?</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        You have {futureSprints.length} planned sprint{futureSprints.length > 1 ? 's' : ''} ready to go.
        Start a sprint to see its issues on the board.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {futureSprints.slice(0, 3).map((sprint) => (
          <Button
            key={sprint.id}
            onClick={() => handleOpenStartSprint({ id: sprint.id, name: sprint.name })}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start {sprint.name}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
        <Button variant="outline" asChild className="w-full">
          <Link to={`/projects/${projectKey}/backlog`}>
            <LayoutList className="h-4 w-4 mr-2" />
            Manage Sprints in Backlog
          </Link>
        </Button>
      </div>
    </div>
  );

  // Render empty state for Scrum board when no sprints at all
  const renderNoSprintsState = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <LayoutList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No sprints yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        In Scrum, the board displays issues from your active sprint. 
        Go to the backlog to create a sprint, add issues, then start it.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to={`/projects/${projectKey}/backlog`}>
            <LayoutList className="h-4 w-4 mr-2" />
            Go to Backlog
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setCreateIssueOpen(true)}>
          Create Issue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Render appropriate board type based on template
  const renderBoard = () => {
    // Build status category map from columns for accurate stats calculation
    const statusCategoryMap = new Map<string, string>();
    boardColumns.forEach(col => {
      statusCategoryMap.set(col.id, col.statusCategory);
    });

    const commonProps = {
      projectKey: projectKey || '',
      projectName: project?.name || 'Project',
      columns: boardColumns.length > 0 ? boardColumns : undefined,
      issues: boardIssues,
      teamMembers,
      statusCategoryMap,
      onIssueMove: handleIssueMove,
      onIssueSelect: handleIssueSelect,
      onCreateIssue: () => setCreateIssueOpen(true),
    };

    switch (boardType) {
      case 'kanban':
        return <KanbanBoard {...commonProps} />;
      case 'basic':
        return <BasicBoard {...commonProps} />;
      case 'scrum':
      default:
        // Show empty state when no active sprint
        if (!activeSprint) {
          // Check if there are future sprints ready to start
          if (futureSprints.length > 0) {
            return renderFutureSprintsState();
          }
          return renderNoSprintsState();
        }
        return (
          <ScrumBoard 
            {...commonProps}
            sprint={{
              id: activeSprint.id,
              name: activeSprint.name,
              goal: activeSprint.goal || undefined,
              state: activeSprint.state as any,
              start_date: activeSprint.start_date || undefined,
              end_date: activeSprint.end_date || undefined,
            }}
          />
        );
    }
  };

  return (
    <AppLayout showSidebar projectKey={projectKey}>
      {renderBoard()}

      {project && (
        <CreateIssueModal
          projectId={project.id}
          open={createIssueOpen}
          onOpenChange={setCreateIssueOpen}
          onSuccess={(issueKey) => {
            // If Scrum with active sprint, add issue to sprint
            if (isScrum && activeSprint) {
              addCreatedIssueToActiveSprint(issueKey);
              return;
            }
            // If Scrum with no active sprint, redirect to backlog so user can see the issue
            if (isScrum && !activeSprint) {
              toast.success(`${issueKey} created in backlog`, {
                description: 'Add it to a sprint and start the sprint to see it on the board.',
                action: {
                  label: 'Go to Backlog',
                  onClick: () => navigate(`/projects/${projectKey}/backlog`),
                },
              });
              navigate(`/projects/${projectKey}/backlog`);
              return;
            }
            refetchIssues();
          }}
        />
      )}

      <IssueDetailModal
        issueId={selectedIssueId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Start Sprint Dialog */}
      <Dialog open={startSprintOpen} onOpenChange={setStartSprintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start {sprintToStart?.name}</DialogTitle>
            <DialogDescription>
              Set the sprint duration and start working on the issues.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartSprintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSprint} disabled={startSprintMutation.isPending}>
              {startSprintMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
