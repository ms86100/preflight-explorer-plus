// Hook for managing Git repositories

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGitRepositories,
  getGitRepository,
  linkRepository,
  unlinkRepository,
} from '../services/gitIntegrationService';
import type { LinkRepositoryInput } from '../types';

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

export function useLinkRepository() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: LinkRepositoryInput) => linkRepository(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.project_id] });
      toast.success('Repository linked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to link repository: ${error.message}`);
    },
  });
}

export function useUnlinkRepository() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => unlinkRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Repository unlinked');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unlink repository: ${error.message}`);
    },
  });
}
