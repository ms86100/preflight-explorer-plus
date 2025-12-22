// Guided Operations types

export type StepType = 'form' | 'approval' | 'confirmation' | 'action';

export interface OperationStep {
  id: string;
  name: string;
  type: StepType;
  title?: string;
  description?: string;
  fields?: FormField[];
  approvers?: string[];
  condition?: StepCondition;
  actionType?: string;
  actionConfig?: Record<string, unknown>;
}

export interface FormField {
  id?: string;
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface GuidedOperation {
  id: string;
  name: string;
  description?: string;
  category: string;
  steps: OperationStep[];
  is_active?: boolean;
  requires_approval?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface OperationExecution {
  id: string;
  operation_id: string;
  operation_name?: string;
  status: 'in_progress' | 'completed' | 'cancelled' | 'failed';
  current_step: number;
  step_data: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  result?: Record<string, unknown>;
}
