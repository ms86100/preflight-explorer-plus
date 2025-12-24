import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CalendarX } from 'lucide-react';
import { differenceInDays, format, isPast } from 'date-fns';

interface OverdueAnalysisProps {
  readonly projectId: string;
}

interface OverdueIssue {
  readonly id: string;
  readonly issueKey: string;
  readonly summary: string;
  readonly dueDate: string;
  readonly daysOverdue: number;
  readonly priority: string;
  readonly assignee: string | null;
}

export function OverdueAnalysis({ projectId }: OverdueAnalysisProps) {
  const { data: overdueIssues, isLoading } = useQuery({
    queryKey: ['overdue-analysis', projectId],
    queryFn: async (): Promise<OverdueIssue[]> => {
      const { data: issues } = await supabase
        .from('issues')
        .select(`
          id,
          issue_key,
          summary,
          due_date,
          assignee_id,
          priority:priorities(name),
          status:issue_statuses(category)
        `)
        .eq('project_id', projectId)
        .not('due_date', 'is', null);

      // Get user data from user_directory
      const { data: profiles } = await supabase
        .from('user_directory')
        .select('id, display_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      const now = new Date();
      
      return (issues || [])
        .filter(issue => {
          const status = issue.status as { category: string } | null;
          return status?.category !== 'done' && issue.due_date && isPast(new Date(issue.due_date));
        })
        .map(issue => ({
          id: issue.id,
          issueKey: issue.issue_key,
          summary: issue.summary,
          dueDate: issue.due_date!,
          daysOverdue: differenceInDays(now, new Date(issue.due_date!)),
          priority: (issue.priority as { name: string } | null)?.name || 'Unset',
          assignee: issue.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
        }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    },
    enabled: !!projectId,
  });

  const getSeverity = (days: number) => {
    if (days > 14) return 'destructive';
    if (days > 7) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="h-5 w-5" />
            Overdue Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={overdueIssues && overdueIssues.length > 0 ? 'border-red-500/30' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX className="h-5 w-5 text-red-500" />
          Overdue Issues
          {overdueIssues && overdueIssues.length > 0 && (
            <Badge variant="destructive">{overdueIssues.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Issues past their due date requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {overdueIssues?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2 text-green-500" />
              <p>No overdue issues</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueIssues?.map((issue) => (
                <div key={issue.id} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {issue.issueKey}
                    </Badge>
                    <Badge variant={getSeverity(issue.daysOverdue)}>
                      {issue.daysOverdue}d overdue
                    </Badge>
                  </div>
                  <p className="text-sm mt-2 line-clamp-1">{issue.summary}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Due: {format(new Date(issue.dueDate), 'MMM d, yyyy')}</span>
                    <span>{issue.priority}</span>
                  </div>
                  {issue.assignee && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned to: {issue.assignee}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
