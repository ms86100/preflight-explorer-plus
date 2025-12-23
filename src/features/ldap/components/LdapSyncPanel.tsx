import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LdapSyncLog } from '../types';
import { triggerSync, getSyncStatus } from '../services/ldapService';

interface LdapSyncPanelProps {
  readonly configId: string;
}

export function LdapSyncPanel({ configId }: LdapSyncPanelProps) {
  const [logs, setLogs] = useState<LdapSyncLog[]>([]);
  const [cachedUsers, setCachedUsers] = useState(0);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDataOpen, setSyncDataOpen] = useState(false);
  const [syncData, setSyncData] = useState('');

  useEffect(() => {
    loadSyncStatus();
  }, [configId]);

  const loadSyncStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getSyncStatus(configId);
      setLogs(status.recent_syncs);
      setCachedUsers(status.cached_users);
      setLastSyncStatus(status.config_status?.last_sync_status || null);
      setLastSyncAt(status.config_status?.last_sync_at || null);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerSync(configId);
      if (result.success) {
        toast.success(`Sync completed: ${result.users_synced} users, ${result.roles_assigned} roles assigned`);
      } else {
        toast.warning('Sync completed with errors');
      }
      loadSyncStatus();
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncWithData = async () => {
    setIsSyncing(true);
    try {
      const parsedData = JSON.parse(syncData);
      const result = await triggerSync(configId, parsedData);
      if (result.success) {
        toast.success(`Sync completed: ${result.users_synced} users synced`);
        setSyncDataOpen(false);
        setSyncData('');
      } else {
        toast.warning('Sync completed with errors');
      }
      loadSyncStatus();
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      } else {
        toast.error('Sync failed');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'completed_with_errors':
        return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Completed with errors</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'started':
      case 'in_progress':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const sampleData = JSON.stringify({
    users: [
      {
        email: "john.doe@company.com",
        dn: "CN=John Doe,OU=Users,DC=company,DC=com",
        username: "jdoe",
        display_name: "John Doe",
        department: "Engineering",
        groups: ["Developers", "Engineering Team"]
      }
    ],
    groups: [
      { name: "Developers", dn: "CN=Developers,OU=Groups,DC=company,DC=com" }
    ]
  }, null, 2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {lastSyncAt ? format(new Date(lastSyncAt), 'MMM d, HH:mm') : 'Never'}
              </span>
            </div>
            {lastSyncStatus && <div className="mt-1">{getStatusBadge(lastSyncStatus)}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cached Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cachedUsers}</div>
            <p className="text-xs text-muted-foreground">Users with LDAP data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sync Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleManualSync} 
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Sync Now
            </Button>
            <Dialog open={syncDataOpen} onOpenChange={setSyncDataOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload LDAP/AD Data</DialogTitle>
                  <DialogDescription>
                    Paste exported LDAP/AD data in JSON format to sync users and groups
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">JSON Data</label>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setSyncData(sampleData)}
                      >
                        <FileJson className="h-3 w-3 mr-1" />
                        Load Sample
                      </Button>
                    </div>
                    <Textarea
                      value={syncData}
                      onChange={(e) => setSyncData(e.target.value)}
                      placeholder={sampleData}
                      className="font-mono text-xs h-64"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSyncDataOpen(false)}>Cancel</Button>
                    <Button onClick={handleSyncWithData} disabled={!syncData || isSyncing}>
                      {isSyncing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Process Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization activity</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync history yet. Run a sync to see activity here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.started_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.sync_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.users_synced}</TableCell>
                    <TableCell>
                      <span className="text-green-600">+{log.roles_assigned}</span>
                      {log.roles_revoked > 0 && (
                        <span className="text-red-600 ml-1">-{log.roles_revoked}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.errors?.length > 0 ? (
                        <Badge variant="destructive">{log.errors.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
