// Guided Operations types

export type StepType = 'form' | 'approval' | 'confirmation' | 'action';

export interface OperationStep {
  id: string;
  name: string;
  type: StepType;
  fields?: FormField[];
  approvers?: string[];
  condition?: StepCondition;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: string[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface GuidedOperation {
  id: string;
  name: string;
  description?: string;
  category: 'bulk' | 'approval' | 'workflow';
  steps: OperationStep[];
  created_at: string;
}
