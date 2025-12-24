import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award } from 'lucide-react';

interface ContributorPerformanceProps {
  readonly projectId: string;
}

interface ContributorStats {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly completed: number;
  readonly inProgress: number;
  readonly storyPoints: number;
  readonly avgResolutionDays: number;
  readonly completionRate: number;
}

export function ContributorPerformance({ projectId }: ContributorPerformanceProps) {
  const { data: contributors, isLoading } = useQuery({
    queryKey: ['contributor-performance', projectId],
    queryFn: async (): Promise<ContributorStats[]> => {
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          id,
          assignee_id,
          story_points,
          created_at,
          resolved_at,
          status:issue_statuses(category)
        `)
        .eq('project_id', projectId)
        .not('assignee_id', 'is', null);

      const { data: profiles } = await supabase
        .from('user_directory')
        .select('id, display_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      if (!issues?.length) return [];

      const statsMap = new Map<string, {
        completed: number;
        inProgress: number;
        todo: number;
        storyPoints: number;
        totalResolutionDays: number;
        resolvedCount: number;
      }>();

      issues.forEach(issue => {
        const assigneeId = issue.assignee_id!;
        const status = issue.status as { category: string } | null;
        const category = status?.category || 'todo';
        const points = issue.story_points || 0;

        if (!statsMap.has(assigneeId)) {
          statsMap.set(assigneeId, {
            completed: 0,
            inProgress: 0,
            todo: 0,
            storyPoints: 0,
            totalResolutionDays: 0,
            resolvedCount: 0,
          });
        }

        const stats = statsMap.get(assigneeId);
        
        if (category === 'done') {
          stats.completed++;
          if (issue.resolved_at && issue.created_at) {
            const days = (new Date(issue.resolved_at).getTime() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
            stats.totalResolutionDays += days;
            stats.resolvedCount++;
          }
        } else if (category === 'in_progress') {
          stats.inProgress++;
        } else {
          stats.todo++;
        }
        
        if (category === 'done') {
          stats.storyPoints += points;
        }
      });

      return Array.from(statsMap.entries())
        .map(([id, stats]) => {
          const total = stats.completed + stats.inProgress + stats.todo;
          const name = profileMap.get(id) || 'Unknown User';
          const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          
          return {
            id,
            name,
            initials,
            completed: stats.completed,
            inProgress: stats.inProgress,
            storyPoints: stats.storyPoints,
            avgResolutionDays: stats.resolvedCount > 0 
              ? Math.round((stats.totalResolutionDays / stats.resolvedCount) * 10) / 10 
              : 0,
            completionRate: total > 0 ? Math.round((stats.completed / total) * 100) : 0,
          };
        })
        .sort((a, b) => b.storyPoints - a.storyPoints);
    },
    enabled: !!projectId,
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Contributor Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Contributor Performance
        </CardTitle>
        <CardDescription>
          Team members ranked by story points delivered
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {contributors?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No contributor data available
            </div>
          ) : (
            <div className="space-y-4">
              {contributors?.map((contributor, index) => (
                <div key={contributor.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {contributor.initials}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          {getRankIcon(index)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{contributor.name}</p>
                        <Badge variant="secondary" className="ml-2">
                          {contributor.storyPoints} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{contributor.completed} completed</span>
                        <span>{contributor.inProgress} in progress</span>
                        <span>~{contributor.avgResolutionDays}d avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={contributor.completionRate} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-10">
                      {contributor.completionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
