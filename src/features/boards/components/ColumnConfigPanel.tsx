import { useState, useEffect, useMemo } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Trash2, X, GripVertical, AlertTriangle, Loader2, AlertCircle, ArrowRight, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { boardService } from '../services/boardService';
import { supabase } from '@/integrations/supabase/client';
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

interface WorkflowTransition {
  from_status_id: string;
  to_status_id: string;
}

interface ColumnConfigPanelProps {
  boardId: string;
  projectId?: string;
  onColumnsChanged: () => void;
}

export function ColumnConfigPanel({ boardId, projectId, onColumnsChanged }: ColumnConfigPanelProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [allStatuses, setAllStatuses] = useState<ColumnStatus[]>([]);
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);

  // Load columns, statuses, and workflow transitions
  useEffect(() => {
    loadData();
  }, [boardId, projectId]);

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

      // Load workflow transitions if we have a project
      if (projectId) {
        await loadWorkflowTransitions(projectId, statusesData || []);
      }
    } catch (error) {
      console.error('Failed to load column configuration:', error);
      toast.error('Failed to load column configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowTransitions = async (projId: string, statuses: ColumnStatus[]) => {
    try {
      // Get project's workflow scheme
      const { data: schemeData } = await supabase
        .from('project_workflow_schemes')
        .select('scheme_id')
        .eq('project_id', projId)
        .maybeSingle();

      if (!schemeData?.scheme_id) return;

      // Get workflow mappings for this scheme
      const { data: mappings } = await supabase
        .from('workflow_scheme_mappings')
        .select('workflow_id')
        .eq('scheme_id', schemeData.scheme_id);

      if (!mappings || mappings.length === 0) return;

      // Get all transitions from all workflows in the scheme
      const workflowIds = [...new Set(mappings.map(m => m.workflow_id))];
      
      const { data: steps } = await supabase
        .from('workflow_steps')
        .select('id, status_id, workflow_id')
        .in('workflow_id', workflowIds);

      const { data: transitions } = await supabase
        .from('workflow_transitions')
        .select('from_step_id, to_step_id')
        .in('workflow_id', workflowIds);

      if (!steps || !transitions) return;

      // Map step IDs to status IDs
      const stepToStatus = new Map<string, string>();
      steps.forEach(s => stepToStatus.set(s.id, s.status_id));

      // Convert transitions to status-to-status mappings
      const statusTransitions: WorkflowTransition[] = transitions
        .map(t => ({
          from_status_id: stepToStatus.get(t.from_step_id) || '',
          to_status_id: stepToStatus.get(t.to_step_id) || '',
        }))
        .filter(t => t.from_status_id && t.to_status_id);

      setWorkflowTransitions(statusTransitions);
    } catch (error) {
      console.error('Failed to load workflow transitions:', error);
    }
  };

  // Get unmapped statuses
  const mappedStatusIds = new Set(columns.flatMap(c => c.statuses.map(s => s.id)));
  const unmappedStatuses = allStatuses.filter(s => !mappedStatusIds.has(s.id));

  // Analyze workflow alignment for each column
  const columnAlignmentWarnings = useMemo(() => {
    const warnings = new Map<string, string[]>();

    if (workflowTransitions.length === 0) return warnings;

    columns.forEach((column, index) => {
      const columnWarnings: string[] = [];
      const columnStatusIds = new Set(column.statuses.map(s => s.id));

      // Check if any status in this column can be reached from previous columns
      if (index > 0) {
        const prevColumnStatusIds = new Set(
          columns.slice(0, index).flatMap(c => c.statuses.map(s => s.id))
        );

        const hasIncomingTransition = column.statuses.some(status =>
          workflowTransitions.some(
            t => t.to_status_id === status.id && prevColumnStatusIds.has(t.from_status_id)
          )
        );

        if (!hasIncomingTransition && column.statuses.length > 0) {
          columnWarnings.push('No workflow transitions lead to this column from previous columns');
        }
      }

      // Check if statuses in this column can transition to next columns
      if (index < columns.length - 1) {
        const nextColumnStatusIds = new Set(
          columns.slice(index + 1).flatMap(c => c.statuses.map(s => s.id))
        );

        const hasOutgoingTransition = column.statuses.some(status =>
          workflowTransitions.some(
            t => t.from_status_id === status.id && nextColumnStatusIds.has(t.to_status_id)
          )
        );

        if (!hasOutgoingTransition && column.statuses.length > 0) {
          columnWarnings.push('No workflow transitions lead from this column to next columns');
        }
      }

      if (columnWarnings.length > 0) {
        warnings.set(column.id, columnWarnings);
      }
    });

    return warnings;
  }, [columns, workflowTransitions]);

  // Check for specific status transition issues
  const statusTransitionInfo = useMemo(() => {
    const info = new Map<string, { canReach: string[]; reachableFrom: string[] }>();

    if (workflowTransitions.length === 0) return info;

    allStatuses.forEach(status => {
      const canReach = workflowTransitions
        .filter(t => t.from_status_id === status.id)
        .map(t => allStatuses.find(s => s.id === t.to_status_id)?.name || 'Unknown');

      const reachableFrom = workflowTransitions
        .filter(t => t.to_status_id === status.id)
        .map(t => allStatuses.find(s => s.id === t.from_status_id)?.name || 'Unknown');

      info.set(status.id, { canReach, reachableFrom });
    });

    return info;
  }, [allStatuses, workflowTransitions]);

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

  // Move column up or down
  const handleMoveColumn = async (columnId: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(c => c.id === columnId);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === columns.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Create a new array with swapped positions
    const newColumns = [...columns];
    [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];

    // Update positions for all columns
    const reorderData = newColumns.map((col, index) => ({ id: col.id, position: index }));

    setSaving(true);
    try {
      await boardService.reorderColumns(reorderData);
      await loadData();
      onColumnsChanged();
      toast.success('Column order updated');
    } catch (error) {
      console.error('Failed to reorder columns:', error);
      toast.error('Failed to reorder columns');
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

  const hasWorkflowWarnings = columnAlignmentWarnings.size > 0;

  return (
    <div className="space-y-6">
      {/* Workflow Alignment Warnings */}
      {hasWorkflowWarnings && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="h-4 w-4" />
              Workflow Alignment Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Some columns may not be reachable based on your workflow transitions. 
              Issues dragged to these columns may be blocked by workflow rules.
            </p>
            <div className="space-y-2">
              {Array.from(columnAlignmentWarnings.entries()).map(([columnId, warnings]) => {
                const column = columns.find(c => c.id === columnId);
                return (
                  <div key={columnId} className="text-xs p-2 bg-background/50 rounded">
                    <span className="font-medium">{column?.name}:</span>
                    <ul className="ml-4 mt-1 list-disc">
                      {warnings.map((warning, i) => (
                        <li key={i} className="text-muted-foreground">{warning}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
            </p>
            <div className="flex flex-wrap gap-2">
              {unmappedStatuses.map(status => (
                <Badge
                  key={status.id}
                  variant="outline"
                  className={`cursor-pointer hover:bg-accent ${getCategoryColor(status.category)}`}
                  onClick={() => {
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
        {columns.map((column, index) => {
          const warnings = columnAlignmentWarnings.get(column.id);
          const hasWarning = warnings && warnings.length > 0;

          return (
            <Card key={column.id} className={hasWarning ? 'border-orange-500/30' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Position and reorder controls */}
                    <div className="flex flex-col items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMoveColumn(column.id, 'up')}
                        disabled={index === 0 || saving}
                        title="Move column up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground font-mono w-4 text-center">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMoveColumn(column.id, 'down')}
                        disabled={index === columns.length - 1 || saving}
                        title="Move column down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
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
                    {hasWarning && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Workflow Issues:</p>
                          <ul className="text-xs list-disc ml-3">
                            {warnings?.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!hasWarning && column.statuses.length > 0 && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
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
                {/* Mapped Statuses with transition info */}
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {column.statuses.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No statuses mapped. Add statuses from the unmapped list above.
                    </span>
                  ) : (
                    column.statuses.map(status => {
                      const transitionInfo = statusTransitionInfo.get(status.id);
                      return (
                        <Tooltip key={status.id}>
                          <TooltipTrigger>
                            <Badge className={`${getCategoryColor(status.category)} pr-1`}>
                              {status.name}
                              <button
                                className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                                onClick={() => handleRemoveStatusFromColumn(column.id, status.id)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {transitionInfo && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>Can transition to: {transitionInfo.canReach.length > 0 ? transitionInfo.canReach.join(', ') : 'None'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3 rotate-180" />
                                  <span>Reachable from: {transitionInfo.reachableFrom.length > 0 ? transitionInfo.reachableFrom.join(', ') : 'None'}</span>
                                </div>
                              </div>
                            )}
                            {!transitionInfo && <span>No workflow data</span>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
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
          );
        })}
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
