import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IssueStatus {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
  color: string | null;
  position: number | null;
  description: string | null;
}

type StatusCategory = 'todo' | 'in_progress' | 'done';

const CATEGORY_LABELS: Record<StatusCategory, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const CATEGORY_COLORS: Record<StatusCategory, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
};

const DEFAULT_COLORS = [
  '#42526E', // Gray
  '#0052CC', // Blue
  '#FF8B00', // Orange
  '#36B37E', // Green
  '#FF5630', // Red
  '#6554C0', // Purple
  '#00B8D9', // Cyan
  '#FFAB00', // Yellow
];

export function StatusManager() {
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<IssueStatus | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<IssueStatus | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<StatusCategory>('todo');
  const [formColor, setFormColor] = useState(DEFAULT_COLORS[0]);
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('issue_statuses')
      .select('*')
      .order('position');
    
    if (error) {
      toast.error('Failed to load statuses');
    } else {
      setStatuses((data || []) as IssueStatus[]);
    }
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setEditingStatus(null);
    setFormName('');
    setFormCategory('todo');
    setFormColor(DEFAULT_COLORS[0]);
    setFormDescription('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (status: IssueStatus) => {
    setEditingStatus(status);
    setFormName(status.name);
    setFormCategory(status.category);
    setFormColor(status.color || DEFAULT_COLORS[0]);
    setFormDescription(status.description || '');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (status: IssueStatus) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Status name is required');
      return;
    }

    setIsSaving(true);

    if (editingStatus) {
      // Update existing status
      const { error } = await supabase
        .from('issue_statuses')
        .update({
          name: formName.trim(),
          category: formCategory,
          color: formColor,
          description: formDescription.trim() || null,
        })
        .eq('id', editingStatus.id);

      if (error) {
        toast.error('Failed to update status');
      } else {
        toast.success('Status updated successfully');
        setIsDialogOpen(false);
        fetchStatuses();
      }
    } else {
      // Create new status
      const maxPosition = Math.max(...statuses.map(s => s.position || 0), 0);
      
      const { error } = await supabase
        .from('issue_statuses')
        .insert({
          name: formName.trim(),
          category: formCategory,
          color: formColor,
          description: formDescription.trim() || null,
          position: maxPosition + 1,
        });

      if (error) {
        toast.error('Failed to create status');
      } else {
        toast.success('Status created successfully');
        setIsDialogOpen(false);
        fetchStatuses();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!statusToDelete) return;

    // Check if status is used by any issues
    const { count, error: countError } = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status_id', statusToDelete.id);

    if (countError) {
      toast.error('Failed to check status usage');
      return;
    }

    if (count && count > 0) {
      toast.error(`Cannot delete: ${count} issue(s) are using this status`);
      setIsDeleteDialogOpen(false);
      return;
    }

    const { error } = await supabase
      .from('issue_statuses')
      .delete()
      .eq('id', statusToDelete.id);

    if (error) {
      toast.error('Failed to delete status');
    } else {
      toast.success('Status deleted successfully');
      fetchStatuses();
    }

    setIsDeleteDialogOpen(false);
    setStatusToDelete(null);
  };

  // Group statuses by category
  const groupedStatuses = {
    todo: statuses.filter(s => s.category === 'todo'),
    in_progress: statuses.filter(s => s.category === 'in_progress'),
    done: statuses.filter(s => s.category === 'done'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Issue Statuses</h2>
          <p className="text-sm text-muted-foreground">
            Manage workflow statuses for your issues. Each status belongs to a category that determines its column on boards.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Status
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading statuses...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {(Object.keys(groupedStatuses) as StatusCategory[]).map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category]}`} />
                  {CATEGORY_LABELS[category]}
                </CardTitle>
                <CardDescription>
                  {category === 'todo' && 'Work that has not been started'}
                  {category === 'in_progress' && 'Work that is actively being done'}
                  {category === 'done' && 'Work that has been completed'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupedStatuses[category].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No statuses</p>
                ) : (
                  groupedStatuses[category].map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Circle
                          className="h-4 w-4"
                          style={{ color: status.color || '#6B7280', fill: status.color || '#6B7280' }}
                        />
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(status)}
                          aria-label={`Edit ${status.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(status)}
                          aria-label={`Delete ${status.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Edit Status' : 'Create Status'}</DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the status details below.'
                : 'Create a new status for your workflow.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-name">Name</Label>
              <Input
                id="status-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Under Validation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-category">Category</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as StatusCategory)}>
                <SelectTrigger id="status-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS.todo}`} />
                      To Do - Work not started
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS.in_progress}`} />
                      In Progress - Work in progress
                    </div>
                  </SelectItem>
                  <SelectItem value="done">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS.done}`} />
                      Done - Work completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The category determines which board column this status appears in.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-xs">Custom:</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-24 h-8 text-xs"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-description">Description (optional)</Label>
              <Input
                id="status-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this status"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingStatus ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{statusToDelete?.name}"? This action cannot be undone.
              <br /><br />
              <strong>Note:</strong> You cannot delete a status that is currently used by any issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
