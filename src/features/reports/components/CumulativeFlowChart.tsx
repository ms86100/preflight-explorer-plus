import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers } from 'lucide-react';

interface CumulativeFlowProps {
  readonly projectId: string;
}

export function CumulativeFlowChart({ projectId }: CumulativeFlowProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['cumulative-flow', projectId],
    queryFn: async () => {
      // Get all issues with their status categories
      const { data: issues } = await supabase
        .from('issues')
        .select('created_at, status:issue_statuses(category)')
        .eq('project_id', projectId)
        .order('created_at');

      if (!issues?.length) return [];

      // Group by week and status category
      const weeklyData: Record<string, { todo: number; in_progress: number; done: number }> = {};
      
      issues.forEach(issue => {
        const date = new Date(issue.created_at!);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { todo: 0, in_progress: 0, done: 0 };
        }

        const category = (issue.status as { category: string } | null)?.category || 'todo';
        if (category === 'todo') weeklyData[weekKey].todo++;
        else if (category === 'in_progress') weeklyData[weekKey].in_progress++;
        else if (category === 'done') weeklyData[weekKey].done++;
      });

      // Convert to cumulative data
      const sortedWeeks = Object.keys(weeklyData).sort();
      let cumulativeTodo = 0;
      let cumulativeInProgress = 0;
      let cumulativeDone = 0;

      return sortedWeeks.slice(-12).map(week => {
        cumulativeTodo += weeklyData[week].todo;
        cumulativeInProgress += weeklyData[week].in_progress;
        cumulativeDone += weeklyData[week].done;

        return {
          week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          'To Do': cumulativeTodo,
          'In Progress': cumulativeInProgress,
          'Done': cumulativeDone,
        };
      });
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Cumulative Flow Diagram
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
          <Layers className="h-5 w-5" />
          Cumulative Flow Diagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No issue data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Issues', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="Done" 
                  stackId="1"
                  stroke="hsl(142, 71%, 45%)" 
                  fill="hsl(142, 71%, 45%)" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="In Progress" 
                  stackId="1"
                  stroke="hsl(217, 91%, 60%)" 
                  fill="hsl(217, 91%, 60%)" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="To Do" 
                  stackId="1"
                  stroke="hsl(var(--muted-foreground))" 
                  fill="hsl(var(--muted-foreground))" 
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
