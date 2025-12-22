import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as executionService from '../services/workflowExecutionService';

/**
 * Hook to get available transitions for an issue
 */
export function useAvailableTransitions(issueId: string | null) {
  return useQuery({
    queryKey: ['available-transitions', issueId],
    queryFn: () => executionService.getAvailableTransitions(issueId!),
    enabled: !!issueId,
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Hook to validate a status transition
 */
export function useValidateTransition() {
  return useMutation({
    mutationFn: ({ issueId, fromStatusId, toStatusId }: {
      issueId: string;
      fromStatusId: string;
      toStatusId: string;
    }) => executionService.validateTransition(issueId, fromStatusId, toStatusId),
  });
}

/**
 * Hook to execute a status transition with validation
 */
export function useExecuteTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, toStatusId }: { issueId: string; toStatusId: string }) =>
      executionService.executeTransition(issueId, toStatusId),
    onSuccess: (result, { issueId }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
        queryClient.invalidateQueries({ queryKey: ['issues'] });
        queryClient.invalidateQueries({ queryKey: ['available-transitions', issueId] });
        toast.success('Status updated');
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

/**
 * Hook to get all workflow schemes
 */
export function useWorkflowSchemes() {
  return useQuery({
    queryKey: ['workflow-schemes'],
    queryFn: executionService.getWorkflowSchemes,
  });
}

/**
 * Hook to get a workflow scheme with its mappings
 */
export function useWorkflowSchemeWithMappings(schemeId: string | null) {
  return useQuery({
    queryKey: ['workflow-scheme', schemeId, 'mappings'],
    queryFn: () => executionService.getWorkflowSchemeWithMappings(schemeId!),
    enabled: !!schemeId,
  });
}

/**
 * Hook to get a project's workflow scheme
 */
export function useProjectWorkflowScheme(projectId: string | null) {
  return useQuery({
    queryKey: ['project-workflow-scheme', projectId],
    queryFn: () => executionService.getProjectWorkflowScheme(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Hook to assign a workflow scheme to a project
 */
export function useAssignWorkflowScheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, schemeId }: { projectId: string; schemeId: string }) =>
      executionService.assignWorkflowSchemeToProject(projectId, schemeId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-workflow-scheme', projectId] });
      toast.success('Workflow scheme assigned');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign workflow scheme: ' + error.message);
    },
  });
}

/**
 * Hook to create a new workflow scheme
 */
export function useCreateWorkflowScheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executionService.createWorkflowScheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-schemes'] });
      toast.success('Workflow scheme created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create workflow scheme: ' + error.message);
    },
  });
}

/**
 * Hook to upsert a workflow scheme mapping
 */
export function useUpsertWorkflowSchemeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executionService.upsertWorkflowSchemeMapping,
    onSuccess: (_, { scheme_id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-scheme', scheme_id, 'mappings'] });
      toast.success('Mapping updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update mapping: ' + error.message);
    },
  });
}

/**
 * Hook to delete a workflow scheme mapping
 */
export function useDeleteWorkflowSchemeMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executionService.deleteWorkflowSchemeMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-scheme'] });
      toast.success('Mapping deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete mapping: ' + error.message);
    },
  });
}
