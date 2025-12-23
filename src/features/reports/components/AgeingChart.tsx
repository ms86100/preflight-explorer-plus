import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface AgeingChartProps {
  readonly projectId: string;
}

const AGE_BUCKETS = [
  { label: '< 1 week', max: 7, color: 'hsl(142 76% 36%)' },
  { label: '1-2 weeks', max: 14, color: 'hsl(var(--primary))' },
  { label: '2-4 weeks', max: 28, color: 'hsl(38 92% 50%)' },
  { label: '1-2 months', max: 60, color: 'hsl(25 95% 53%)' },
  { label: '> 2 months', max: Infinity, color: 'hsl(0 84% 60%)' },
];

export function AgeingChart({ projectId }: AgeingChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['ageing-chart', projectId],
    queryFn: async () => {
      const { data: issues } = await supabase
        .from('issues')
        .select('created_at, status:issue_statuses(category)')
        .eq('project_id', projectId);

      if (!issues?.length) return [];

      // Filter to only open issues
      const openIssues = issues.filter(i => 
        (i.status as { category: string })?.category !== 'done'
      );

      const buckets = AGE_BUCKETS.map(bucket => ({
        ...bucket,
        count: 0,
      }));

      const today = new Date();
      openIssues.forEach(issue => {
        const age = differenceInDays(today, new Date(issue.created_at || today));
        
        for (const bucket of buckets) {
          if (age < bucket.max) {
            bucket.count++;
            break;
          }
        }
      });

      return buckets;
    },
    enabled: !!projectId,
  });

  const totalOpen = chartData?.reduce((sum, d) => sum + d.count, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Issue Age Distribution
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
          <Calendar className="h-5 w-5" />
          Issue Age Distribution
        </CardTitle>
        <CardDescription>
          {totalOpen} open issues by age
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No open issues
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} issues`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData?.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
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
