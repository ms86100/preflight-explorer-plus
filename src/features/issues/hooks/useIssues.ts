import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService, referenceDataService, type IssueInsert } from '../services/issueService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useIssuesByProject(projectId: string) {
  return useQuery({
    queryKey: ['issues', 'project', projectId],
    queryFn: () => issueService.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useIssue(issueKey: string) {
  return useQuery({
    queryKey: ['issue', issueKey],
    queryFn: () => issueService.getByKey(issueKey),
    enabled: !!issueKey,
  });
}

export function useIssueById(id: string) {
  return useQuery({
    queryKey: ['issue', 'id', id],
    queryFn: () => issueService.getById(id),
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (issue: IssueInsert) => {
      if (!user?.id) throw new Error('User not authenticated');
      return issueService.create(issue, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(`Issue ${data.issue_key} created!`);
    },
    onError: () => {
      toast.error('Failed to create issue. Please try again.');
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IssueInsert> }) =>
      issueService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', data.issue_key] });
      toast.success('Issue updated!');
    },
    onError: (error) => {
      console.error('Failed to update issue:', error);
      toast.error('Failed to update issue.');
    },
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: string }) =>
      issueService.updateStatus(id, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => {
      console.error('Failed to update issue status:', error);
      toast.error('Failed to update issue status.');
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issueService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue deleted!');
    },
    onError: (error) => {
      console.error('Failed to delete issue:', error);
      toast.error('Failed to delete issue.');
    },
  });
}

// Reference data hooks
export function useIssueTypes() {
  return useQuery({
    queryKey: ['issueTypes'],
    queryFn: referenceDataService.getIssueTypes,
    staleTime: Infinity, // Reference data rarely changes
  });
}

export function usePriorities() {
  return useQuery({
    queryKey: ['priorities'],
    queryFn: referenceDataService.getPriorities,
    staleTime: Infinity,
  });
}

export function useStatuses() {
  return useQuery({
    queryKey: ['statuses'],
    queryFn: referenceDataService.getStatuses,
    staleTime: Infinity,
  });
}

export function useResolutions() {
  return useQuery({
    queryKey: ['resolutions'],
    queryFn: referenceDataService.getResolutions,
    staleTime: Infinity,
  });
}
