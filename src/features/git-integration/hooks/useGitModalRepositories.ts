/**
 * Shared hook for loading Git repositories in modal dialogs.
 * Reduces duplication between CreateBranchModal, CreatePRModal, and TriggerBuildModal.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GitRepository } from '../types';

interface UseGitModalRepositoriesResult {
  readonly repositories: GitRepository[];
  readonly loading: boolean;
  readonly loadRepositories: (projectId: string) => Promise<void>;
}

/**
 * Hook for loading Git repositories for modal dialogs.
 * Centralizes the repository fetching logic used across multiple git modals.
 */
export function useGitModalRepositories(): UseGitModalRepositoriesResult {
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRepositories = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('git_repositories')
        .select('*, organization:git_organizations(*)')
        .eq('project_id', projectId)
        .eq('is_active', true);
      
      if (error) throw error;
      setRepositories(data as unknown as GitRepository[]);
    } catch {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { repositories, loading, loadRepositories };
}
