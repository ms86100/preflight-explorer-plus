import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface IssueTypeDistributionProps {
  readonly projectId: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(262 83% 58%)',
  'hsl(var(--muted-foreground))',
];

export function IssueTypeDistribution({ projectId }: IssueTypeDistributionProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['issue-type-distribution', projectId],
    queryFn: async () => {
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          issue_type:issue_types(name, color)
        `)
        .eq('project_id', projectId);

      if (!issues?.length) return [];

      const typeCount = new Map<string, { name: string; count: number; color: string }>();

      issues.forEach(issue => {
        const typeName = (issue.issue_type as { name: string; color: string })?.name || 'Unknown';
        const typeColor = (issue.issue_type as { name: string; color: string })?.color || '#888';
        
        if (!typeCount.has(typeName)) {
          typeCount.set(typeName, { name: typeName, count: 0, color: typeColor });
        }
        const typeData = typeCount.get(typeName);
        if (typeData) typeData.count++;
      });

      return Array.from(typeCount.values()).sort((a, b) => b.count - a.count);
    },
    enabled: !!projectId,
  });

  const total = chartData?.reduce((sum, d) => sum + d.count, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Issue Type Distribution
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
          <PieChartIcon className="h-5 w-5" />
          Issue Type Distribution
        </CardTitle>
        <CardDescription>
          {total} total issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No issues
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {chartData?.map((entry) => (
                    <Cell key={entry.name} fill={entry.color || COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} issues`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
