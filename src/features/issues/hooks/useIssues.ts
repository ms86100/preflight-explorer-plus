/**
 * @fileoverview React hooks for issue management operations.
 * @module features/issues/hooks/useIssues
 * 
 * @description
 * Provides React Query-based hooks for all issue-related data fetching and mutations.
 * Includes hooks for CRUD operations, reference data, and issue cloning.
 * 
 * @example
 * ```tsx
 * // Fetching issues for a project
 * const { data: issues, isLoading } = useIssuesByProject(projectId);
 * 
 * // Creating a new issue
 * const createIssue = useCreateIssue();
 * createIssue.mutate({ summary: 'New task', project_id: projectId, ... });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService, referenceDataService, type IssueInsert } from '../services/issueService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ClassificationLevel } from '@/types/jira';

/**
 * Fetches all issues for a specific project.
 * 
 * @param projectId - The UUID of the project to fetch issues for
 * @returns React Query result with issues array, loading state, and error
 * 
 * @example
 * ```tsx
 * function IssueList({ projectId }: { projectId: string }) {
 *   const { data: issues, isLoading, error } = useIssuesByProject(projectId);
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <ul>{issues?.map(issue => <IssueItem key={issue.id} issue={issue} />)}</ul>;
 * }
 * ```
 */
export function useIssuesByProject(projectId: string) {
  return useQuery({
    queryKey: ['issues', 'project', projectId],
    queryFn: () => issueService.getByProject(projectId),
    enabled: !!projectId,
  });
}

/**
 * Fetches a single issue by its human-readable key (e.g., "PROJ-123").
 * 
 * @param issueKey - The issue key in format "PROJECT-NUMBER"
 * @returns React Query result with issue data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: issue } = useIssue('PROJ-123');
 * ```
 */
export function useIssue(issueKey: string) {
  return useQuery({
    queryKey: ['issue', issueKey],
    queryFn: () => issueService.getByKey(issueKey),
    enabled: !!issueKey,
  });
}

/**
 * Fetches a single issue by its UUID.
 * 
 * @param id - The UUID of the issue
 * @returns React Query result with issue data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: issue } = useIssueById('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export function useIssueById(id: string) {
  return useQuery({
    queryKey: ['issue', 'id', id],
    queryFn: () => issueService.getById(id),
    enabled: !!id,
  });
}

/**
 * Creates a new issue mutation hook.
 * Automatically invalidates issue queries on success and shows toast notifications.
 * 
 * @returns React Query mutation for creating issues
 * 
 * @example
 * ```tsx
 * function CreateIssueForm() {
 *   const createIssue = useCreateIssue();
 *   
 *   const handleSubmit = (data: IssueInsert) => {
 *     createIssue.mutate(data, {
 *       onSuccess: (issue) => {
 *         navigate(`/issue/${issue.issue_key}`);
 *       }
 *     });
 *   };
 *   
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
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

/**
 * Updates an existing issue mutation hook.
 * Automatically invalidates relevant queries on success.
 * 
 * @returns React Query mutation for updating issues
 * 
 * @example
 * ```tsx
 * const updateIssue = useUpdateIssue();
 * 
 * updateIssue.mutate({
 *   id: issueId,
 *   updates: { summary: 'Updated title', priority_id: newPriorityId }
 * });
 * ```
 */
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
    onError: () => {
      toast.error('Failed to update issue.');
    },
  });
}

/**
 * Updates only the status of an issue.
 * Optimized for drag-and-drop board operations.
 * Does not show toast on success for smoother UX.
 * 
 * @returns React Query mutation for status updates
 * 
 * @example
 * ```tsx
 * const updateStatus = useUpdateIssueStatus();
 * 
 * // Called when dropping issue on a new column
 * updateStatus.mutate({ id: issueId, statusId: newStatusId });
 * ```
 */
export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: string }) =>
      issueService.updateStatus(id, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: () => {
      toast.error('Failed to update issue status.');
    },
  });
}

/**
 * Deletes an issue permanently.
 * Shows confirmation toast on success.
 * 
 * @returns React Query mutation for deleting issues
 * 
 * @example
 * ```tsx
 * const deleteIssue = useDeleteIssue();
 * 
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     deleteIssue.mutate(issueId);
 *   }
 * };
 * ```
 */
export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => issueService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue deleted!');
    },
    onError: () => {
      toast.error('Failed to delete issue.');
    },
  });
}

/**
 * Creates a copy of an existing issue with "[CLONE]" prefix.
 * Copies most fields except for time tracking and resolution.
 * 
 * @returns React Query mutation for cloning issues
 * 
 * @example
 * ```tsx
 * const cloneIssue = useCloneIssue();
 * 
 * const handleClone = () => {
 *   cloneIssue.mutate(sourceIssueId, {
 *     onSuccess: (clonedIssue) => {
 *       navigate(`/issue/${clonedIssue.issue_key}`);
 *     }
 *   });
 * };
 * ```
 */
export function useCloneIssue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sourceIssueId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Fetch the source issue
      const sourceIssue = await issueService.getById(sourceIssueId);
      if (!sourceIssue) throw new Error('Source issue not found');

      // Create a cloned issue
      const clonedIssue: IssueInsert = {
        project_id: sourceIssue.project_id,
        summary: `[CLONE] ${sourceIssue.summary}`,
        description: sourceIssue.description || undefined,
        issue_type_id: sourceIssue.issue_type_id,
        status_id: sourceIssue.status_id,
        priority_id: sourceIssue.priority_id || undefined,
        story_points: sourceIssue.story_points || undefined,
        epic_id: sourceIssue.epic_id || undefined,
        classification: (sourceIssue.classification as ClassificationLevel) || undefined,
      };

      return issueService.create(clonedIssue, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(`Issue cloned as ${data.issue_key}`);
    },
    onError: () => {
      toast.error('Failed to clone issue.');
    },
  });
}

// ============================================================================
// Reference Data Hooks
// ============================================================================

/**
 * Fetches all available issue types.
 * Uses infinite stale time as reference data rarely changes.
 * 
 * @returns React Query result with issue types array
 * 
 * @example
 * ```tsx
 * const { data: issueTypes } = useIssueTypes();
 * 
 * return (
 *   <Select>
 *     {issueTypes?.map(type => (
 *       <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useIssueTypes() {
  return useQuery({
    queryKey: ['issueTypes'],
    queryFn: referenceDataService.getIssueTypes,
    staleTime: Infinity, // Reference data rarely changes
  });
}

/**
 * Fetches all available priority levels.
 * Uses infinite stale time as reference data rarely changes.
 * 
 * @returns React Query result with priorities array
 */
export function usePriorities() {
  return useQuery({
    queryKey: ['priorities'],
    queryFn: referenceDataService.getPriorities,
    staleTime: Infinity,
  });
}

/**
 * Fetches all available issue statuses.
 * Uses infinite stale time as reference data rarely changes.
 * 
 * @returns React Query result with statuses array
 */
export function useStatuses() {
  return useQuery({
    queryKey: ['statuses'],
    queryFn: referenceDataService.getStatuses,
    staleTime: Infinity,
  });
}

/**
 * Creates a new issue status.
 * Automatically invalidates statuses query on success.
 * 
 * @returns React Query mutation for creating statuses
 * 
 * @example
 * ```tsx
 * const createStatus = useCreateStatus();
 * 
 * createStatus.mutate({
 *   name: 'Code Review',
 *   category: 'in_progress',
 *   color: '#9333ea'
 * });
 * ```
 */
export function useCreateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: {
      name: string;
      category: 'todo' | 'in_progress' | 'done';
      color?: string;
      description?: string;
    }) => referenceDataService.createStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      toast.success('Status created!');
    },
    onError: () => {
      toast.error('Failed to create status.');
    },
  });
}

/**
 * Fetches all available resolution types.
 * Uses infinite stale time as reference data rarely changes.
 * 
 * @returns React Query result with resolutions array
 */
export function useResolutions() {
  return useQuery({
    queryKey: ['resolutions'],
    queryFn: referenceDataService.getResolutions,
    staleTime: Infinity,
  });
}
