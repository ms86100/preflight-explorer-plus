import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Layers,
  ArrowRight,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsProps {
  readonly projectId: string;
  readonly selectedIssueIds: readonly string[];
  readonly onSelectionChange: (ids: string[]) => void;
}

export function BulkOperations({ projectId, selectedIssueIds, onSelectionChange }: BulkOperationsProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operation, setOperation] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');

  const { data: statuses } = useQuery({
    queryKey: ['issue-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('issue_statuses').select('*').order('position');
      if (error) throw error;
      return data;
    },
  });

  const { data: priorities } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('priorities').select('*').order('position');
      if (error) throw error;
      return data;
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string | null }) => {
      const updates = selectedIssueIds.map(id => 
        supabase.from('issues').update({ [field]: value }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(`Updated ${selectedIssueIds.length} issues`);
      setIsDialogOpen(false);
      onSelectionChange([]);
    },
    onError: (error: Error) => {
      toast.error('Failed to update issues: ' + error.message);
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('issues')
        .delete()
        .in('id', selectedIssueIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(`Deleted ${selectedIssueIds.length} issues`);
      setIsDialogOpen(false);
      onSelectionChange([]);
    },
    onError: (error: Error) => {
      toast.error('Failed to delete issues: ' + error.message);
    },
  });

  const handleExecute = () => {
    if (operation === 'status' && targetValue) {
      bulkUpdate.mutate({ field: 'status_id', value: targetValue });
    } else if (operation === 'priority' && targetValue) {
      bulkUpdate.mutate({ field: 'priority_id', value: targetValue });
    } else if (operation === 'assignee') {
      bulkUpdate.mutate({ field: 'assignee_id', value: targetValue || null });
    } else if (operation === 'delete') {
      bulkDelete.mutate();
    }
  };

  if (selectedIssueIds.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedIssueIds.length} issue{selectedIssueIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Operations</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-operation">Operation</Label>
                    <Select value={operation} onValueChange={setOperation}>
                      <SelectTrigger id="bulk-operation">
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Change Status</SelectItem>
                        <SelectItem value="priority">Change Priority</SelectItem>
                        <SelectItem value="assignee">Change Assignee</SelectItem>
                        <SelectItem value="delete">Delete Issues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {operation === 'status' && (
                    <div className="space-y-2">
                      <Label htmlFor="new-status">New Status</Label>
                      <Select value={targetValue} onValueChange={setTargetValue}>
                        <SelectTrigger id="new-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses?.map(status => (
                            <SelectItem key={status.id} value={status.id}>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: status.color || '#6B7280' }}
                                />
                                {status.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {operation === 'priority' && (
                    <div className="space-y-2">
                      <Label htmlFor="new-priority">New Priority</Label>
                      <Select value={targetValue} onValueChange={setTargetValue}>
                        <SelectTrigger id="new-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities?.map(priority => (
                            <SelectItem key={priority.id} value={priority.id}>
                              {priority.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {operation === 'delete' && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Warning</p>
                          <p className="text-sm text-muted-foreground">
                            This will permanently delete {selectedIssueIds.length} issues. 
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant={operation === 'delete' ? 'destructive' : 'default'}
                      onClick={handleExecute}
                      disabled={
                        !operation || 
                        (operation !== 'delete' && operation !== 'assignee' && !targetValue) ||
                        bulkUpdate.isPending || 
                        bulkDelete.isPending
                      }
                    >
                      {bulkUpdate.isPending || bulkDelete.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Execute
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
