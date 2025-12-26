import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { AlertTriangle, Loader2, AlertCircle, ArrowRight, CheckCircle2, ChevronUp, ChevronDown, RefreshCw, GitBranch, Lock } from 'lucide-react';
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
  const [workflowName, setWorkflowName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

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
      setAllStatuses((statusesData as ColumnStatus[]) || []);

      // Load workflow transitions if we have a project
      if (projectId) {
        await loadWorkflowTransitions(projectId, (statusesData as ColumnStatus[]) || []);
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
      // Get project's workflow scheme - using type assertion for tables not in current schema
      const { data: schemeData } = await (supabase.from as any)('project_workflow_schemes')
        .select('scheme_id')
        .eq('project_id', projId)
        .maybeSingle();

      if (!schemeData?.scheme_id) return;

      // Get workflow mappings for this scheme (default mapping)
      const { data: mappings } = await (supabase.from as any)('workflow_scheme_mappings')
        .select('workflow_id')
        .eq('scheme_id', schemeData.scheme_id)
        .is('issue_type_id', null)
        .maybeSingle();

      if (!mappings?.workflow_id) return;

      // Get workflow name
      const { data: workflow } = await (supabase.from as any)('workflows')
        .select('name')
        .eq('id', mappings.workflow_id)
        .single();

      if (workflow) {
        setWorkflowName(workflow.name);
      }

      // Get all steps and transitions from the workflow
      const { data: steps } = await (supabase.from as any)('workflow_steps')
        .select('id, status_id, workflow_id')
        .eq('workflow_id', mappings.workflow_id);

      const { data: transitions } = await (supabase.from as any)('workflow_transitions')
        .select('from_step_id, to_step_id')
        .eq('workflow_id', mappings.workflow_id);

      if (!steps || !transitions) return;

      // Map step IDs to status IDs
      const stepToStatus = new Map<string, string>();
      (steps as any[]).forEach(s => stepToStatus.set(s.id, s.status_id));

      // Convert transitions to status-to-status mappings
      const statusTransitions: WorkflowTransition[] = (transitions as any[])
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

  // Sync columns with workflow
  const handleSyncWithWorkflow = async () => {
    if (!projectId) {
      toast.error('No project associated with this board');
      return;
    }

    setSyncing(true);
    setShowSyncConfirm(false);
    
    try {
      const result = await boardService.generateColumnsFromWorkflow(boardId, projectId, true);
      await loadData();
      onColumnsChanged();
      toast.success(`Synced with workflow: ${result.columnsCreated} columns created`);
    } catch (error) {
      console.error('Failed to sync with workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync with workflow');
    } finally {
      setSyncing(false);
    }
  };

  // Get unmapped statuses (workflow statuses not in columns)
  const mappedStatusIds = new Set(columns.flatMap(c => c.statuses.map(s => s.id)));
  const workflowStatusIds = useMemo(() => {
    return new Set(workflowTransitions.flatMap(t => [t.from_status_id, t.to_status_id]));
  }, [workflowTransitions]);
  
  const unmappedStatuses = allStatuses.filter(s => 
    workflowStatusIds.has(s.id) && !mappedStatusIds.has(s.id)
  );

  // Analyze workflow alignment for each column
  const columnAlignmentWarnings = useMemo(() => {
    const warnings = new Map<string, string[]>();

    if (workflowTransitions.length === 0) return warnings;

    columns.forEach((column, index) => {
      const columnWarnings: string[] = [];

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
  const hasNoWorkflow = !workflowName || workflowTransitions.length === 0;

  return (
    <div className="space-y-6">
      {/* Workflow Info Card */}
      {workflowName && projectId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <GitBranch className="h-4 w-4" />
                Workflow: {workflowName}
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSyncConfirm(true)}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync with Workflow
              </Button>
            </div>
            <CardDescription className="text-xs">
              Board columns are generated from your workflow. Use "Sync with Workflow" to update columns when the workflow changes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* No Workflow Warning */}
      {hasNoWorkflow && (
        <Card className="border-muted bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Basic Column Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This board is using basic columns without a workflow scheme. You can manage columns manually, 
              or assign a workflow scheme in Administration → Workflow Schemes for workflow-driven columns.
            </p>
          </CardContent>
        </Card>
      )}

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
              Click "Sync with Workflow" to fix these issues automatically.
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
              Unmapped Workflow Statuses ({unmappedStatuses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              These workflow statuses are not mapped to any column. Click "Sync with Workflow" to create columns for them.
            </p>
            <div className="flex flex-wrap gap-2">
              {unmappedStatuses.map(status => (
                <Badge
                  key={status.id}
                  variant="outline"
                  className={getCategoryColor(status.category)}
                >
                  {status.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Management Notice */}
      <Card className="border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            Column Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {workflowName 
              ? "Columns are automatically generated from your workflow. You can adjust WIP limits and column order. To change columns, modify the workflow in the Workflow Designer."
              : "You can configure columns, adjust WIP limits, and reorder them as needed. For workflow-driven columns, assign a workflow scheme to this project."}
          </p>
        </CardContent>
      </Card>

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
                    {/* Read-only column name */}
                    <span className="font-medium text-foreground">
                      {column.name}
                    </span>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Read-only Mapped Statuses with transition info */}
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {column.statuses.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No statuses mapped. Click "Sync with Workflow" to update.
                    </span>
                  ) : (
                    column.statuses.map(status => {
                      const transitionInfo = statusTransitionInfo.get(status.id);
                      return (
                        <Tooltip key={status.id}>
                          <TooltipTrigger>
                            <Badge className={getCategoryColor(status.category)}>
                              {status.name}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {columns.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No columns configured. Click "Sync with Workflow" to generate columns from your workflow.</p>
        </div>
      )}

      {/* Sync Confirmation Dialog */}
      <AlertDialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync Columns with Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate all board columns based on your workflow statuses.
              Existing columns will be replaced. WIP limits will be preserved where column names match.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncWithWorkflow}>
              Sync Columns
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
