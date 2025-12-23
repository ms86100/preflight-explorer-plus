import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  History, 
  ArrowRight, 
  User, 
  Flag, 
  FileText, 
  CheckCircle2,
  Calendar,
  Hash,
  Zap,
  Loader2,
  PlusCircle
} from 'lucide-react';

interface HistoryEntry {
  readonly id: string;
  readonly field_name: string;
  readonly old_value: string | null;
  readonly new_value: string | null;
  readonly changed_by: string;
  readonly changed_at: string;
  readonly changer?: {
    readonly display_name: string | null;
    readonly avatar_url: string | null;
  };
}

interface IssueHistorySectionProps {
  readonly issueId: string;
}

const FIELD_ICONS: Record<string, typeof History> = {
  status: CheckCircle2,
  assignee: User,
  priority: Flag,
  description: FileText,
  summary: FileText,
  due_date: Calendar,
  story_points: Hash,
  epic: Zap,
  created: PlusCircle,
};

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  assignee: 'Assignee',
  priority: 'Priority',
  description: 'Description',
  summary: 'Summary',
  due_date: 'Due Date',
  story_points: 'Story Points',
  epic: 'Epic',
  resolution: 'Resolution',
  created: 'Created',
};

export function IssueHistorySection({ issueId }: IssueHistorySectionProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['issue-history', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_history')
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          changed_by,
          changed_at,
          changer:profiles!issue_history_changed_by_fkey(display_name, avatar_url)
        `)
        .eq('issue_id', issueId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data as unknown as HistoryEntry[];
    },
    enabled: !!issueId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  // Group history by date
  const groupedHistory = history.reduce((acc, entry) => {
    const date = format(new Date(entry.changed_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, entries]) => (
          <div key={date}>
            <div className="sticky top-0 bg-background py-2 z-10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="space-y-3 mt-2">
              {entries.map((entry) => {
                const FieldIcon = FIELD_ICONS[entry.field_name] || History;
                const fieldLabel = FIELD_LABELS[entry.field_name] || entry.field_name;
                const changerName = entry.changer?.display_name || 'System';
                const changerInitials = changerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <div key={entry.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={entry.changer?.avatar_url || ''} alt={`${changerName} avatar`} />
                      <AvatarFallback className="text-xs">{changerInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{changerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-sm">
                        <div className="flex items-center gap-1.5">
                          <FieldIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{fieldLabel}</span>
                        </div>
                        
                        {entry.field_name === 'created' ? (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            Issue created
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {entry.old_value && (
                              <Badge variant="outline" className="text-xs font-normal max-w-[150px] truncate">
                                {entry.old_value}
                              </Badge>
                            )}
                            {!entry.old_value && entry.new_value && (
                              <span className="text-xs text-muted-foreground italic">empty</span>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            {entry.new_value ? (
                              <Badge variant="secondary" className="text-xs font-normal max-w-[150px] truncate">
                                {entry.new_value}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">empty</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}