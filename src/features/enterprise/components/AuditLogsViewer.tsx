import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  RefreshCw,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  classification_context: string | null;
  created_at: string;
}

export function AuditLogsViewer() {
  const [entityType, setEntityType] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', entityType, action],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }
      if (action !== 'all') {
        query = query.eq('action', action);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    return 'outline';
  };

  const getClassificationBadge = (level: string | null) => {
    if (!level) return null;
    const variants: Record<string, string> = {
      'public': 'bg-green-500/20 text-green-400',
      'restricted': 'bg-yellow-500/20 text-yellow-400',
      'confidential': 'bg-orange-500/20 text-orange-400',
      'export_controlled': 'bg-red-500/20 text-red-400',
    };
    return (
      <Badge className={variants[level] || ''}>
        {level.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Logs
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="sprint">Sprints</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs table */}
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : filteredLogs?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit logs found</p>
            <p className="text-sm">Audit logs will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {log.entity_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getClassificationBadge(log.classification_context)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[100px]">
                          {log.user_id?.slice(0, 8) || 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.new_values && (
                        <Button variant="ghost" size="sm">
                          View Changes
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
