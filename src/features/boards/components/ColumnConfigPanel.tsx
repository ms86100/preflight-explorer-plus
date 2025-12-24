import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { Plus, Trash2, X, GripVertical, AlertTriangle, Loader2 } from 'lucide-react';
import { boardService } from '../services/boardService';
import { toast } from 'sonner';

interface ColumnStatus {
  id: string;
  name: string;
  color: string | null;
  category: string | null;
}

interface Column {
  id: string;
  name: string;
  position: number;
  max_issues: number | null;
  min_issues: number | null;
  statuses: ColumnStatus[];
}

interface ColumnConfigPanelProps {
  boardId: string;
  onColumnsChanged: () => void;
}

export function ColumnConfigPanel({ boardId, onColumnsChanged }: ColumnConfigPanelProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [allStatuses, setAllStatuses] = useState<ColumnStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);

  // Load columns and statuses
  useEffect(() => {
    loadData();
  }, [boardId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [columnsData, statusesData] = await Promise.all([
        boardService.getColumns(boardId),
        boardService.getAllStatuses(),
      ]);

      // Transform columns data
      const transformedColumns: Column[] = (columnsData || []).map((col: any) => ({
        id: col.id,
        name: col.name,
        position: col.position,
        max_issues: col.max_issues,
        min_issues: col.min_issues,
        statuses: (col.column_statuses || [])
          .map((cs: any) => cs.status)
          .filter(Boolean),
      }));

      setColumns(transformedColumns.sort((a, b) => a.position - b.position));
      setAllStatuses(statusesData || []);
    } catch (error) {
      console.error('Failed to load column configuration:', error);
      toast.error('Failed to load column configuration');
    } finally {
      setLoading(false);
    }
  };

  // Get unmapped statuses
  const mappedStatusIds = new Set(columns.flatMap(c => c.statuses.map(s => s.id)));
  const unmappedStatuses = allStatuses.filter(s => !mappedStatusIds.has(s.id));

  // Add new column
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    setSaving(true);
    try {
      const maxPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;
      await boardService.createColumn(boardId, newColumnName.trim(), maxPosition);
      setNewColumnName('');
      await loadData();
      onColumnsChanged();
      toast.success('Column added');
    } catch (error) {
      console.error('Failed to add column:', error);
      toast.error('Failed to add column');
    } finally {
      setSaving(false);
    }
  };

  // Rename column
  const handleRenameColumn = async (columnId: string) => {
    if (!editingColumnName.trim()) {
      setEditingColumnId(null);
      return;
    }

    setSaving(true);
    try {
      await boardService.updateColumn(columnId, { name: editingColumnName.trim() });
      setEditingColumnId(null);
      await loadData();
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to rename column:', error);
      toast.error('Failed to rename column');
    } finally {
      setSaving(false);
    }
  };

  // Delete column
  const handleDeleteColumn = async () => {
    if (!deleteColumnId) return;

    const column = columns.find(c => c.id === deleteColumnId);
    if (column && column.statuses.length > 0) {
      toast.error('Remove all statuses from the column first');
      setDeleteColumnId(null);
      return;
    }

    setSaving(true);
    try {
      await boardService.deleteColumn(deleteColumnId);
      setDeleteColumnId(null);
      await loadData();
      onColumnsChanged();
      toast.success('Column deleted');
    } catch (error) {
      console.error('Failed to delete column:', error);
      toast.error('Failed to delete column');
    } finally {
      setSaving(false);
    }
  };

  // Add status to column
  const handleAddStatusToColumn = async (columnId: string, statusId: string) => {
    setSaving(true);
    try {
      await boardService.addStatusToColumn(columnId, statusId);
      await loadData();
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to add status to column:', error);
      toast.error('Failed to add status to column');
    } finally {
      setSaving(false);
    }
  };

  // Remove status from column
  const handleRemoveStatusFromColumn = async (columnId: string, statusId: string) => {
    setSaving(true);
    try {
      await boardService.removeStatusFromColumn(columnId, statusId);
      await loadData();
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to remove status from column:', error);
      toast.error('Failed to remove status from column');
    } finally {
      setSaving(false);
    }
  };

  // Update WIP limit
  const handleUpdateWipLimit = async (columnId: string, maxIssues: number | null) => {
    setSaving(true);
    try {
      await boardService.updateColumn(columnId, { max_issues: maxIssues });
      await loadData();
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to update WIP limit:', error);
      toast.error('Failed to update WIP limit');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'todo':
        return 'bg-muted text-muted-foreground';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'done':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unmapped Statuses Warning */}
      {unmappedStatuses.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4" />
              Unmapped Statuses ({unmappedStatuses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              These statuses are not mapped to any column. Issues with these statuses won't appear on the board.
              Drag them to a column or click to add.
            </p>
            <div className="flex flex-wrap gap-2">
              {unmappedStatuses.map(status => (
                <Badge
                  key={status.id}
                  variant="outline"
                  className={`cursor-pointer hover:bg-accent ${getCategoryColor(status.category)}`}
                  onClick={() => {
                    // Add to first matching category column or first column
                    const targetColumn = columns.find(c => 
                      c.statuses.some(s => s.category === status.category)
                    ) || columns[0];
                    if (targetColumn) {
                      handleAddStatusToColumn(targetColumn.id, status.id);
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {status.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Column */}
      <div className="flex gap-2">
        <Input
          placeholder="New column name..."
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
          disabled={saving}
        />
        <Button onClick={handleAddColumn} disabled={!newColumnName.trim() || saving}>
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>

      <Separator />

      {/* Column List */}
      <div className="space-y-4">
        {columns.map((column, index) => (
          <Card key={column.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  {editingColumnId === column.id ? (
                    <Input
                      value={editingColumnName}
                      onChange={(e) => setEditingColumnName(e.target.value)}
                      onBlur={() => handleRenameColumn(column.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameColumn(column.id);
                        if (e.key === 'Escape') setEditingColumnId(null);
                      }}
                      className="h-7 w-48"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={() => {
                        setEditingColumnId(column.id);
                        setEditingColumnName(column.name);
                      }}
                    >
                      {column.name}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {column.statuses.length} status{column.statuses.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">WIP:</Label>
                    <Input
                      type="number"
                      min={0}
                      value={column.max_issues || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        handleUpdateWipLimit(column.id, val);
                      }}
                      placeholder="∞"
                      className="h-7 w-16 text-center"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteColumnId(column.id)}
                    disabled={columns.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mapped Statuses */}
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {column.statuses.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No statuses mapped. Add statuses from the unmapped list above.
                  </span>
                ) : (
                  column.statuses.map(status => (
                    <Badge
                      key={status.id}
                      className={`${getCategoryColor(status.category)} pr-1`}
                    >
                      {status.name}
                      <button
                        className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                        onClick={() => handleRemoveStatusFromColumn(column.id, status.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              {/* Available statuses to add */}
              {unmappedStatuses.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">Add status:</Label>
                  <div className="flex flex-wrap gap-1">
                    {unmappedStatuses.map(status => (
                      <Badge
                        key={status.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() => handleAddStatusToColumn(column.id, status.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {status.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {columns.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No columns configured. Add a column to get started.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the column from the board. Any status mappings will also be removed.
              Issues will not be deleted, but they won't appear in any column until remapped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
