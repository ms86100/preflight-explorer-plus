import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Type bypass for tables not in generated types
const db = supabase as any;

export interface Version {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  release_date: string | null;
  is_released: boolean;
  is_archived: boolean;
  project_id: string;
  sequence: number | null;
}

export interface VersionWithCounts extends Version {
  total_issues: number;
  done_issues: number;
}

export function useProjectVersions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Version[];
    },
    enabled: !!projectId,
  });
}

export function useVersionIssueCounts(projectId: string | undefined, versions: Version[] | undefined) {
  return useQuery({
    queryKey: ['version-issue-counts', projectId],
    queryFn: async () => {
      if (!projectId || !versions?.length) return {};
      
      const versionIds = versions.map(v => v.id);
      
      // Get all fix version links with issue status
      const { data: fixVersions, error } = await db
        .from('issue_fix_versions')
        .select('version_id, issues(id, status:issue_statuses(category))')
        .in('version_id', versionIds);
      
      if (error) throw error;
      
      const counts: Record<string, { total: number; done: number }> = {};
      versionIds.forEach(id => {
        counts[id] = { total: 0, done: 0 };
      });
      
      fixVersions?.forEach((fv: any) => {
        if (fv.version_id) {
          counts[fv.version_id].total++;
          const issue = fv.issues as { status: { category: string } | null };
          if (issue?.status?.category === 'done') {
            counts[fv.version_id].done++;
          }
        }
      });
      
      return counts;
    },
    enabled: !!projectId && !!versions?.length,
  });
}

export function useIssueFixVersions(issueId: string | undefined) {
  return useQuery({
    queryKey: ['issue-fix-versions', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      
      const { data, error } = await db
        .from('issue_fix_versions')
        .select('version_id, versions(id, name, is_released)')
        .eq('issue_id', issueId);
      
      if (error) throw error;
      
      return (data || []).map((iv: any) => iv.versions).filter(Boolean) as { id: string; name: string; is_released: boolean }[];
    },
    enabled: !!issueId,
  });
}

export function useIssueAffectsVersions(issueId: string | undefined) {
  return useQuery({
    queryKey: ['issue-affects-versions', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      
      const { data, error } = await db
        .from('issue_affects_versions')
        .select('version_id, versions(id, name, is_released)')
        .eq('issue_id', issueId);
      
      if (error) throw error;
      
      return (data || []).map((iv: any) => iv.versions).filter(Boolean) as { id: string; name: string; is_released: boolean }[];
    },
    enabled: !!issueId,
  });
}

export function useUpdateIssueFixVersions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, versionIds }: { issueId: string; versionIds: string[] }) => {
      await db.from('issue_fix_versions').delete().eq('issue_id', issueId);
      
      if (versionIds.length > 0) {
        const inserts = versionIds.map(versionId => ({
          issue_id: issueId,
          version_id: versionId,
        }));
        const { error } = await db.from('issue_fix_versions').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: ['issue-fix-versions', issueId] });
      queryClient.invalidateQueries({ queryKey: ['version-issue-counts'] });
    },
  });
}

export function useUpdateIssueAffectsVersions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, versionIds }: { issueId: string; versionIds: string[] }) => {
      await db.from('issue_affects_versions').delete().eq('issue_id', issueId);
      
      if (versionIds.length > 0) {
        const inserts = versionIds.map(versionId => ({
          issue_id: issueId,
          version_id: versionId,
        }));
        const { error } = await db.from('issue_affects_versions').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: ['issue-affects-versions', issueId] });
      queryClient.invalidateQueries({ queryKey: ['version-issue-counts'] });
    },
  });
}

export function useUnarchiveVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('versions')
        .update({ is_archived: false })
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
    },
  });
}

export function useUpdateVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ versionId, updates }: { 
      versionId: string; 
      updates: Partial<Pick<Version, 'name' | 'description' | 'start_date' | 'release_date'>> 
    }) => {
      const { error } = await supabase
        .from('versions')
        .update(updates)
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
    },
  });
}
