import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import { differenceInDays, format, subDays } from 'date-fns';

interface ControlChartProps {
  projectId: string;
}

interface DataPoint {
  date: string;
  days: number;
  issueKey: string;
}

export function ControlChart({ projectId }: ControlChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['control-chart', projectId],
    queryFn: async () => {
      const { data: issues } = await supabase
        .from('issues')
        .select('issue_key, created_at, resolved_at')
        .eq('project_id', projectId)
        .not('resolved_at', 'is', null)
        .gte('resolved_at', subDays(new Date(), 60).toISOString())
        .order('resolved_at', { ascending: true });

      if (!issues?.length) return { points: [], avg: 0, stdDev: 0 };

      const points: DataPoint[] = issues.map(issue => {
        const created = new Date(issue.created_at || issue.resolved_at);
        const resolved = new Date(issue.resolved_at!);
        const days = differenceInDays(resolved, created);
        
        return {
          date: format(resolved, 'MMM d'),
          days: Math.max(0, days),
          issueKey: issue.issue_key,
        };
      });

      // Calculate statistics
      const values = points.map(p => p.days);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      return { points, avg: Math.round(avg * 10) / 10, stdDev: Math.round(stdDev * 10) / 10 };
    },
    enabled: !!projectId,
  });

  const upperBound = (data?.avg || 0) + 2 * (data?.stdDev || 0);
  const lowerBound = Math.max(0, (data?.avg || 0) - 2 * (data?.stdDev || 0));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Control Chart
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
              <Activity className="h-5 w-5" />
              Control Chart
            </CardTitle>
            <CardDescription>
              Issue completion time with statistical control limits (±2σ)
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Average</p>
              <p className="font-semibold">{data?.avg} days</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Std Dev</p>
              <p className="font-semibold">{data?.stdDev} days</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data?.points.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No resolved issues in the last 60 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  dataKey="days"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: { payload: DataPoint }) => [
                    `${value} days`,
                    props.payload.issueKey
                  ]}
                />
                <ReferenceLine 
                  y={data?.avg} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
                  label={{ value: 'Avg', fill: 'hsl(var(--primary))' }}
                />
                <ReferenceLine 
                  y={upperBound} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: '+2σ', fill: 'hsl(var(--destructive))' }}
                />
                <ReferenceLine 
                  y={lowerBound} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: '-2σ', fill: 'hsl(var(--destructive))' }}
                />
                <Scatter 
                  data={data?.points} 
                  fill="hsl(var(--primary))"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
