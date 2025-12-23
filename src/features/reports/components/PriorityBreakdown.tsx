import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

interface PriorityBreakdownProps {
  readonly projectId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  'Highest': 'hsl(0 84% 60%)',
  'High': 'hsl(25 95% 53%)',
  'Medium': 'hsl(38 92% 50%)',
  'Low': 'hsl(142 76% 36%)',
  'Lowest': 'hsl(var(--muted-foreground))',
};

export function PriorityBreakdown({ projectId }: PriorityBreakdownProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['priority-breakdown', projectId],
    queryFn: async () => {
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          priority:priorities(id, name, color),
          status:issue_statuses(category)
        `)
        .eq('project_id', projectId);

      if (!issues?.length) return [];

      // Group by priority
      const priorityMap = new Map<string, { 
        name: string; 
        todo: number; 
        inProgress: number; 
        done: number; 
        total: number;
        color: string;
      }>();

      issues.forEach(issue => {
        const priority = issue.priority as { name: string; color: string } | null;
        const status = issue.status as { category: string } | null;
        const priorityName = priority?.name || 'Unset';
        const priorityColor = priority?.color || PRIORITY_COLORS[priorityName] || '#888';

        if (!priorityMap.has(priorityName)) {
          priorityMap.set(priorityName, { 
            name: priorityName, 
            todo: 0, 
            inProgress: 0, 
            done: 0, 
            total: 0,
            color: priorityColor,
          });
        }

        const current = priorityMap.get(priorityName);
        current.total++;
        
        const category = status?.category || 'todo';
        if (category === 'done') current.done++;
        else if (category === 'in_progress') current.inProgress++;
        else current.todo++;
      });

      // Sort by priority order
      const order = ['Highest', 'High', 'Medium', 'Low', 'Lowest', 'Unset'];
      return Array.from(priorityMap.values()).sort((a, b) => 
        order.indexOf(a.name) - order.indexOf(b.name)
      );
    },
    enabled: !!projectId,
  });

  const criticalCount = chartData?.reduce((sum, d) => {
    if (d.name === 'Highest' || d.name === 'High') {
      return sum + d.todo + d.inProgress;
    }
    return sum;
  }, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Priority Breakdown
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
          <AlertCircle className="h-5 w-5" />
          Priority Breakdown
        </CardTitle>
        <CardDescription>
          {criticalCount > 0 && (
            <span className="text-red-500 font-medium">
              {criticalCount} high-priority items need attention
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No issues with priorities
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="todo" stackId="a" fill="hsl(var(--muted-foreground))" name="To Do" />
                <Bar dataKey="inProgress" stackId="a" fill="hsl(217 91% 60%)" name="In Progress" />
                <Bar dataKey="done" stackId="a" fill="hsl(142 76% 36%)" name="Done" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
