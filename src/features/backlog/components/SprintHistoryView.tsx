import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Calendar,
  Target,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Archive,
} from 'lucide-react';

interface SprintWithDetails {
  id: string;
  name: string;
  goal: string | null;
  state: string;
  start_date: string | null;
  end_date: string | null;
  completed_date: string | null;
  created_at: string;
  issues: SprintIssue[];
  contributors: Contributor[];
  stats: SprintStats;
  history: SprintHistoryItem[];
}

interface SprintIssue {
  id: string;
  issue_key: string;
  summary: string;
  status_name: string;
  status_category: string;
  status_color: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  issue_type_name: string;
  story_points: number | null;
}

interface Contributor {
  id: string;
  name: string;
  avatar_url: string | null;
  issuesCompleted: number;
  storyPointsCompleted: number;
}

interface SprintStats {
  totalIssues: number;
  completedIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  durationDays: number;
}

interface SprintHistoryItem {
  id: string;
  action: string;
  actor_name: string | null;
  issue_key: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface SprintHistoryViewProps {
  readonly boardId: string;
}

function useCompletedSprints(boardId: string) {
  return useQuery({
    queryKey: ['completed-sprints-detailed', boardId],
    queryFn: async (): Promise<SprintWithDetails[]> => {
      // Get all closed sprints
      const { data: sprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('board_id', boardId)
        .eq('state', 'closed')
        .order('completed_date', { ascending: false });

      if (sprintsError) throw sprintsError;
      if (!sprints?.length) return [];

      const detailedSprints: SprintWithDetails[] = [];

      for (const sprint of sprints) {
        // Get issues for this sprint with full details
        const { data: sprintIssues } = await supabase
          .from('sprint_issues')
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

        const issues: SprintIssue[] = (sprintIssues || []).map((si: { issue_id: string; issues: {
          id: string;
          issue_key: string;
          summary: string;
          assignee_id: string | null;
          story_points: number | null;
          issue_types: { name: string } | null;
          issue_statuses: { name: string; category: string; color: string | null } | null;
        } | null }) => ({
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

        // Get assignee names
        const assigneeIds = [...new Set(issues.filter(i => i.assignee_id).map(i => i.assignee_id))] as string[];
        if (assigneeIds.length > 0) {
          const { data: profiles } = await supabase.rpc('get_public_profiles', {
            _user_ids: assigneeIds,
          });
          const profileMap = new Map((profiles || []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
          issues.forEach(issue => {
            if (issue.assignee_id) {
              issue.assignee_name = profileMap.get(issue.assignee_id) || null;
            }
          });
        }

        // Calculate contributors
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

        // Calculate stats
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

        // Get sprint history
        const { data: historyData } = await supabase
          .from('sprint_history')
          .select('*')
          .eq('sprint_id', sprint.id)
          .order('created_at', { ascending: true });

        // Get actor names for history
        const historyActorIds = [...new Set((historyData || []).filter(h => h.actor_id).map(h => h.actor_id))] as string[];
        let historyActorMap = new Map<string, string>();
        if (historyActorIds.length > 0) {
          const { data: actorProfiles } = await supabase.rpc('get_public_profiles', {
            _user_ids: historyActorIds,
          });
          historyActorMap = new Map((actorProfiles || []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
        }

        const history: SprintHistoryItem[] = (historyData || []).map(h => ({
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
    },
    enabled: !!boardId,
  });
}

function SprintCard({ sprint }: { readonly sprint: SprintWithDetails }) {
  const getActionDescription = (item: SprintHistoryItem) => {
    switch (item.action) {
      case 'created':
        return `${item.actor_name || 'Someone'} created the sprint`;
      case 'started':
        return `${item.actor_name || 'Someone'} started the sprint with ${item.metadata?.issue_count || 0} issues`;
      case 'completed':
        return `${item.actor_name || 'Someone'} completed the sprint - ${item.metadata?.completed_issues || 0}/${item.metadata?.total_issues || 0} done`;
      case 'issue_added':
        return `${item.actor_name || 'Someone'} added ${item.issue_key}`;
      case 'issue_removed':
        return `${item.actor_name || 'Someone'} removed ${item.issue_key}`;
      case 'edited':
        return `${item.actor_name || 'Someone'} edited sprint details`;
      default:
        return `${item.actor_name || 'Someone'} performed an action`;
    }
  };

  return (
    <AccordionItem value={sprint.id} className="border rounded-lg mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="font-medium">{sprint.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Calendar className="h-3 w-3" />
                {sprint.start_date && format(new Date(sprint.start_date), 'MMM d')} 
                <ArrowRight className="h-3 w-3" />
                {sprint.completed_date && format(new Date(sprint.completed_date), 'MMM d, yyyy')}
                <span className="text-muted-foreground/60">•</span>
                <span>{sprint.stats.durationDays} days</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={sprint.stats.completionRate >= 80 ? 'default' : 'secondary'}
              className={sprint.stats.completionRate >= 80 ? 'bg-green-500/20 text-green-600 border-green-500/30' : ''}
            >
              {sprint.stats.completionRate}% complete
            </Badge>
            <div className="text-sm text-muted-foreground">
              {sprint.stats.completedIssues}/{sprint.stats.totalIssues} issues
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {/* Sprint Goal */}
        {sprint.goal && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Target className="h-4 w-4 text-primary" />
              Sprint Goal
            </div>
            <p className="text-sm text-muted-foreground">{sprint.goal}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-green-500">{sprint.stats.completedIssues}</div>
              <div className="text-xs text-muted-foreground">Issues Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-orange-500">{sprint.stats.totalIssues - sprint.stats.completedIssues}</div>
              <div className="text-xs text-muted-foreground">Spillover</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-blue-500">{sprint.stats.completedStoryPoints}</div>
              <div className="text-xs text-muted-foreground">Story Points Done</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-purple-500">{sprint.stats.durationDays}</div>
              <div className="text-xs text-muted-foreground">Days Duration</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Completion Progress</span>
            <span>{sprint.stats.completionRate}%</span>
          </div>
          <Progress value={sprint.stats.completionRate} className="h-2" />
        </div>

        <Separator className="my-4" />

        {/* Contributors Section */}
        {sprint.contributors.length > 0 && (
          <>
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Users className="h-4 w-4 text-primary" />
                Contributors ({sprint.contributors.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sprint.contributors.map(contributor => (
                  <div key={contributor.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {contributor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{contributor.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {contributor.issuesCompleted} issues • {contributor.storyPointsCompleted} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Issues Breakdown */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            Issues in Sprint ({sprint.issues.length})
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
            {sprint.issues.map(issue => (
              <div 
                key={issue.id} 
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  issue.status_category === 'done' ? 'bg-green-500/10' : 'bg-orange-500/10'
                }`}
              >
                {issue.status_category === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                )}
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {issue.issue_key}
                </Badge>
                <span className="truncate flex-1">{issue.summary}</span>
                {issue.story_points && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {issue.story_points} pts
                  </Badge>
                )}
                {issue.assignee_name && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {issue.assignee_name}
                  </span>
                )}
              </div>
            ))}
            {sprint.issues.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No issues found in this sprint
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Clock className="h-4 w-4 text-primary" />
            Sprint Timeline
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {sprint.history.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="text-muted-foreground">{getActionDescription(item)}</div>
                  <div className="text-xs text-muted-foreground/70">
                    {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            {sprint.history.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No history recorded
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function SprintHistoryView({ boardId }: SprintHistoryViewProps) {
  const { data: sprints, isLoading } = useCompletedSprints(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sprints?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">No completed sprints yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete a sprint to see its history here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 -mx-6 px-6">
      <Accordion type="single" collapsible className="w-full">
        {sprints.map(sprint => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </Accordion>
    </ScrollArea>
  );
}
