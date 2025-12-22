import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompare, ArrowRight, Plus, Minus, Equal } from 'lucide-react';
import { useWorkflows, useWorkflowWithDetails } from '../hooks/useWorkflows';
import { WorkflowStepRow, WorkflowTransitionRow } from '../services/workflowService';
import { cn } from '@/lib/utils';

interface WorkflowComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWorkflowId?: string;
}

interface ComparisonResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  label: string;
  details?: string;
}

export function WorkflowComparison({ open, onOpenChange, initialWorkflowId }: WorkflowComparisonProps) {
  const [leftWorkflowId, setLeftWorkflowId] = useState<string>(initialWorkflowId || '');
  const [rightWorkflowId, setRightWorkflowId] = useState<string>('');
  
  const { data: workflows } = useWorkflows();
  const { data: leftWorkflow } = useWorkflowWithDetails(leftWorkflowId);
  const { data: rightWorkflow } = useWorkflowWithDetails(rightWorkflowId);
  
  const compareSteps = (): ComparisonResult[] => {
    if (!leftWorkflow || !rightWorkflow) return [];
    
    const results: ComparisonResult[] = [];
    const leftStatuses = new Map(leftWorkflow.steps.map(s => [s.status_id, s]));
    const rightStatuses = new Map(rightWorkflow.steps.map(s => [s.status_id, s]));
    
    // Find added and unchanged
    rightWorkflow.steps.forEach(step => {
      const leftStep = leftStatuses.get(step.status_id);
      if (!leftStep) {
        results.push({
          type: 'added',
          label: step.status?.name || 'Unknown Status',
          details: step.is_initial ? '(Initial status)' : undefined,
        });
      } else {
        const isModified = leftStep.is_initial !== step.is_initial;
        results.push({
          type: isModified ? 'modified' : 'unchanged',
          label: step.status?.name || 'Unknown Status',
          details: isModified 
            ? `Initial: ${leftStep.is_initial} → ${step.is_initial}` 
            : undefined,
        });
      }
    });
    
    // Find removed
    leftWorkflow.steps.forEach(step => {
      if (!rightStatuses.has(step.status_id)) {
        results.push({
          type: 'removed',
          label: step.status?.name || 'Unknown Status',
        });
      }
    });
    
    return results.sort((a, b) => {
      const order = { removed: 0, modified: 1, added: 2, unchanged: 3 };
      return order[a.type] - order[b.type];
    });
  };
  
  const compareTransitions = (): ComparisonResult[] => {
    if (!leftWorkflow || !rightWorkflow) return [];
    
    const results: ComparisonResult[] = [];
    
    const getTransitionKey = (t: WorkflowTransitionRow, steps: WorkflowStepRow[]) => {
      const fromStep = steps.find(s => s.id === t.from_step_id);
      const toStep = steps.find(s => s.id === t.to_step_id);
      return `${fromStep?.status_id}→${toStep?.status_id}`;
    };
    
    const leftTransitions = new Map(
      leftWorkflow.transitions.map(t => [getTransitionKey(t, leftWorkflow.steps), t])
    );
    const rightTransitions = new Map(
      rightWorkflow.transitions.map(t => [getTransitionKey(t, rightWorkflow.steps), t])
    );
    
    // Find added and check for modifications
    rightWorkflow.transitions.forEach(t => {
      const key = getTransitionKey(t, rightWorkflow.steps);
      const leftT = leftTransitions.get(key);
      const fromStep = rightWorkflow.steps.find(s => s.id === t.from_step_id);
      const toStep = rightWorkflow.steps.find(s => s.id === t.to_step_id);
      const label = `${fromStep?.status?.name} → ${toStep?.status?.name}`;
      
      if (!leftT) {
        results.push({ type: 'added', label });
      } else {
        // Check for modifications
        const conditionsChanged = JSON.stringify(leftT.conditions) !== JSON.stringify(t.conditions);
        const validatorsChanged = JSON.stringify(leftT.validators) !== JSON.stringify(t.validators);
        const postFunctionsChanged = JSON.stringify(leftT.post_functions) !== JSON.stringify(t.post_functions);
        
        if (conditionsChanged || validatorsChanged || postFunctionsChanged) {
          const changes: string[] = [];
          if (conditionsChanged) changes.push('conditions');
          if (validatorsChanged) changes.push('validators');
          if (postFunctionsChanged) changes.push('post-functions');
          
          results.push({
            type: 'modified',
            label,
            details: `Changed: ${changes.join(', ')}`,
          });
        } else {
          results.push({ type: 'unchanged', label });
        }
      }
    });
    
    // Find removed
    leftWorkflow.transitions.forEach(t => {
      const key = getTransitionKey(t, leftWorkflow.steps);
      if (!rightTransitions.has(key)) {
        const fromStep = leftWorkflow.steps.find(s => s.id === t.from_step_id);
        const toStep = leftWorkflow.steps.find(s => s.id === t.to_step_id);
        results.push({
          type: 'removed',
          label: `${fromStep?.status?.name} → ${toStep?.status?.name}`,
        });
      }
    });
    
    return results.sort((a, b) => {
      const order = { removed: 0, modified: 1, added: 2, unchanged: 3 };
      return order[a.type] - order[b.type];
    });
  };
  
  const stepComparison = compareSteps();
  const transitionComparison = compareTransitions();
  
  const getIcon = (type: ComparisonResult['type']) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed': return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified': return <ArrowRight className="h-4 w-4 text-yellow-500" />;
      case 'unchanged': return <Equal className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getBadgeVariant = (type: ComparisonResult['type']) => {
    switch (type) {
      case 'added': return 'default';
      case 'removed': return 'destructive';
      case 'modified': return 'secondary';
      case 'unchanged': return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Workflows
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Workflow</label>
            <Select value={leftWorkflowId} onValueChange={setLeftWorkflowId}>
              <SelectTrigger>
                <SelectValue placeholder="Select workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflows?.map(w => (
                  <SelectItem key={w.id} value={w.id} disabled={w.id === rightWorkflowId}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare To</label>
            <Select value={rightWorkflowId} onValueChange={setRightWorkflowId}>
              <SelectTrigger>
                <SelectValue placeholder="Select workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflows?.map(w => (
                  <SelectItem key={w.id} value={w.id} disabled={w.id === leftWorkflowId}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {leftWorkflow && rightWorkflow ? (
          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-6">
              {/* Status Comparison */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Statuses</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {stepComparison.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No statuses to compare</p>
                  ) : (
                    <div className="space-y-2">
                      {stepComparison.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg",
                            item.type === 'added' && "bg-green-500/10",
                            item.type === 'removed' && "bg-red-500/10",
                            item.type === 'modified' && "bg-yellow-500/10",
                          )}
                        >
                          {getIcon(item.type)}
                          <span className="flex-1">{item.label}</span>
                          {item.details && (
                            <span className="text-xs text-muted-foreground">{item.details}</span>
                          )}
                          <Badge variant={getBadgeVariant(item.type)} className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Transition Comparison */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Transitions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {transitionComparison.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transitions to compare</p>
                  ) : (
                    <div className="space-y-2">
                      {transitionComparison.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg",
                            item.type === 'added' && "bg-green-500/10",
                            item.type === 'removed' && "bg-red-500/10",
                            item.type === 'modified' && "bg-yellow-500/10",
                          )}
                        >
                          {getIcon(item.type)}
                          <span className="flex-1">{item.label}</span>
                          {item.details && (
                            <span className="text-xs text-muted-foreground">{item.details}</span>
                          )}
                          <Badge variant={getBadgeVariant(item.type)} className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Summary */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {[...stepComparison, ...transitionComparison].filter(i => i.type === 'added').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Added</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">
                        {[...stepComparison, ...transitionComparison].filter(i => i.type === 'removed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Removed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {[...stepComparison, ...transitionComparison].filter(i => i.type === 'modified').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Modified</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-muted-foreground">
                        {[...stepComparison, ...transitionComparison].filter(i => i.type === 'unchanged').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Unchanged</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Select two workflows to compare
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
