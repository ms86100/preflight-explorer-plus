import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Target
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface SprintReportProps {
  readonly sprintId: string;
}

interface SprintStats {
  readonly name: string;
  readonly goal: string | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly state: string;
  readonly totalIssues: number;
  readonly completedIssues: number;
  readonly totalPoints: number;
  readonly completedPoints: number;
  readonly addedMidSprint: number;
  readonly removedMidSprint: number;
}

export function SprintReport({ sprintId }: SprintReportProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sprint-report', sprintId],
    queryFn: async (): Promise<SprintStats | null> => {
      const { data: sprint } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single();

      if (!sprint) return null;

      const { data: sprintIssues } = await supabase
        .from('sprint_issues')
        .select('issue:issues(id, story_points, status:issue_statuses(category))')
        .eq('sprint_id', sprintId);

      const totalIssues = sprintIssues?.length || 0;
      const completedIssues = sprintIssues?.filter(si => {
        const issue = si.issue as { status: { category: string } | null } | null;
        return issue?.status?.category === 'done';
      }).length || 0;

      const totalPoints = sprintIssues?.reduce((sum, si) => {
        const issue = si.issue as { story_points: number | null } | null;
        return sum + (issue?.story_points || 0);
      }, 0) || 0;

      const completedPoints = sprintIssues?.filter(si => {
        const issue = si.issue as { status: { category: string } | null } | null;
        return issue?.status?.category === 'done';
      }).reduce((sum, si) => {
        const issue = si.issue as { story_points: number | null } | null;
        return sum + (issue?.story_points || 0);
      }, 0) || 0;

      return {
        name: sprint.name,
        goal: sprint.goal,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        state: sprint.state || 'future',
        totalIssues,
        completedIssues,
        totalPoints,
        completedPoints,
        addedMidSprint: 0, // Would need historical tracking
        removedMidSprint: 0,
      };
    },
    enabled: !!sprintId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Sprint not found
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = stats.totalIssues > 0 
    ? Math.round((stats.completedIssues / stats.totalIssues) * 100) 
    : 0;

  const pointsPercentage = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  const daysRemaining = stats.endDate && stats.state === 'active'
    ? Math.max(0, differenceInDays(new Date(stats.endDate), new Date()))
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{stats.name}</CardTitle>
          <Badge variant={
            stats.state === 'active' ? 'default' :
            stats.state === 'closed' ? 'secondary' : 'outline'
          }>
            {stats.state === 'active' ? 'Active' :
             stats.state === 'closed' ? 'Completed' : 'Future'}
          </Badge>
        </div>
        {stats.goal && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            {stats.goal}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date range */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {stats.startDate ? format(new Date(stats.startDate), 'MMM d') : 'Not started'}
            {' → '}
            {stats.endDate ? format(new Date(stats.endDate), 'MMM d, yyyy') : 'No end date'}
          </div>
          {daysRemaining !== null && (
            <Badge variant="outline" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining} days remaining
            </Badge>
          )}
        </div>

        {/* Issue completion */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Issues Completed</span>
            <span className="font-medium">{stats.completedIssues} / {stats.totalIssues}</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">{completionPercentage}%</div>
        </div>

        {/* Story points */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Story Points Completed</span>
            <span className="font-medium">{stats.completedPoints} / {stats.totalPoints}</span>
          </div>
          <Progress value={pointsPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">{pointsPercentage}%</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalIssues}</div>
            <div className="text-xs text-muted-foreground">Total Issues</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{stats.completedIssues}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{stats.totalIssues - stats.completedIssues}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <div className="text-xs text-muted-foreground">Story Points</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
