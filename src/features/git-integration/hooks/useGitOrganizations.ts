// Hook for managing Git organizations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGitOrganizations,
  getGitOrganization,
  createGitOrganization,
  updateGitOrganization,
  deleteGitOrganization,
} from '../services/gitIntegrationService';
import type { CreateGitOrganizationInput } from '../types';

const QUERY_KEY = 'git-organizations';

export function useGitOrganizations() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getGitOrganizations,
  });
}

export function useGitOrganization(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? getGitOrganization(id) : null),
    enabled: !!id,
  });
}

export function useCreateGitOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateGitOrganizationInput) => createGitOrganization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Git organization connected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect Git organization: ${error.message}`);
    },
  });
}

export function useUpdateGitOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateGitOrganizationInput> }) =>
      updateGitOrganization(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Git organization updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update Git organization: ${error.message}`);
    },
  });
}

export function useDeleteGitOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteGitOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Git organization disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect Git organization: ${error.message}`);
    },
  });
}
