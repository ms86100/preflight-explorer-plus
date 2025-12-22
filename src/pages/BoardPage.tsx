import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { ScrumBoard } from '@/features/boards';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useBoardsByProject, useBoardColumns, useActiveSprint, useSprintIssues } from '@/features/boards/hooks/useBoards';
import { CreateIssueModal } from '@/features/issues/components/CreateIssueModal';
import { IssueDetailModal } from '@/features/issues/components/IssueDetailModal';
import { useExecuteTransition } from '@/features/workflows';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

  // Get active sprint
  const { data: activeSprint, isLoading: sprintLoading } = useActiveSprint(board?.id || '');

  // Get sprint issues
  const { data: sprintIssues, isLoading: issuesLoading, refetch: refetchIssues } = useSprintIssues(activeSprint?.id || '');

  const executeTransition = useExecuteTransition();

  const isLoading = projectsLoading || boardsLoading || columnsLoading || sprintLoading || issuesLoading;

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
  })) || [];

  // Transform issues to board format
  const boardIssues = (sprintIssues || []).map((issue: any) => ({
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
  }));

  // Get unique assignees
  const teamMembers = [...new Map((sprintIssues || [])
    .filter((i: any) => i.assignee)
    .map((i: any) => [i.assignee.id, {
      id: i.assignee.id,
      display_name: i.assignee.display_name,
      avatar_url: i.assignee.avatar_url,
    }])
  ).values()];

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
    <AppLayout showSidebar projectKey={projectKey}>
      <ScrumBoard 
        projectKey={projectKey || ''} 
        projectName={project?.name || 'Project'}
        sprint={activeSprint ? {
          id: activeSprint.id,
          name: activeSprint.name,
          goal: activeSprint.goal || undefined,
          state: activeSprint.state as any,
          start_date: activeSprint.start_date || undefined,
          end_date: activeSprint.end_date || undefined,
        } : undefined}
        columns={boardColumns.length > 0 ? boardColumns : undefined}
        issues={boardIssues}
        teamMembers={teamMembers}
        onIssueMove={handleIssueMove}
        onIssueSelect={handleIssueSelect}
        onCreateIssue={() => setCreateIssueOpen(true)}
      />

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