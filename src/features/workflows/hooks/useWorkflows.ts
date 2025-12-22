import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as workflowService from '../services/workflowService';

export function useWorkflows(projectId?: string) {
  return useQuery({
    queryKey: ['workflows', projectId],
    queryFn: () => workflowService.getWorkflows(projectId),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowService.getWorkflow(id),
    enabled: !!id,
  });
}

export function useWorkflowWithDetails(id: string) {
  return useQuery({
    queryKey: ['workflow', id, 'details'],
    queryFn: () => workflowService.getWorkflowWithDetails(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowService.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create workflow: ' + error.message);
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<workflowService.WorkflowRow> }) =>
      workflowService.updateWorkflow(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      toast.success('Workflow updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update workflow: ' + error.message);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowService.deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete workflow: ' + error.message);
    },
  });
}

export function useCloneWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sourceWorkflowId, newName, projectId }: { 
      sourceWorkflowId: string; 
      newName: string; 
      projectId?: string;
    }) => workflowService.cloneWorkflow(sourceWorkflowId, newName, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow cloned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to clone workflow: ' + error.message);
    },
  });
}

// Workflow Steps
export function useAddWorkflowStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowService.addWorkflowStep,
    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', step.workflow_id, 'details'] });
      toast.success('Status added to workflow');
    },
    onError: (error: Error) => {
      toast.error('Failed to add status: ' + error.message);
    },
  });
}

export function useUpdateWorkflowStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof workflowService.updateWorkflowStep>[1] }) =>
      workflowService.updateWorkflowStep(id, data),
    onSuccess: (step) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', step.workflow_id, 'details'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update step: ' + error.message);
    },
  });
}

export function useDeleteWorkflowStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
      workflowService.deleteWorkflowStep(id),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId, 'details'] });
      toast.success('Status removed from workflow');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove status: ' + error.message);
    },
  });
}

// Workflow Transitions
export function useAddWorkflowTransition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowService.addWorkflowTransition,
    onSuccess: (transition) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', transition.workflow_id, 'details'] });
      toast.success('Transition added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add transition: ' + error.message);
    },
  });
}

export function useUpdateWorkflowTransition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof workflowService.updateWorkflowTransition>[1] }) =>
      workflowService.updateWorkflowTransition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow'] });
      toast.success('Transition updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update transition: ' + error.message);
    },
  });
}

export function useDeleteWorkflowTransition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
      workflowService.deleteWorkflowTransition(id),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId, 'details'] });
      toast.success('Transition removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove transition: ' + error.message);
    },
  });
}
