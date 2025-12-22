import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface TrendAnalysisProps {
  projectId: string;
}

interface DailyData {
  date: string;
  created: number;
  completed: number;
  net: number;
}

export function TrendAnalysis({ projectId }: TrendAnalysisProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['trend-analysis', projectId],
    queryFn: async (): Promise<DailyData[]> => {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Get all issues created in last 30 days
      const { data: issues } = await supabase
        .from('issues')
        .select('id, created_at, resolved_at')
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString());

      // Get all issues resolved in last 30 days (might have been created earlier)
      const { data: resolvedIssues } = await supabase
        .from('issues')
        .select('id, resolved_at')
        .eq('project_id', projectId)
        .not('resolved_at', 'is', null)
        .gte('resolved_at', startDate.toISOString());

      // Create date buckets
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyData: DailyData[] = days.map(day => ({
        date: format(day, 'MMM d'),
        created: 0,
        completed: 0,
        net: 0,
      }));

      // Count created per day
      issues?.forEach(issue => {
        const createdDate = format(startOfDay(new Date(issue.created_at!)), 'MMM d');
        const dayIndex = dailyData.findIndex(d => d.date === createdDate);
        if (dayIndex >= 0) {
          dailyData[dayIndex].created++;
        }
      });

      // Count completed per day
      resolvedIssues?.forEach(issue => {
        const resolvedDate = format(startOfDay(new Date(issue.resolved_at!)), 'MMM d');
        const dayIndex = dailyData.findIndex(d => d.date === resolvedDate);
        if (dayIndex >= 0) {
          dailyData[dayIndex].completed++;
        }
      });

      // Calculate net change
      dailyData.forEach(d => {
        d.net = d.completed - d.created;
      });

      return dailyData;
    },
    enabled: !!projectId,
  });

  const avgCreated = chartData?.length 
    ? Math.round((chartData.reduce((sum, d) => sum + d.created, 0) / chartData.length) * 10) / 10
    : 0;
  const avgCompleted = chartData?.length 
    ? Math.round((chartData.reduce((sum, d) => sum + d.completed, 0) / chartData.length) * 10) / 10
    : 0;

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            30-Day Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              30-Day Trend Analysis
            </CardTitle>
            <CardDescription>
              Issues created vs completed over time
            </CardDescription>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Avg Created: </span>
              <span className="font-semibold">{avgCreated}/day</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Completed: </span>
              <span className="font-semibold text-green-600">{avgCompleted}/day</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData?.every(d => d.created === 0 && d.completed === 0) ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No activity in the last 30 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="hsl(217 91% 60%)" 
                  strokeWidth={2}
                  dot={false}
                  name="Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  dot={false}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
