import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useWorkflowWithDetails, 
  useUpdateWorkflowStep, 
  useAddWorkflowStep,
  useDeleteWorkflowStep,
  useAddWorkflowTransition,
  useDeleteWorkflowTransition
} from '../hooks/useWorkflows';
import { useStatuses } from '@/features/issues/hooks/useIssues';
import { WorkflowStepRow, WorkflowTransitionRow } from '../services/workflowService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  GripVertical,
  Circle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WorkflowDesignerProps {
  workflowId: string;
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

export function WorkflowDesigner({ workflowId }: WorkflowDesignerProps) {
  const { data: workflow, isLoading } = useWorkflowWithDetails(workflowId);
  const { data: allStatuses } = useStatuses();
  const updateStep = useUpdateWorkflowStep();
  const addStep = useAddWorkflowStep();
  const deleteStep = useDeleteWorkflowStep();
  const addTransition = useAddWorkflowTransition();
  const deleteTransition = useDeleteWorkflowTransition();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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
      
      updateStep.mutate({
        id: dragState.stepId,
        data: { position_x: newX, position_y: newY }
      });
    }
  }, [dragState, updateStep]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState || connectionState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, connectionState, handleMouseMove, handleMouseUp]);

  const handleStepMouseDown = (step: WorkflowStepRow, e: React.MouseEvent) => {
    e.preventDefault();
    setDragState({
      stepId: step.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: step.position_x,
      initialY: step.position_y,
    });
  };

  const handleStartConnection = (step: WorkflowStepRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionState({
      fromStepId: step.id,
      fromX: step.position_x + 80,
      fromY: step.position_y + 30,
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
    const maxX = Math.max(100, ...existingSteps.map(s => s.position_x)) + 150;
    
    addStep.mutate({
      workflow_id: workflowId,
      status_id: statusId,
      position_x: maxX,
      position_y: 200,
    });
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{workflow.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={!availableStatuses?.length}>
              <Plus className="h-4 w-4 mr-2" />
              Add Status
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
          </DropdownMenuContent>
        </DropdownMenu>
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

              const startX = fromStep.position_x + 160;
              const startY = fromStep.position_y + 35;
              const endX = toStep.position_x;
              const endY = toStep.position_y + 35;

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
          {workflow.steps.map(step => (
            <div
              key={step.id}
              className={cn(
                "absolute cursor-move select-none",
                "w-40 rounded-lg border-2 shadow-lg",
                getCategoryColor(step.status?.category),
                connectionState && connectionState.fromStepId !== step.id && "ring-2 ring-primary ring-offset-2",
                step.is_initial && "ring-2 ring-yellow-500"
              )}
              style={{
                left: step.position_x,
                top: step.position_y,
                transform: dragState?.stepId === step.id ? 'scale(1.05)' : 'scale(1)',
                transition: dragState?.stepId === step.id ? 'none' : 'transform 0.1s',
              }}
              onMouseDown={(e) => handleStepMouseDown(step, e)}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-center gap-2 p-3">
                <GripVertical className="h-4 w-4 opacity-50" />
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStep.mutate({ id: step.id, workflowId });
                    }}
                    title="Remove status"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Instructions overlay */}
          {workflow.steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">No statuses in workflow</p>
                <p className="text-sm">Click "Add Status" to add statuses to this workflow</p>
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
  );
}
