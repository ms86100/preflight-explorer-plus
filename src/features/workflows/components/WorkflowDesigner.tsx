import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useWorkflowWithDetails, 
  useUpdateWorkflowStep, 
  useAddWorkflowStep,
  useDeleteWorkflowStep,
  useAddWorkflowTransition,
  useDeleteWorkflowTransition,
  useUpdateWorkflow
} from '../hooks/useWorkflows';
import { useStatuses, useCreateStatus } from '@/features/issues/hooks/useIssues';
import type { WorkflowStepRow } from '../services/workflowService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  GripVertical,
  Circle,
  CheckCircle2,
  Clock,
  Star,
  Edit2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
// Select imports removed - unused (S1128)
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkflowDesignerProps {
  readonly workflowId: string;
}

interface DragState {
  stepId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

interface ConnectionState {
  fromStepId: string;
  fromX: number;
  fromY: number;
}

// Local position state for smooth dragging
interface StepPositions {
  [stepId: string]: { x: number; y: number };
}

export function WorkflowDesigner({ workflowId }: WorkflowDesignerProps) {
  const { data: workflow, isLoading } = useWorkflowWithDetails(workflowId);
  const { data: allStatuses } = useStatuses();
  const updateStep = useUpdateWorkflowStep();
  const addStep = useAddWorkflowStep();
  const deleteStep = useDeleteWorkflowStep();
  const addTransition = useAddWorkflowTransition();
  const deleteTransition = useDeleteWorkflowTransition();
  const updateWorkflow = useUpdateWorkflow();
  const createStatus = useCreateStatus();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Local positions for smooth dragging (not synced to DB until mouseUp)
  const [localPositions, setLocalPositions] = useState<StepPositions>({});
  
  // Edit workflow properties state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Create status dialog state
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6B7280');

  // Initialize edit form when workflow loads
  useEffect(() => {
    if (workflow) {
      setEditName(workflow.name);
      setEditDescription(workflow.description || '');
    }
  }, [workflow]);

  // Initialize local positions from workflow steps
  useEffect(() => {
    if (workflow?.steps) {
      const positions: StepPositions = {};
      workflow.steps.forEach(step => {
        positions[step.id] = { x: step.position_x, y: step.position_y };
      });
      setLocalPositions(positions);
    }
  }, [workflow?.steps]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (dragState) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const newX = Math.max(0, Math.min(800, dragState.initialX + dx));
      const newY = Math.max(0, Math.min(400, dragState.initialY + dy));
      
      // Update local position only (not DB)
      setLocalPositions(prev => ({
        ...prev,
        [dragState.stepId]: { x: newX, y: newY }
      }));
    }
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState) {
      // Save final position to DB
      const finalPos = localPositions[dragState.stepId];
      if (finalPos) {
        updateStep.mutate({
          id: dragState.stepId,
          data: { position_x: finalPos.x, position_y: finalPos.y }
        });
      }
    }
    setDragState(null);
  }, [dragState, localPositions, updateStep]);

  useEffect(() => {
    if (dragState || connectionState) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp);
      return () => {
        globalThis.removeEventListener('mousemove', handleMouseMove);
        globalThis.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, connectionState, handleMouseMove, handleMouseUp]);

  const handleStepMouseDown = (step: WorkflowStepRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = localPositions[step.id] || { x: step.position_x, y: step.position_y };
    setDragState({
      stepId: step.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    });
  };

  const handleStartConnection = (step: WorkflowStepRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = localPositions[step.id] || { x: step.position_x, y: step.position_y };
    setConnectionState({
      fromStepId: step.id,
      fromX: pos.x + 80,
      fromY: pos.y + 30,
    });
  };

  const handleStepClick = (step: WorkflowStepRow) => {
    if (connectionState && connectionState.fromStepId !== step.id) {
      const existingTransition = workflow?.transitions.find(
        t => t.from_step_id === connectionState.fromStepId && t.to_step_id === step.id
      );
      
      if (!existingTransition) {
        const fromStep = workflow?.steps.find(s => s.id === connectionState.fromStepId);
        addTransition.mutate({
          workflow_id: workflowId,
          from_step_id: connectionState.fromStepId,
          to_step_id: step.id,
          name: `${fromStep?.status?.name} → ${step.status?.name}`,
        });
      }
      setConnectionState(null);
    }
  };

  const handleCanvasClick = () => {
    setConnectionState(null);
  };

  const availableStatuses = allStatuses?.filter(
    status => !workflow?.steps.some(step => step.status_id === status.id)
  );

  const handleAddStatus = (statusId: string) => {
    const existingSteps = workflow?.steps || [];
    const maxX = Math.max(100, ...existingSteps.map(s => localPositions[s.id]?.x ?? s.position_x)) + 150;
    
    addStep.mutate({
      workflow_id: workflowId,
      status_id: statusId,
      position_x: maxX,
      position_y: 200,
    });
  };

  // Create a new status and add it to the workflow
  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error('Status name is required');
      return;
    }
    
    try {
      const newStatus = await createStatus.mutateAsync({
        name: newStatusName.trim(),
        category: 'todo',
        color: newStatusColor,
      });
      
      // Add to workflow
      const existingSteps = workflow?.steps || [];
      const maxX = Math.max(100, ...existingSteps.map(s => localPositions[s.id]?.x ?? s.position_x)) + 150;
      
      addStep.mutate({
        workflow_id: workflowId,
        status_id: newStatus.id,
        position_x: maxX,
        position_y: 200,
      });
      
      // Reset form
      setNewStatusName('');
      setNewStatusColor('#6B7280');
      setIsCreateStatusOpen(false);
    } catch (error: unknown) {
      // Error already handled by the hook - logging for debugging
      console.debug('Status creation error (handled by hook):', error);
    }
  };

  // Set a status as the initial status (only one can be initial)
  const handleSetInitialStatus = (stepId: string) => {
    // First, unset all other initial statuses
    workflow?.steps.forEach(step => {
      if (step.is_initial && step.id !== stepId) {
        updateStep.mutate({
          id: step.id,
          data: { is_initial: false }
        });
      }
    });
    
    // Then set the selected one as initial
    updateStep.mutate({
      id: stepId,
      data: { is_initial: true }
    });
    
    toast.success('Initial status updated');
  };

  // Save workflow properties
  const handleSaveWorkflowProperties = () => {
    if (!editName.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    
    updateWorkflow.mutate({
      id: workflowId,
      data: {
        name: editName.trim(),
        description: editDescription.trim() || null
      }
    });
    
    setIsEditDialogOpen(false);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'done': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'done': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get step position (local or from DB)
  const getStepPosition = (step: WorkflowStepRow) => {
    return localPositions[step.id] || { x: step.position_x, y: step.position_y };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-96 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Workflow not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <CardTitle>{workflow.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {workflow.description || 'No description'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditDialogOpen(true)}
            title="Edit workflow properties"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsCreateStatusOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Status
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={!availableStatuses?.length}>
                <Plus className="h-4 w-4 mr-2" />
                Add Existing Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableStatuses?.map(status => (
                <DropdownMenuItem 
                  key={status.id}
                  onClick={() => handleAddStatus(status.id)}
                >
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: status.color || '#6B7280' }}
                  />
                  {status.name}
                </DropdownMenuItem>
              ))}
              {!availableStatuses?.length && (
                <DropdownMenuItem disabled>
                  All statuses are already in workflow
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={canvasRef}
          className="relative bg-muted/30 rounded-lg border border-border overflow-hidden"
          style={{ height: 500, minWidth: 900 }}
          onClick={handleCanvasClick}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path 
                  d="M 20 0 L 0 0 0 20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                  className="text-border"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Transitions (arrows) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {workflow.transitions.map(transition => {
              const fromStep = workflow.steps.find(s => s.id === transition.from_step_id);
              const toStep = workflow.steps.find(s => s.id === transition.to_step_id);
              if (!fromStep || !toStep) return null;

              const fromPos = getStepPosition(fromStep);
              const toPos = getStepPosition(toStep);

              const startX = fromPos.x + 160;
              const startY = fromPos.y + 35;
              const endX = toPos.x;
              const endY = toPos.y + 35;

              const midX = (startX + endX) / 2;

              return (
                <g key={transition.id}>
                  <path
                    d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle
                    cx={midX}
                    cy={(startY + endY) / 2}
                    r="8"
                    fill="hsl(var(--destructive))"
                    className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTransition.mutate({ 
                        id: transition.id, 
                        workflowId 
                      });
                    }}
                  />
                </g>
              );
            })}
            
            {/* Arrow connection in progress */}
            {connectionState && (
              <path
                d={`M ${connectionState.fromX} ${connectionState.fromY} L ${mousePos.x} ${mousePos.y}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="hsl(var(--primary))"
                />
              </marker>
            </defs>
          </svg>

          {/* Status nodes */}
          {workflow.steps.map(step => {
            const pos = getStepPosition(step);
            const isDragging = dragState?.stepId === step.id;
            
            return (
              <ContextMenu key={step.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "absolute select-none",
                      "w-40 rounded-lg border-2 shadow-lg",
                      getCategoryColor(step.status?.category),
                      connectionState && connectionState.fromStepId !== step.id && "ring-2 ring-primary ring-offset-2",
                      step.is_initial && "ring-2 ring-yellow-500",
                      isDragging ? "cursor-grabbing z-50" : "cursor-grab"
                    )}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                      transition: isDragging ? 'transform 0.1s' : 'transform 0.1s, left 0.05s, top 0.05s',
                    }}
                    onMouseDown={(e) => handleStepMouseDown(step, e)}
                    onClick={() => handleStepClick(step)}
                  >
                    <div className="flex items-center gap-2 p-3">
                      <GripVertical className="h-4 w-4 opacity-50 cursor-grab" />
                      {getCategoryIcon(step.status?.category)}
                      <span className="font-medium text-sm truncate flex-1">
                        {step.status?.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between px-3 pb-2 gap-1">
                      {step.is_initial && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Initial
                        </Badge>
                      )}
                      <div className="flex gap-1 ml-auto">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => handleStartConnection(step, e)}
                          title="Create transition"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                              title="More options"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInitialStatus(step.id);
                              }}
                              disabled={step.is_initial}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Initial Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep.mutate({ id: step.id, workflowId });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => handleSetInitialStatus(step.id)}
                    disabled={step.is_initial}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Initial Status
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleStartConnection(step, {} as React.MouseEvent)}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Transition
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteStep.mutate({ id: step.id, workflowId })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Status
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {/* Instructions overlay */}
          {workflow.steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">No statuses in workflow</p>
                <p className="text-sm">Click "Add Existing Status" or "Create Status" to add statuses</p>
              </div>
            </div>
          )}

          {connectionState && (
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border rounded-lg px-4 py-2 text-sm">
              <span className="text-muted-foreground">Click on a status to create a transition, or click anywhere to cancel</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-yellow-500" />
            <span>Initial Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-400" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span>Done</span>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Edit Workflow Properties Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workflow Properties</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Workflow name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe this workflow..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveWorkflowProperties}
              disabled={!editName.trim() || updateWorkflow.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Status Dialog */}
    <Dialog open={isCreateStatusOpen} onOpenChange={setIsCreateStatusOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="status-name">Name</Label>
            <Input
              id="status-name"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="e.g., In Review, Testing, Blocked"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="status-color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="h-10 w-20 rounded border border-input cursor-pointer"
              />
              <Input
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateStatusOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStatus}
              disabled={!newStatusName.trim() || createStatus.isPending}
            >
              Create & Add to Workflow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
