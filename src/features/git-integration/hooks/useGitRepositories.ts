// Hook for managing Git repositories

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGitRepositories,
  getGitRepository,
  linkRepository,
  unlinkRepository,
  updateRepository,
} from '../services/gitIntegrationService';
import type { LinkRepositoryInput, UpdateRepositoryInput } from '../types';

const QUERY_KEY = 'git-repositories';

export function useGitRepositories(projectId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, projectId],
    queryFn: () => getGitRepositories(projectId),
  });
}

export function useGitRepository(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'single', id],
    queryFn: () => (id ? getGitRepository(id) : null),
    enabled: !!id,
  });
}

function createRepositoryMutation(queryClient: ReturnType<typeof useQueryClient>) {
  return {
    mutationFn: (input: LinkRepositoryInput) => linkRepository(input),
    onSuccess: (_: Awaited<ReturnType<typeof linkRepository>>, variables: LinkRepositoryInput) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.project_id] });
      toast.success('Repository linked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to link repository: ${error.message}`);
    },
  };
}

function deleteRepositoryMutation(queryClient: ReturnType<typeof useQueryClient>) {
  return {
    mutationFn: (id: string) => unlinkRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Repository unlinked');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unlink repository: ${error.message}`);
    },
  };
}

export function useCreateGitRepository() {
  const queryClient = useQueryClient();
  return useMutation(createRepositoryMutation(queryClient));
}

export function useUpdateGitRepository() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & UpdateRepositoryInput) =>
      updateRepository(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Repository updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update repository: ${error.message}`);
    },
  });
}

export function useDeleteGitRepository() {
  const queryClient = useQueryClient();
  return useMutation(deleteRepositoryMutation(queryClient));
}

export function useLinkRepository() {
  const queryClient = useQueryClient();
  return useMutation(createRepositoryMutation(queryClient));
}

export function useUnlinkRepository() {
  const queryClient = useQueryClient();
  return useMutation(deleteRepositoryMutation(queryClient));
}
