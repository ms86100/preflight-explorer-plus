import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface VelocityChartProps {
  boardId: string;
}

interface VelocityData {
  sprint: string;
  committed: number;
  completed: number;
}

export function VelocityChart({ boardId }: VelocityChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['velocity', boardId],
    queryFn: async () => {
      // Get closed sprints
      const { data: sprints } = await supabase
        .from('sprints')
        .select('id, name')
        .eq('board_id', boardId)
        .eq('state', 'closed')
        .order('completed_date', { ascending: false })
        .limit(6);

      if (!sprints?.length) return [];

      const velocityData: VelocityData[] = [];

      for (const sprint of sprints.reverse()) {
        const { data: sprintIssues } = await supabase
          .from('sprint_issues')
          .select('issue:issues(story_points, status:issue_statuses(category))')
          .eq('sprint_id', sprint.id);

        const committed = sprintIssues?.reduce((sum, si) => {
          const issue = si.issue as { story_points: number | null } | null;
          return sum + (issue?.story_points || 0);
        }, 0) || 0;

        const completed = sprintIssues?.filter(si => {
          const issue = si.issue as { status: { category: string } | null } | null;
          return issue?.status?.category === 'done';
        }).reduce((sum, si) => {
          const issue = si.issue as { story_points: number | null } | null;
          return sum + (issue?.story_points || 0);
        }, 0) || 0;

        velocityData.push({
          sprint: sprint.name.length > 15 ? sprint.name.slice(0, 15) + '...' : sprint.name,
          committed,
          completed,
        });
      }

      return velocityData;
    },
    enabled: !!boardId,
  });

  const averageVelocity = chartData?.length 
    ? Math.round(chartData.reduce((sum, d) => sum + d.completed, 0) / chartData.length)
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Velocity Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Velocity Chart
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Avg: <span className="font-semibold text-foreground">{averageVelocity}</span> pts/sprint
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No completed sprints yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="sprint" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="committed" fill="hsl(var(--muted-foreground))" name="Committed" />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
