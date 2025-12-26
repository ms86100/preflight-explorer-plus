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
        .eq('project_id', projectId);
      
      if (error) throw error;
      // Map to GitRepository interface
      const repos = (data || []).map((r: any) => ({
        id: r.id,
        organization_id: r.organization_id,
        project_id: r.project_id,
        remote_id: r.remote_id || r.id,
        name: r.name,
        slug: r.slug || r.name,
        clone_url: r.clone_url || r.url,
        web_url: r.web_url || r.url,
        default_branch: r.default_branch || 'main',
        smartcommits_enabled: r.smartcommits_enabled ?? true,
        is_active: r.is_active ?? r.is_linked ?? true,
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
        organization: r.organization,
      })) as GitRepository[];
      setRepositories(repos);
    } catch {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { repositories, loading, loadRepositories };
}
