// Sync Status Indicator Component
// Shows the last sync time and sync status for Git organizations

import { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { GitOrganization } from '../types';

interface SyncStatusIndicatorProps {
  organization: GitOrganization;
  onSyncComplete?: () => void;
}

export function SyncStatusIndicator({ organization, onSyncComplete }: SyncStatusIndicatorProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Call the git-sync edge function
      const { error } = await supabase.functions.invoke('git-sync', {
        body: { organization_id: organization.id },
      });

      if (error) throw error;

      toast.success('Sync completed successfully');
      onSyncComplete?.();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed. Check the organization connection.');
    } finally {
      setSyncing(false);
    }
  };

  const lastSyncAt = organization.last_sync_at;
  const lastSyncError = organization.last_sync_error;
  
  const hasError = !!lastSyncError;
  const neverSynced = !lastSyncAt;
  
  const timeAgo = lastSyncAt 
    ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      {hasError ? (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
              <XCircle className="h-3 w-3" />
              Error
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Last sync failed</p>
            <p className="text-sm text-muted-foreground">{lastSyncError}</p>
          </TooltipContent>
        </Tooltip>
      ) : neverSynced ? (
        <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3" />
          Never synced
        </Badge>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Synced
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last synced {timeAgo}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Last Sync Time */}
      {timeAgo && !hasError && (
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      )}

      {/* Sync Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSync}
            disabled={syncing || !organization.is_active}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {organization.is_active ? 'Sync now' : 'Organization is disabled'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Compact version for table/list views
export function SyncStatusBadge({ organization }: { organization: GitOrganization }) {
  const lastSyncAt = organization.last_sync_at;
  const lastSyncError = organization.last_sync_error;
  
  const hasError = !!lastSyncError;
  const neverSynced = !lastSyncAt;

  if (hasError) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <XCircle className="h-4 w-4 text-red-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Sync error</p>
          <p className="text-sm">{lastSyncError}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (neverSynced) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Clock className="h-4 w-4 text-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>Never synced</TooltipContent>
      </Tooltip>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true });

  return (
    <Tooltip>
      <TooltipTrigger>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </TooltipTrigger>
      <TooltipContent>Synced {timeAgo}</TooltipContent>
    </Tooltip>
  );
}
