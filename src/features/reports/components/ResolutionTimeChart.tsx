import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Timer } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface ResolutionTimeChartProps {
  projectId: string;
}

interface ResolutionBucket {
  range: string;
  count: number;
  percentage: number;
}

export function ResolutionTimeChart({ projectId }: ResolutionTimeChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['resolution-time', projectId],
    queryFn: async (): Promise<ResolutionBucket[]> => {
      const { data: issues } = await supabase
        .from('issues')
        .select('id, created_at, resolved_at')
        .eq('project_id', projectId)
        .not('resolved_at', 'is', null);

      if (!issues?.length) return [];

      const buckets: Record<string, number> = {
        '< 1 day': 0,
        '1-3 days': 0,
        '4-7 days': 0,
        '1-2 weeks': 0,
        '2-4 weeks': 0,
        '> 1 month': 0,
      };

      issues.forEach(issue => {
        const days = differenceInDays(new Date(issue.resolved_at!), new Date(issue.created_at!));
        
        if (days < 1) buckets['< 1 day']++;
        else if (days <= 3) buckets['1-3 days']++;
        else if (days <= 7) buckets['4-7 days']++;
        else if (days <= 14) buckets['1-2 weeks']++;
        else if (days <= 28) buckets['2-4 weeks']++;
        else buckets['> 1 month']++;
      });

      const total = issues.length;
      return Object.entries(buckets).map(([range, count]) => ({
        range,
        count,
        percentage: Math.round((count / total) * 100),
      }));
    },
    enabled: !!projectId,
  });

  const COLORS = [
    'hsl(142 76% 36%)',
    'hsl(142 60% 45%)',
    'hsl(38 92% 50%)',
    'hsl(25 95% 53%)',
    'hsl(0 84% 60%)',
    'hsl(0 70% 50%)',
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Resolution Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const totalResolved = chartData?.reduce((sum, d) => sum + d.count, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Resolution Time Distribution
        </CardTitle>
        <CardDescription>
          {totalResolved} resolved issues analyzed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.every(d => d.count === 0) ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No resolved issues
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis 
                  dataKey="range" 
                  type="category" 
                  width={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} issues (${props.payload.percentage}%)`,
                    'Count'
                  ]}
                />
                <Bar dataKey="count" name="Issues">
                  {chartData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
