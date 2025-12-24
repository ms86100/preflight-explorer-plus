import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

interface TeamWorkloadChartProps {
  readonly projectId: string;
}

export function TeamWorkloadChart({ projectId }: TeamWorkloadChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['team-workload', projectId],
    queryFn: async () => {
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          assignee_id,
          story_points,
          status:issue_statuses(category)
        `)
        .eq('project_id', projectId)
        .not('assignee_id', 'is', null);

      // Get user data from user_directory
      const { data: profiles } = await supabase
        .from('user_directory')
        .select('id, display_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      if (!issues?.length) return [];

      // Group by assignee
      const workloadMap = new Map<string, { name: string; inProgress: number; todo: number; done: number }>();

      issues.forEach(issue => {
        const assigneeName = profileMap.get(issue.assignee_id || '') || 'Unassigned';
        const points = issue.story_points || 1;
        const category = (issue.status as { category: string })?.category || 'todo';

        if (!workloadMap.has(assigneeName)) {
          workloadMap.set(assigneeName, { name: assigneeName, inProgress: 0, todo: 0, done: 0 });
        }

        const current = workloadMap.get(assigneeName);
        if (!current) return;
        if (category === 'in_progress') {
          current.inProgress += points;
        } else if (category === 'done') {
          current.done += points;
        } else {
          current.todo += points;
        }
      });

      return Array.from(workloadMap.values())
        .sort((a, b) => (b.inProgress + b.todo) - (a.inProgress + a.todo))
        .slice(0, 10);
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
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
          <Users className="h-5 w-5" />
          Team Workload
        </CardTitle>
        <CardDescription>
          Story points distribution by team member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No assigned issues
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="todo" stackId="a" fill="hsl(var(--muted-foreground))" name="To Do" />
                <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--primary))" name="In Progress" />
                <Bar dataKey="done" stackId="a" fill="hsl(142 76% 36%)" name="Done" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
