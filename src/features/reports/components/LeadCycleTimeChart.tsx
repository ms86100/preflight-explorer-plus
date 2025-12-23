import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';
import { differenceInDays, format, subDays } from 'date-fns';

interface LeadCycleTimeChartProps {
  readonly projectId: string;
}

interface TimeData {
  readonly date: string;
  readonly leadTime: number;
  readonly cycleTime: number;
}

export function LeadCycleTimeChart({ projectId }: LeadCycleTimeChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['lead-cycle-time', projectId],
    queryFn: async () => {
      // Get resolved issues with their history
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          id, 
          created_at, 
          resolved_at,
          issue_history(field_name, new_value, changed_at)
        `)
        .eq('project_id', projectId)
        .not('resolved_at', 'is', null)
        .gte('resolved_at', subDays(new Date(), 90).toISOString())
        .order('resolved_at', { ascending: true });

      if (!issues?.length) return [];

      // Group by week
      const weeklyData = new Map<string, { leadTimes: number[]; cycleTimes: number[] }>();

      issues.forEach(issue => {
        if (!issue.resolved_at) return;

        const resolvedDate = new Date(issue.resolved_at);
        const createdDate = new Date(issue.created_at || issue.resolved_at);
        const weekKey = format(resolvedDate, 'MMM d');

        // Lead time = created to resolved
        const leadTime = differenceInDays(resolvedDate, createdDate);

        // Cycle time = first "In Progress" to resolved
        const history = issue.issue_history as Array<{ field_name: string; new_value: string; changed_at: string }> | null;
        const inProgressEvent = history?.find(h => 
          h.field_name === 'status' && h.new_value?.toLowerCase().includes('progress')
        );
        
        const cycleStart = inProgressEvent 
          ? new Date(inProgressEvent.changed_at)
          : createdDate;
        const cycleTime = differenceInDays(resolvedDate, cycleStart);

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, { leadTimes: [], cycleTimes: [] });
        }
        const weekData = weeklyData.get(weekKey);
        weekData?.leadTimes.push(leadTime);
        weekData?.cycleTimes.push(cycleTime);
      });

      const data: TimeData[] = [];
      weeklyData.forEach((value, key) => {
        const avgLead = value.leadTimes.reduce((a, b) => a + b, 0) / value.leadTimes.length;
        const avgCycle = value.cycleTimes.reduce((a, b) => a + b, 0) / value.cycleTimes.length;
        data.push({
          date: key,
          leadTime: Math.round(avgLead * 10) / 10,
          cycleTime: Math.round(avgCycle * 10) / 10,
        });
      });

      return data;
    },
    enabled: !!projectId,
  });

  const avgLeadTime = chartData?.length 
    ? Math.round(chartData.reduce((sum, d) => sum + d.leadTime, 0) / chartData.length * 10) / 10
    : 0;

  const avgCycleTime = chartData?.length
    ? Math.round(chartData.reduce((sum, d) => sum + d.cycleTime, 0) / chartData.length * 10) / 10
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lead & Cycle Time
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lead & Cycle Time
            </CardTitle>
            <CardDescription>
              Average time from creation to completion (Lead) and start to completion (Cycle)
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Avg Lead</p>
              <p className="font-semibold text-lg">{avgLeadTime} days</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Avg Cycle</p>
              <p className="font-semibold text-lg text-primary">{avgCycleTime} days</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No resolved issues in the last 90 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
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
                  dataKey="leadTime" 
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground) / 0.2)"
                  name="Lead Time"
                />
                <Area 
                  type="monotone" 
                  dataKey="cycleTime" 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  name="Cycle Time"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
