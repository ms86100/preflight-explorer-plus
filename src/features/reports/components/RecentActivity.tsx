import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Plus, 
  CheckCircle, 
  ArrowRight,
  MessageSquare,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  readonly projectId: string;
}

interface ActivityItem {
  id: string;
  type: 'created' | 'completed' | 'transition' | 'comment' | 'updated';
  issueKey: string;
  summary: string;
  timestamp: string;
  actor?: string;
  details?: string;
}

export function RecentActivity({ projectId }: RecentActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', projectId],
    queryFn: async (): Promise<ActivityItem[]> => {
      const result: ActivityItem[] = [];

      // Get recently created issues
      const { data: recentIssues } = await supabase
        .from('issues')
        .select(`
          id, 
          issue_key, 
          summary, 
          created_at,
          reporter_id
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      recentIssues?.forEach(issue => {
        result.push({
          id: `created-${issue.id}`,
          type: 'created',
          issueKey: issue.issue_key,
          summary: issue.summary,
          timestamp: issue.created_at!,
        });
      });

      // Get recently resolved issues
      const { data: resolvedIssues } = await supabase
        .from('issues')
        .select(`
          id, 
          issue_key, 
          summary, 
          resolved_at
        `)
        .eq('project_id', projectId)
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(10);

      resolvedIssues?.forEach(issue => {
        result.push({
          id: `completed-${issue.id}`,
          type: 'completed',
          issueKey: issue.issue_key,
          summary: issue.summary,
          timestamp: issue.resolved_at!,
        });
      });

      // Get recent history (transitions, updates)
      const { data: history } = await supabase
        .from('issue_history')
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          changed_at,
          issue:issues!inner(id, issue_key, summary, project_id)
        `)
        .eq('issue.project_id', projectId)
        .order('changed_at', { ascending: false })
        .limit(20);

      history?.forEach(h => {
        const issue = h.issue as { issue_key: string; summary: string } | null;
        if (!issue) return;

        if (h.field_name === 'status') {
          result.push({
            id: `transition-${h.id}`,
            type: 'transition',
            issueKey: issue.issue_key,
            summary: issue.summary,
            timestamp: h.changed_at,
            details: `${h.old_value || 'Unknown'} → ${h.new_value || 'Unknown'}`,
          });
        } else {
          result.push({
            id: `updated-${h.id}`,
            type: 'updated',
            issueKey: issue.issue_key,
            summary: issue.summary,
            timestamp: h.changed_at,
            details: `${h.field_name} updated`,
          });
        }
      });

      // Sort by timestamp and take top 15
      return result
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    },
    enabled: !!projectId,
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'transition':
        return <ArrowRight className="h-4 w-4 text-yellow-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'created':
        return 'Created';
      case 'completed':
        return 'Completed';
      case 'transition':
        return 'Transitioned';
      case 'comment':
        return 'Commented';
      case 'updated':
        return 'Updated';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates across the project</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {activities?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0">
                  <div className="mt-1 p-1.5 rounded-full bg-muted">
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">
                        {activity.issueKey}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getLabel(activity.type)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 truncate">{activity.summary}</p>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
