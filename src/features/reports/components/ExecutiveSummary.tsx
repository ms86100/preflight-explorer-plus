import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap
} from 'lucide-react';
import { differenceInDays, subDays } from 'date-fns';

interface ExecutiveSummaryProps {
  readonly projectId: string;
}

interface ProjectMetrics {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  blockedIssues: number;
  overdue: number;
  createdThisWeek: number;
  completedThisWeek: number;
  avgCompletionTime: number;
  projectHealth: 'healthy' | 'at_risk' | 'critical';
  completionRate: number;
  throughput: number;
  wipLimit: number;
  wipCurrent: number;
}

export function ExecutiveSummary({ projectId }: ExecutiveSummaryProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['executive-summary', projectId],
    queryFn: async (): Promise<ProjectMetrics> => {
      const now = new Date();
      const weekAgo = subDays(now, 7);

      // Get all issues with related data
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          id,
          created_at,
          due_date,
          resolved_at,
          story_points,
          status:issue_statuses(id, name, category),
          priority:priorities(id, name)
        `)
        .eq('project_id', projectId);

      if (!issues?.length) {
        return {
          totalIssues: 0,
          completedIssues: 0,
          inProgressIssues: 0,
          blockedIssues: 0,
          overdue: 0,
          createdThisWeek: 0,
          completedThisWeek: 0,
          avgCompletionTime: 0,
          projectHealth: 'healthy',
          completionRate: 0,
          throughput: 0,
          wipLimit: 10,
          wipCurrent: 0,
        };
      }

      const totalIssues = issues.length;
      const completedIssues = issues.filter(i => 
        (i.status as { category: string })?.category === 'done'
      ).length;
      const inProgressIssues = issues.filter(i => 
        (i.status as { category: string })?.category === 'in_progress'
      ).length;
      
      // Check for high-priority non-done issues (simulating blocked)
      const blockedIssues = issues.filter(i => {
        const status = i.status as { category: string } | null;
        const priority = i.priority as { name: string } | null;
        return status?.category !== 'done' && 
               (priority?.name === 'Highest' || priority?.name === 'High');
      }).length;

      // Overdue issues
      const overdue = issues.filter(i => {
        const status = i.status as { category: string } | null;
        return i.due_date && 
               new Date(i.due_date) < now && 
               status?.category !== 'done';
      }).length;

      // This week's activity
      const createdThisWeek = issues.filter(i => 
        new Date(i.created_at as string) >= weekAgo
      ).length;
      const completedThisWeek = issues.filter(i => 
        i.resolved_at && new Date(i.resolved_at) >= weekAgo
      ).length;

      // Average completion time (for resolved issues)
      const resolvedIssues = issues.filter(i => i.resolved_at && i.created_at);
      const avgCompletionTime = resolvedIssues.length > 0
        ? resolvedIssues.reduce((sum, i) => {
            const days = differenceInDays(new Date(i.resolved_at as string), new Date(i.created_at as string));
            return sum + days;
          }, 0) / resolvedIssues.length
        : 0;

      // Project health calculation
      const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
      const overdueRate = totalIssues > 0 ? (overdue / totalIssues) * 100 : 0;
      
      let projectHealth: 'healthy' | 'at_risk' | 'critical' = 'healthy';
      if (overdueRate > 20 || blockedIssues > 5) {
        projectHealth = 'critical';
      } else if (overdueRate > 10 || blockedIssues > 2) {
        projectHealth = 'at_risk';
      }

      // Throughput (issues completed per week over last 4 weeks)
      const fourWeeksAgo = subDays(now, 28);
      const completedLast4Weeks = issues.filter(i => 
        i.resolved_at && new Date(i.resolved_at) >= fourWeeksAgo
      ).length;
      const throughput = completedLast4Weeks / 4;

      return {
        totalIssues,
        completedIssues,
        inProgressIssues,
        blockedIssues,
        overdue,
        createdThisWeek,
        completedThisWeek,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        projectHealth,
        completionRate: Math.round(completionRate),
        throughput: Math.round(throughput * 10) / 10,
        wipLimit: 10,
        wipCurrent: inProgressIssues,
      };
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    const skeletonCards = ['health', 'completion', 'throughput', 'cycle-time'] as const;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skeletonCards.map((key) => (
          <Card key={`skeleton-${key}`}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const healthColors = {
    healthy: 'bg-green-500/10 text-green-600 border-green-500/30',
    at_risk: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    critical: 'bg-red-500/10 text-red-600 border-red-500/30',
  };

  const healthLabels = {
    healthy: 'On Track',
    at_risk: 'At Risk',
    critical: 'Critical',
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Health */}
        <Card className={`border-2 ${healthColors[metrics.projectHealth]}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{healthLabels[metrics.projectHealth]}</span>
              {metrics.projectHealth === 'healthy' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
              {metrics.projectHealth === 'at_risk' && <AlertTriangle className="h-8 w-8 text-yellow-500" />}
              {metrics.projectHealth === 'critical' && <AlertTriangle className="h-8 w-8 text-red-500" />}
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.completionRate}%</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.completedIssues}/{metrics.totalIssues}
                </span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Throughput */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Weekly Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.throughput}</span>
              <span className="text-sm text-muted-foreground">issues/week</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {metrics.completedThisWeek >= metrics.throughput ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Above average this week</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-600">Below average this week</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avg Cycle Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Cycle Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.avgCompletionTime}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Time from creation to completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Issues</p>
            <p className="text-xl font-bold">{metrics.totalIssues}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold text-blue-500">{metrics.inProgressIssues}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-green-500">{metrics.completedIssues}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-xl font-bold text-red-500">{metrics.overdue}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Created This Week</p>
            <p className="text-xl font-bold">{metrics.createdThisWeek}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Closed This Week</p>
            <p className="text-xl font-bold text-green-500">{metrics.completedThisWeek}</p>
          </CardContent>
        </Card>
      </div>

      {/* WIP Indicator */}
      {metrics.wipCurrent > 0 && (
        <Card className={metrics.wipCurrent > metrics.wipLimit ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Work in Progress (WIP)</span>
              {metrics.wipCurrent > metrics.wipLimit && (
                <Badge variant="destructive">WIP Limit Exceeded</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress 
                value={Math.min((metrics.wipCurrent / metrics.wipLimit) * 100, 100)} 
                className={`flex-1 h-3 ${metrics.wipCurrent > metrics.wipLimit ? '[&>div]:bg-red-500' : ''}`}
              />
              <span className="text-sm font-medium">
                {metrics.wipCurrent} / {metrics.wipLimit}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
