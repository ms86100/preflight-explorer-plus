import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService, sprintService } from '../services/boardService';
import { toast } from 'sonner';

export function useBoardsByProject(projectId: string) {
  return useQuery({
    queryKey: ['boards', 'project', projectId],
    queryFn: () => boardService.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => boardService.getById(id),
    enabled: !!id,
  });
}

export function useBoardColumns(boardId: string) {
  return useQuery({
    queryKey: ['boardColumns', boardId],
    queryFn: () => boardService.getColumns(boardId),
    enabled: !!boardId,
  });
}

export function useSprintsByBoard(boardId: string) {
  return useQuery({
    queryKey: ['sprints', 'board', boardId],
    queryFn: () => sprintService.getByBoard(boardId),
    enabled: !!boardId,
  });
}

export function useActiveSprint(boardId: string) {
  return useQuery({
    queryKey: ['sprint', 'active', boardId],
    queryFn: () => sprintService.getActive(boardId),
    enabled: !!boardId,
  });
}

export function useSprintIssues(sprintId: string) {
  return useQuery({
    queryKey: ['sprintIssues', sprintId],
    queryFn: () => sprintService.getIssues(sprintId),
    enabled: !!sprintId,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprint: { board_id: string; name: string; goal?: string; start_date?: string; end_date?: string }) =>
      sprintService.create(sprint),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success(`Sprint "${data.name}" created!`);
    },
    onError: () => {
      toast.error('Failed to create sprint.');
    },
  });
}

export function useStartSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, startDate, endDate }: { id: string; startDate: string; endDate: string }) =>
      sprintService.start(id, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', 'active'] });
      toast.success('Sprint started!');
    },
    onError: () => {
      toast.error('Failed to start sprint.');
    },
  });
}

export function useCompleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', 'active'] });
      toast.success('Sprint completed!');
    },
    onError: () => {
      toast.error('Failed to complete sprint.');
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; goal?: string; start_date?: string; end_date?: string } }) =>
      sprintService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success(`Sprint "${data.name}" updated!`);
    },
    onError: () => {
      toast.error('Failed to update sprint.');
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sprintService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint deleted!');
    },
    onError: () => {
      toast.error('Failed to delete sprint.');
    },
  });
}

export function useMoveIssuesToBacklog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => sprintService.moveAllIssuesToBacklog(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprintIssues'] });
      queryClient.invalidateQueries({ queryKey: ['all-sprint-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issues moved to backlog!');
    },
    onError: () => {
      toast.error('Failed to move issues to backlog.');
    },
  });
}

export function useAddIssueToSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, issueId }: { sprintId: string; issueId: string }) =>
      sprintService.addIssue(sprintId, issueId),
    onSuccess: () => {
      // Invalidate all sprint-issue related queries for real-time update
      queryClient.invalidateQueries({ queryKey: ['sprintIssues'] });
      queryClient.invalidateQueries({ queryKey: ['all-sprint-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

export function useRemoveIssueFromSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, issueId }: { sprintId: string; issueId: string }) =>
      sprintService.removeIssue(sprintId, issueId),
    onSuccess: () => {
      // Invalidate all sprint-issue related queries for real-time update
      queryClient.invalidateQueries({ queryKey: ['sprintIssues'] });
      queryClient.invalidateQueries({ queryKey: ['all-sprint-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
