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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  RefreshCw,
  User,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  readonly id: string;
  readonly user_id: string | null;
  readonly entity_type: string;
  readonly entity_id: string | null;
  readonly action: string;
  readonly old_values: Record<string, unknown> | null;
  readonly new_values: Record<string, unknown> | null;
  readonly classification_context: string | null;
  readonly created_at: string;
}

// Helper to format values for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// Helper to get human-readable field name
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    summary: 'Summary',
    description: 'Description',
    status_id: 'Status',
    assignee_id: 'Assignee',
    priority_id: 'Priority',
    story_points: 'Story Points',
    due_date: 'Due Date',
    issue_type_id: 'Issue Type',
    resolution_id: 'Resolution',
    name: 'Name',
    pkey: 'Project Key',
    template: 'Template',
    classification: 'Classification',
    is_archived: 'Archived',
    state: 'State',
    goal: 'Goal',
    start_date: 'Start Date',
    end_date: 'End Date',
  };
  return fieldNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Get changed fields between old and new values
function getChangedFields(oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null): { field: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
  
  if (!oldValues && !newValues) return changes;
  
  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {})
  ]);
  
  // Exclude internal/system fields
  const excludeFields = ['id', 'created_at', 'updated_at', 'user_id', 'reporter_id', 'project_id'];
  
  allKeys.forEach(key => {
    if (excludeFields.includes(key)) return;
    
    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];
    
    // Compare stringified values to detect changes
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  });
  
  return changes;
}

export function AuditLogsViewer() {
  const [entityType, setEntityType] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  // Get a brief summary of changes for the table
  const getChangeSummary = (log: AuditLog): string => {
    if (log.action === 'create') {
      const name = log.new_values?.['name'] || log.new_values?.['summary'] || log.new_values?.['pkey'];
      return name ? `Created: ${name}` : 'Created new record';
    }
    
    if (log.action === 'delete') {
      const name = log.old_values?.['name'] || log.old_values?.['summary'] || log.old_values?.['pkey'];
      return name ? `Deleted: ${name}` : 'Deleted record';
    }
    
    const changes = getChangedFields(log.old_values, log.new_values);
    if (changes.length === 0) return 'No changes detected';
    if (changes.length === 1) {
      return `Changed ${getFieldDisplayName(changes[0].field)}`;
    }
    return `Changed ${changes.length} fields`;
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <>
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
                <SelectItem value="issues">Issues</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="sprints">Sprints</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="boards">Boards</SelectItem>
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
                    <TableHead>Changes</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead></TableHead>
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
                              {log.entity_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getClassificationBadge(log.classification_context)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getChangeSummary(log)}
                        </span>
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
                        {(log.old_values || log.new_values) && (
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                            View Details
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Change Details
              {selectedLog && (
                <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                  {selectedLog.action}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entity Type:</span>
                  <span className="ml-2 font-medium">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </span>
                </div>
              </div>

              {selectedLog.action === 'create' && selectedLog.new_values && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Created with values:</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedLog.new_values)
                      .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground min-w-[120px]">
                            {getFieldDisplayName(key)}:
                          </span>
                          <span className="font-medium break-all">{formatValue(value)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {selectedLog.action === 'delete' && selectedLog.old_values && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Deleted record had:</h4>
                  <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedLog.old_values)
                      .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground min-w-[120px]">
                            {getFieldDisplayName(key)}:
                          </span>
                          <span className="break-all">{formatValue(value)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {selectedLog.action === 'update' && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Changes made:</h4>
                  <div className="space-y-3">
                    {getChangedFields(selectedLog.old_values, selectedLog.new_values).map(({ field, oldValue, newValue }) => (
                      <div key={field} className="bg-muted/50 rounded-lg p-3">
                        <div className="font-medium text-sm mb-2">{getFieldDisplayName(field)}</div>
                        <div className="flex items-start gap-2 text-sm">
                          <div className="flex-1 bg-destructive/10 rounded p-2">
                            <div className="text-xs text-muted-foreground mb-1">Before</div>
                            <div className="break-all">{formatValue(oldValue)}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 mt-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 bg-green-500/10 rounded p-2">
                            <div className="text-xs text-muted-foreground mb-1">After</div>
                            <div className="break-all">{formatValue(newValue)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {getChangedFields(selectedLog.old_values, selectedLog.new_values).length === 0 && (
                      <p className="text-muted-foreground text-sm">No field changes detected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
