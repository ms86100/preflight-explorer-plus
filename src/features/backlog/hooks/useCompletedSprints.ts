import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import type {
  SprintWithDetails,
  SprintIssue,
  Contributor,
  SprintStats,
  SprintHistoryItem,
} from '../types/sprint';

export function useCompletedSprints(boardId: string) {
  return useQuery({
    queryKey: ['completed-sprints-detailed', boardId],
    queryFn: async (): Promise<SprintWithDetails[]> => {
      try {
        const { data: sprints, error: sprintsError } = await (supabase.from as any)('sprints')
          .select('*')
          .eq('board_id', boardId)
          .eq('state', 'closed')
          .order('completed_date', { ascending: false });

        if (sprintsError) {
          console.warn('Sprints table not available:', sprintsError.message);
          return [];
        }
        if (!sprints?.length) return [];

        const detailedSprints: SprintWithDetails[] = [];

        for (const sprint of sprints as any[]) {
          const { data: sprintIssues } = await (supabase.from as any)('sprint_issues')
            .select(`
              issue_id,
              issues (
                id,
                issue_key,
                summary,
                assignee_id,
                story_points,
                issue_types:issue_type_id (name),
                issue_statuses:status_id (name, category, color)
              )
            `)
            .eq('sprint_id', sprint.id);

          const issues: SprintIssue[] = (sprintIssues || []).map((si: any) => ({
            id: si.issues?.id || si.issue_id,
            issue_key: si.issues?.issue_key || 'Unknown',
            summary: si.issues?.summary || '',
            status_name: si.issues?.issue_statuses?.name || 'Unknown',
            status_category: si.issues?.issue_statuses?.category || 'todo',
            status_color: si.issues?.issue_statuses?.color || null,
            assignee_id: si.issues?.assignee_id || null,
            assignee_name: null,
            issue_type_name: si.issues?.issue_types?.name || 'Task',
            story_points: si.issues?.story_points || null,
          }));

          const assigneeIds = [...new Set(issues.filter(i => i.assignee_id).map(i => i.assignee_id))] as string[];
          if (assigneeIds.length > 0) {
            const { data: profiles } = await (supabase.from as any)('profiles')
              .select('id, display_name')
              .in('id', assigneeIds);
            const profileMap = new Map((profiles as any[] || []).map((p) => [p.id, p.display_name]));
            issues.forEach(issue => {
              if (issue.assignee_id) {
                issue.assignee_name = profileMap.get(issue.assignee_id) || null;
              }
            });
          }

          const contributorMap = new Map<string, Contributor>();
          issues.forEach(issue => {
            if (issue.assignee_id && issue.status_category === 'done') {
              const existing = contributorMap.get(issue.assignee_id);
              if (existing) {
                existing.issuesCompleted++;
                existing.storyPointsCompleted += issue.story_points || 0;
              } else {
                contributorMap.set(issue.assignee_id, {
                  id: issue.assignee_id,
                  name: issue.assignee_name || 'Unknown',
                  avatar_url: null,
                  issuesCompleted: 1,
                  storyPointsCompleted: issue.story_points || 0,
                });
              }
            }
          });

          const completedIssues = issues.filter(i => i.status_category === 'done');
          const totalStoryPoints = issues.reduce((sum, i) => sum + (i.story_points || 0), 0);
          const completedStoryPoints = completedIssues.reduce((sum, i) => sum + (i.story_points || 0), 0);
          const durationDays = sprint.start_date && sprint.completed_date
            ? differenceInDays(new Date(sprint.completed_date), new Date(sprint.start_date))
            : 0;

          const stats: SprintStats = {
            totalIssues: issues.length,
            completedIssues: completedIssues.length,
            totalStoryPoints,
            completedStoryPoints,
            completionRate: issues.length > 0 ? Math.round((completedIssues.length / issues.length) * 100) : 0,
            durationDays,
          };

          const { data: historyData } = await (supabase.from as any)('sprint_history')
            .select('*')
            .eq('sprint_id', sprint.id)
            .order('created_at', { ascending: true });

          const historyActorIds = [...new Set((historyData || []).filter((h: any) => h.actor_id).map((h: any) => h.actor_id))] as string[];
          let historyActorMap = new Map<string, string>();
          if (historyActorIds.length > 0) {
            const { data: actorProfiles } = await (supabase.from as any)('profiles')
              .select('id, display_name')
              .in('id', historyActorIds);
            historyActorMap = new Map((actorProfiles as any[] || []).map((p) => [p.id, p.display_name]));
          }

          const history: SprintHistoryItem[] = (historyData || []).map((h: any) => ({
            id: h.id,
            action: h.action,
            actor_name: h.actor_id ? historyActorMap.get(h.actor_id) || 'Unknown' : null,
            issue_key: h.issue_key,
            created_at: h.created_at,
            metadata: h.metadata as Record<string, unknown> | null,
          }));

          detailedSprints.push({
            ...sprint,
            issues,
            contributors: Array.from(contributorMap.values()).sort((a, b) => b.issuesCompleted - a.issuesCompleted),
            stats,
            history,
          });
        }

        return detailedSprints;
      } catch (error) {
        console.warn('Failed to fetch completed sprints:', error);
        return [];
      }
    },
    enabled: !!boardId,
  });
}
