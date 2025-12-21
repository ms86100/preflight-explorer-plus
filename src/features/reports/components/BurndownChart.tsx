import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface BurndownChartProps {
  sprintId: string;
}

interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

export function BurndownChart({ sprintId }: BurndownChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['burndown', sprintId],
    queryFn: async () => {
      // Get sprint info
      const { data: sprint } = await supabase
        .from('sprints')
        .select('*, board:boards(project_id)')
        .eq('id', sprintId)
        .single();

      if (!sprint?.start_date || !sprint?.end_date) return [];

      // Get sprint issues
      const { data: sprintIssues } = await supabase
        .from('sprint_issues')
        .select('issue:issues(story_points, status:issue_statuses(category))')
        .eq('sprint_id', sprintId);

      const totalPoints = sprintIssues?.reduce((sum, si) => {
        const issue = si.issue as { story_points: number | null } | null;
        return sum + (issue?.story_points || 0);
      }, 0) || 0;

      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyBurnRate = totalPoints / totalDays;

      const data: BurndownData[] = [];
      const today = new Date();

      for (let i = 0; i <= totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const ideal = Math.max(0, totalPoints - (dailyBurnRate * i));
        
        // Simulated actual (in real app, would query historical data)
        const daysPassed = Math.min(i, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const completedPoints = sprintIssues?.filter(si => {
          const issue = si.issue as { status: { category: string } | null } | null;
          return issue?.status?.category === 'done';
        }).reduce((sum, si) => {
          const issue = si.issue as { story_points: number | null } | null;
          return sum + (issue?.story_points || 0);
        }, 0) || 0;

        const actual = date <= today ? totalPoints - (completedPoints * (i / Math.max(1, daysPassed))) : undefined;

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ideal: Math.round(ideal * 10) / 10,
          actual: actual !== undefined ? Math.round(actual * 10) / 10 : ideal,
        });
      }

      return data;
    },
    enabled: !!sprintId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Burndown Chart
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Burndown Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ideal" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                name="Ideal"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Actual"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
