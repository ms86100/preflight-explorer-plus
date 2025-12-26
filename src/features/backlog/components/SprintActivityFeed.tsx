import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  Plus,
  Play,
  CheckCircle2,
  Edit3,
  ArrowRightLeft,
  Minus,
  Clock,
  Filter,
  Loader2,
  Archive,
  Activity,
} from 'lucide-react';
import { SprintHistoryView } from './SprintHistoryView';

interface SprintHistoryEntry {
  id: string;
  sprint_id: string;
  action: string;
  actor_id: string | null;
  issue_id: string | null;
  issue_key: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sprint?: {
    name: string;
  };
  actor?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface SprintActivityFeedProps {
  readonly boardId: string;
  readonly projectKey: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof Plus; label: string; color: string }> = {
  created: { icon: Plus, label: 'Sprint Created', color: 'text-green-500' },
  started: { icon: Play, label: 'Sprint Started', color: 'text-blue-500' },
  completed: { icon: CheckCircle2, label: 'Sprint Completed', color: 'text-purple-500' },
  edited: { icon: Edit3, label: 'Sprint Edited', color: 'text-orange-500' },
  issue_added: { icon: ArrowRightLeft, label: 'Issue Added', color: 'text-cyan-500' },
  issue_removed: { icon: Minus, label: 'Issue Removed', color: 'text-red-500' },
};

function useSprintHistory(boardId: string, actionFilter?: string) {
  return useQuery({
    queryKey: ['sprint-history', boardId, actionFilter],
    queryFn: async () => {
      try {
        // First get all sprints for this board
        const { data: sprints, error: sprintsError } = await (supabase.from as any)('sprints')
          .select('id, name')
          .eq('board_id', boardId);

        if (sprintsError) {
          console.warn('Sprints table not available:', sprintsError.message);
          return [];
        }
        if (!sprints?.length) return [];

        const sprintIds = (sprints as any[]).map((s) => s.id);
        const sprintMap = new Map((sprints as any[]).map((s) => [s.id, s]));

        // Get history for all sprints
        let query = (supabase.from as any)('sprint_history')
          .select('*')
          .in('sprint_id', sprintIds)
          .order('created_at', { ascending: false })
          .limit(100);

        if (actionFilter && actionFilter !== 'all') {
          query = query.eq('action', actionFilter);
        }

        const { data: history, error: historyError } = await query;

        if (historyError) {
          console.warn('Sprint history table not available');
          return [];
        }

        // Get unique actor IDs
        const actorIds = [...new Set((history || []).map((h: any) => h.actor_id).filter(Boolean))] as string[];

        // Fetch actor profiles
        let actorMap = new Map<string, { display_name: string; avatar_url: string | null }>();
        if (actorIds.length > 0) {
          const { data: profiles } = await (supabase.from as any)('profiles')
            .select('id, display_name, avatar_url')
            .in('id', actorIds);
          if (profiles) {
            actorMap = new Map((profiles as any[]).map((p) => [p.id, p]));
          }
        }

        // Enrich history entries
        return (history || []).map((entry: any) => ({
          ...entry,
          sprint: sprintMap.get(entry.sprint_id),
          actor: entry.actor_id ? actorMap.get(entry.actor_id) : undefined,
        })) as SprintHistoryEntry[];
      } catch (error) {
        console.warn('Failed to fetch sprint history:', error);
        return [];
      }
    },
    enabled: !!boardId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

function ActivityEntry({ entry }: { readonly entry: SprintHistoryEntry }) {
  const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.edited;
  const Icon = config.icon;

  const getDescription = () => {
    const actorName = entry.actor?.display_name || 'Someone';
    const sprintName = entry.sprint?.name || 'Sprint';

    switch (entry.action) {
      case 'created':
        return (
          <>
            <strong>{actorName}</strong> created <strong>{sprintName}</strong>
          </>
        );
      case 'started': {
        const issueCount = (entry.metadata?.issue_count as number) || 0;
        return (
          <>
            <strong>{actorName}</strong> started <strong>{sprintName}</strong> with{' '}
            <Badge variant="secondary" className="mx-1">
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </Badge>
          </>
        );
      }
      case 'completed': {
        const total = (entry.metadata?.total_issues as number) || 0;
        const completed = (entry.metadata?.completed_issues as number) || 0;
        const spillover = (entry.metadata?.spillover_issues as number) || 0;
        return (
          <>
            <strong>{actorName}</strong> completed <strong>{sprintName}</strong>
            <div className="mt-1 flex gap-2">
              <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
                {completed} done
              </Badge>
              {spillover > 0 && (
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                  {spillover} spillover
                </Badge>
              )}
            </div>
          </>
        );
      }
      case 'edited': {
        const changes: string[] = [];
        if (entry.old_values?.name !== entry.new_values?.name) {
          changes.push(`renamed to "${entry.new_values?.name}"`);
        }
        if (entry.old_values?.goal !== entry.new_values?.goal) {
          changes.push('updated goal');
        }
        if (entry.old_values?.start_date !== entry.new_values?.start_date) {
          changes.push('changed start date');
        }
        if (entry.old_values?.end_date !== entry.new_values?.end_date) {
          changes.push('changed end date');
        }
        return (
          <>
            <strong>{actorName}</strong> edited <strong>{sprintName}</strong>
            {changes.length > 0 && (
              <span className="text-muted-foreground"> - {changes.join(', ')}</span>
            )}
          </>
        );
      }
      case 'issue_added':
        return (
          <>
            <strong>{actorName}</strong> added{' '}
            <Badge variant="outline" className="font-mono mx-1">
              {entry.issue_key}
            </Badge>{' '}
            to <strong>{sprintName}</strong>
          </>
        );
      case 'issue_removed':
        return (
          <>
            <strong>{actorName}</strong> removed{' '}
            <Badge variant="outline" className="font-mono mx-1">
              {entry.issue_key}
            </Badge>{' '}
            from <strong>{sprintName}</strong>
          </>
        );
      default:
        return (
          <>
            <strong>{actorName}</strong> performed action on <strong>{sprintName}</strong>
          </>
        );
    }
  };

  return (
    <div className="flex gap-3 py-3">
      <div className="flex-shrink-0 mt-0.5">
        <div className={`p-2 rounded-full bg-muted ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{getDescription()}</div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span title={format(new Date(entry.created_at), 'PPpp')}>
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      {entry.actor && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {entry.actor.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ActivityFeedContent({ 
  boardId, 
  actionFilter, 
  setActionFilter 
}: { 
  readonly boardId: string; 
  readonly actionFilter: string; 
  readonly setActionFilter: (value: string) => void;
}) {
  const { data: history, isLoading, refetch } = useSprintHistory(boardId, actionFilter);

  // Real-time subscription
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`sprint-history-feed-${boardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sprint_history' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, refetch]);

  return (
    <>
      <div className="flex items-center gap-2 py-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="created">Sprint Created</SelectItem>
            <SelectItem value="started">Sprint Started</SelectItem>
            <SelectItem value="completed">Sprint Completed</SelectItem>
            <SelectItem value="edited">Sprint Edited</SelectItem>
            <SelectItem value="issue_added">Issue Added</SelectItem>
            <SelectItem value="issue_removed">Issue Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <ScrollArea className="flex-1 -mx-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !history?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No sprint activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a sprint to start tracking activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}

export function SprintActivityFeed({ boardId, projectKey }: SprintActivityFeedProps) {
  const [open, setOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('sprints');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[640px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sprint History
          </SheetTitle>
          <SheetDescription>
            Complete history of all sprints in {projectKey}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sprints" className="gap-2">
              <Archive className="h-4 w-4" />
              Past Sprints
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity Feed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sprints" className="flex-1 flex flex-col mt-4">
            <SprintHistoryView boardId={boardId} />
          </TabsContent>
          
          <TabsContent value="activity" className="flex-1 flex flex-col mt-4">
            <ActivityFeedContent 
              boardId={boardId} 
              actionFilter={actionFilter}
              setActionFilter={setActionFilter}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
