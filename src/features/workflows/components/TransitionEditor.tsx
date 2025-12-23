import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Shield, CheckSquare, Zap } from 'lucide-react';
import { useUpdateWorkflowTransition } from '../hooks/useWorkflows';
import {
  WorkflowTransitionRow,
  TransitionCondition,
  TransitionValidator,
  TransitionPostFunction,
} from '../services/workflowService';


interface TransitionEditorProps {
  readonly transition: WorkflowTransitionRow | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly workflowId: string;
}

// Condition type options
const CONDITION_TYPES = [
  { value: 'only_assignee', label: 'Only Assignee', description: 'Only the current assignee can perform this transition' },
  { value: 'only_reporter', label: 'Only Reporter', description: 'Only the issue reporter can perform this transition' },
  { value: 'user_in_group', label: 'User in Group', description: 'User must be a member of a specific group' },
  { value: 'user_in_role', label: 'User in Project Role', description: 'User must have a specific project role' },
  { value: 'permission_check', label: 'Permission Check', description: 'User must have a specific permission' },
] as const;

// Validator type options
const VALIDATOR_TYPES = [
  { value: 'field_required', label: 'Field Required', description: 'A specific field must have a value' },
  { value: 'field_not_empty', label: 'Field Not Empty', description: 'A specific field must not be empty' },
  { value: 'subtasks_closed', label: 'Subtasks Closed', description: 'All subtasks must be in a closed status' },
  { value: 'resolution_set', label: 'Resolution Set', description: 'A resolution must be selected' },
  { value: 'custom_field_value', label: 'Custom Field Value', description: 'A custom field must have a specific value' },
] as const;

// Post-function type options
const POST_FUNCTION_TYPES = [
  { value: 'set_field', label: 'Set Field Value', description: 'Set a field to a specific value' },
  { value: 'clear_field', label: 'Clear Field', description: 'Clear the value of a field' },
  { value: 'assign_to_lead', label: 'Assign to Lead', description: 'Assign the issue to the project lead' },
  { value: 'assign_to_reporter', label: 'Assign to Reporter', description: 'Assign the issue to the reporter' },
  { value: 'add_comment', label: 'Add Comment', description: 'Add an automatic comment' },
  { value: 'send_notification', label: 'Send Notification', description: 'Send a notification to users' },
] as const;

export function TransitionEditor({ transition, open, onOpenChange, workflowId }: TransitionEditorProps) {
  const updateTransition = useUpdateWorkflowTransition();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<TransitionCondition[]>([]);
  const [validators, setValidators] = useState<TransitionValidator[]>([]);
  const [postFunctions, setPostFunctions] = useState<TransitionPostFunction[]>([]);
  
  // Initialize form when transition changes
  useEffect(() => {
    if (transition) {
      setName(transition.name);
      setDescription(transition.description || '');
      setConditions(transition.conditions || []);
      setValidators(transition.validators || []);
      setPostFunctions(transition.post_functions || []);
    }
  }, [transition]);
  
  const handleSave = () => {
    if (!transition) return;
    
    updateTransition.mutate({
      id: transition.id,
      data: {
        name,
        description: description || undefined,
        conditions,
        validators,
        post_functions: postFunctions,
      }
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };
  
  // Condition handlers
  const addCondition = () => {
    setConditions([...conditions, { type: 'only_assignee' }]);
  };
  
  const updateCondition = (index: number, updates: Partial<TransitionCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };
  
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };
  
  // Validator handlers
  const addValidator = () => {
    setValidators([...validators, { type: 'field_required' }]);
  };
  
  const updateValidator = (index: number, updates: Partial<TransitionValidator>) => {
    const newValidators = [...validators];
    newValidators[index] = { ...newValidators[index], ...updates };
    setValidators(newValidators);
  };
  
  const removeValidator = (index: number) => {
    setValidators(validators.filter((_, i) => i !== index));
  };
  
  // Post-function handlers
  const addPostFunction = () => {
    setPostFunctions([...postFunctions, { type: 'set_field' }]);
  };
  
  const updatePostFunction = (index: number, updates: Partial<TransitionPostFunction>) => {
    const newPostFunctions = [...postFunctions];
    newPostFunctions[index] = { ...newPostFunctions[index], ...updates };
    setPostFunctions(newPostFunctions);
  };
  
  const removePostFunction = (index: number) => {
    setPostFunctions(postFunctions.filter((_, i) => i !== index));
  };
  
  if (!transition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transition: {transition.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transition-name">Name</Label>
              <Input
                id="transition-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Transition name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transition-description">Description</Label>
              <Input
                id="transition-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          
          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conditions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Conditions
                {conditions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{conditions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="validators" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Validators
                {validators.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{validators.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="postfunctions" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Post Functions
                {postFunctions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{postFunctions.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Conditions determine who can perform this transition.
                </p>
                <Button size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              
              {conditions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No conditions configured. Anyone can perform this transition.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <Select
                              value={condition.type}
                              onValueChange={(value) => updateCondition(index, { type: value as TransitionCondition['type'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div>
                                      <div>{type.label}</div>
                                      <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Show additional fields based on condition type */}
                            {condition.type === 'user_in_group' && (
                              <Input
                                placeholder="Group name"
                                value={condition.group || ''}
                                onChange={(e) => updateCondition(index, { group: e.target.value })}
                              />
                            )}
                            {condition.type === 'user_in_role' && (
                              <Input
                                placeholder="Role name (e.g., Developers, Administrators)"
                                value={condition.role || ''}
                                onChange={(e) => updateCondition(index, { role: e.target.value })}
                              />
                            )}
                            {condition.type === 'permission_check' && (
                              <Input
                                placeholder="Permission key"
                                value={condition.permission || ''}
                                onChange={(e) => updateCondition(index, { permission: e.target.value })}
                              />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Validators Tab */}
            <TabsContent value="validators" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Validators check that conditions are met before the transition.
                </p>
                <Button size="sm" onClick={addValidator}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Validator
                </Button>
              </div>
              
              {validators.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No validators configured. No validation will be performed.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {validators.map((validator, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <Select
                              value={validator.type}
                              onValueChange={(value) => updateValidator(index, { type: value as TransitionValidator['type'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VALIDATOR_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div>
                                      <div>{type.label}</div>
                                      <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Show additional fields based on validator type */}
                            {(validator.type === 'field_required' || validator.type === 'field_not_empty') && (
                              <Input
                                placeholder="Field name (e.g., description, due_date)"
                                value={validator.field || ''}
                                onChange={(e) => updateValidator(index, { field: e.target.value })}
                              />
                            )}
                            {validator.type === 'custom_field_value' && (
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Field name"
                                  value={validator.field || ''}
                                  onChange={(e) => updateValidator(index, { field: e.target.value })}
                                />
                                <Input
                                  placeholder="Expected value"
                                  value={validator.value || ''}
                                  onChange={(e) => updateValidator(index, { value: e.target.value })}
                                />
                              </div>
                            )}
                            <Input
                              placeholder="Error message (optional)"
                              value={validator.message || ''}
                              onChange={(e) => updateValidator(index, { message: e.target.value })}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeValidator(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Post Functions Tab */}
            <TabsContent value="postfunctions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Post functions are executed after the transition completes.
                </p>
                <Button size="sm" onClick={addPostFunction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Post Function
                </Button>
              </div>
              
              {postFunctions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No post functions configured. No automatic actions will be performed.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {postFunctions.map((pf, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <Select
                              value={pf.type}
                              onValueChange={(value) => updatePostFunction(index, { type: value as TransitionPostFunction['type'] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {POST_FUNCTION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div>
                                      <div>{type.label}</div>
                                      <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Show additional fields based on post function type */}
                            {(pf.type === 'set_field' || pf.type === 'clear_field') && (
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Field name"
                                  value={pf.field || ''}
                                  onChange={(e) => updatePostFunction(index, { field: e.target.value })}
                                />
                                {pf.type === 'set_field' && (
                                  <Input
                                    placeholder="Value"
                                    value={pf.value || ''}
                                    onChange={(e) => updatePostFunction(index, { value: e.target.value })}
                                  />
                                )}
                              </div>
                            )}
                            {pf.type === 'add_comment' && (
                              <Textarea
                                placeholder="Comment text"
                                value={pf.comment || ''}
                                onChange={(e) => updatePostFunction(index, { comment: e.target.value })}
                                rows={2}
                              />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removePostFunction(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateTransition.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
