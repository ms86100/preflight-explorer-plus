import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Component {
  id: string;
  name: string;
  description: string | null;
  lead_id: string | null;
  project_id: string;
  default_assignee_type: 'component_lead' | 'project_lead' | 'project_default' | 'unassigned' | null;
  is_archived: boolean | null;
  created_at: string;
  lead?: { display_name: string | null; avatar_url: string | null } | null;
  issue_count?: number;
}

export function useProjectComponents(projectId: string | undefined) {
  return useQuery({
    queryKey: ['components', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await (supabase.from as any)('components')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      
      if (error) throw error;
      
      // Fetch leads from user_directory
      const leadIds = (data as any[]).filter((c: any) => c.lead_id).map((c: any) => c.lead_id);
      let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      
      if (leadIds.length > 0) {
        const { data: profiles } = await (supabase.from as any)('user_directory')
          .select('id, display_name, avatar_url')
          .in('id', leadIds);
        profileMap = new Map((profiles as any[])?.map((p: any) => [p.id, p]) || []);
      }
      
      // Fetch issue counts per component
      const componentIds = (data as any[]).map((c: any) => c.id);
      const { data: issueCounts } = await (supabase.from as any)('issue_components')
        .select('component_id')
        .in('component_id', componentIds);
      
      const countMap = new Map<string, number>();
      (issueCounts as any[] || []).forEach((ic: any) => {
        countMap.set(ic.component_id, (countMap.get(ic.component_id) || 0) + 1);
      });
      
      return (data as any[]).map((c: any) => ({
        ...c,
        lead: c.lead_id ? profileMap.get(c.lead_id) || null : null,
        issue_count: countMap.get(c.id) || 0,
      })) as Component[];
    },
    enabled: !!projectId,
  });
}

export function useIssueComponents(issueId: string | undefined) {
  return useQuery({
    queryKey: ['issue-components', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      
      const { data, error } = await (supabase.from as any)('issue_components')
        .select('component_id, components(id, name)')
        .eq('issue_id', issueId);
      
      if (error) throw error;
      
      return (data as any[]).map((ic: any) => ic.components).filter(Boolean) as { id: string; name: string }[];
    },
    enabled: !!issueId,
  });
}

export function useUpdateIssueComponents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ issueId, componentIds }: { issueId: string; componentIds: string[] }) => {
      // Delete existing
      await (supabase.from as any)('issue_components').delete().eq('issue_id', issueId);
      
      // Insert new
      if (componentIds.length > 0) {
        const inserts = componentIds.map(componentId => ({
          issue_id: issueId,
          component_id: componentId,
        }));
        const { error } = await (supabase.from as any)('issue_components').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: (_, { issueId }) => {
      queryClient.invalidateQueries({ queryKey: ['issue-components', issueId] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}
