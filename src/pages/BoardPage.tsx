import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ScrumBoard, KanbanBoard, BasicBoard } from '@/features/boards';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useBoardsByProject, useBoardColumns, useActiveSprint, useSprintIssues } from '@/features/boards/hooks/useBoards';
import { CreateIssueModal } from '@/features/issues/components/CreateIssueModal';
import { IssueDetailModal } from '@/features/issues/components/IssueDetailModal';
import { useExecuteTransition } from '@/features/workflows';
import { useIssuesByProject } from '@/features/issues';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function BoardPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Get project
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const project = projects?.find(p => p.pkey === projectKey);

  // Get board for project
  const { data: boards, isLoading: boardsLoading } = useBoardsByProject(project?.id || '');
  const board = boards?.[0]; // Use first board

  // Get columns for board
  const { data: columns, isLoading: columnsLoading } = useBoardColumns(board?.id || '');

  // Get active sprint (for Scrum only)
  const { data: activeSprint, isLoading: sprintLoading } = useActiveSprint(board?.id || '');

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
    (isScrum && sprintLoading) || issuesLoading;

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
    } catch (error) {
      console.error('Failed to add issue to active sprint:', error);
      toast.error('Issue created but could not be added to the active sprint');
      // Still refresh to reflect creation elsewhere
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
    } catch (error) {
      console.error('Failed to move issue:', error);
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

  // Render appropriate board type based on template
  const renderBoard = () => {
    const commonProps = {
      projectKey: projectKey || '',
      projectName: project?.name || 'Project',
      columns: boardColumns.length > 0 ? boardColumns : undefined,
      issues: boardIssues,
      teamMembers,
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
        return (
          <ScrumBoard 
            {...commonProps}
            sprint={activeSprint ? {
              id: activeSprint.id,
              name: activeSprint.name,
              goal: activeSprint.goal || undefined,
              state: activeSprint.state as any,
              start_date: activeSprint.start_date || undefined,
              end_date: activeSprint.end_date || undefined,
            } : undefined}
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
          onSuccess={() => refetchIssues()}
        />
      )}

      <IssueDetailModal
        issueId={selectedIssueId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </AppLayout>
  );
}
