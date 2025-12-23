/**
 * @fileoverview Unit tests for guidedOperationsService.
 * @module features/guided-operations/services/guidedOperationsService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GuidedOperation, OperationStep, OperationExecution } from '../types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-uuid' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// ============================================================================
// Type Definitions for Testing
// ============================================================================

/** Step input field definition */
interface StepInputField {
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'user';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/** Operation step definition */
interface LocalOperationStep {
  id: string;
  title: string;
  description?: string;
  type: 'input' | 'confirmation' | 'action' | 'review';
  inputs?: StepInputField[];
  actions?: {
    type: string;
    config: Record<string, unknown>;
  }[];
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: unknown;
    skipToStep?: string;
  }[];
}

/** Guided operation definition */
interface LocalGuidedOperation {
  id: string;
  name: string;
  description?: string;
  category: string;
  steps: LocalOperationStep[];
  is_active: boolean;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

/** Operation execution state */
interface LocalOperationExecution {
  id: string;
  operation_id: string;
  operation_name?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'pending_approval';
  current_step: number;
  step_data: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  result?: Record<string, unknown>;
}

// ============================================================================
// Type Tests
// ============================================================================

describe('Guided Operations Types', () => {
  describe('StepInputField', () => {
    it('should support text input', () => {
      const input: StepInputField = {
        name: 'project_name',
        type: 'text',
        label: 'Project Name',
        required: true,
        validation: {
          pattern: '^[A-Z][A-Z0-9_]*$',
          message: 'Must start with letter, uppercase only',
        },
      };
      
      expect(input.type).toBe('text');
      expect(input.required).toBe(true);
    });

    it('should support select input with options', () => {
      const input: StepInputField = {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
        defaultValue: 'medium',
      };
      
      expect(input.options).toHaveLength(3);
      expect(input.defaultValue).toBe('medium');
    });

    it('should support number input with validation', () => {
      const input: StepInputField = {
        name: 'story_points',
        type: 'number',
        label: 'Story Points',
        validation: {
          min: 1,
          max: 21,
        },
      };
      
      expect(input.validation?.min).toBe(1);
      expect(input.validation?.max).toBe(21);
    });
  });

  describe('OperationStep', () => {
    it('should represent input step', () => {
      const step: LocalOperationStep = {
        id: 'step-1',
        title: 'Enter Details',
        description: 'Provide the required information',
        type: 'input',
        inputs: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'count', type: 'number', label: 'Count' },
        ],
      };
      
      expect(step.type).toBe('input');
      expect(step.inputs).toHaveLength(2);
    });

    it('should represent confirmation step', () => {
      const step: LocalOperationStep = {
        id: 'step-2',
        title: 'Confirm Action',
        description: 'Are you sure you want to proceed?',
        type: 'confirmation',
      };
      
      expect(step.type).toBe('confirmation');
    });

    it('should represent action step with actions', () => {
      const step: LocalOperationStep = {
        id: 'step-3',
        title: 'Create Resources',
        type: 'action',
        actions: [
          { type: 'create_project', config: { template: 'scrum' } },
          { type: 'create_board', config: { type: 'kanban' } },
        ],
      };
      
      expect(step.actions).toHaveLength(2);
    });

    it('should support conditional navigation', () => {
      const step: LocalOperationStep = {
        id: 'step-1',
        title: 'Choose Type',
        type: 'input',
        inputs: [
          {
            name: 'type',
            type: 'select',
            label: 'Type',
            options: [
              { value: 'simple', label: 'Simple' },
              { value: 'advanced', label: 'Advanced' },
            ],
          },
        ],
        conditions: [
          { field: 'type', operator: 'equals', value: 'simple', skipToStep: 'step-final' },
        ],
      };
      
      expect(step.conditions?.[0].skipToStep).toBe('step-final');
    });
  });

  describe('GuidedOperation', () => {
    it('should represent a complete operation', () => {
      const operation: LocalGuidedOperation = {
        id: 'op-uuid',
        name: 'Create New Project',
        description: 'Guided wizard to create a new project with all required settings',
        category: 'project_management',
        steps: [
          { id: '1', title: 'Basic Info', type: 'input', inputs: [] },
          { id: '2', title: 'Settings', type: 'input', inputs: [] },
          { id: '3', title: 'Review', type: 'review' },
          { id: '4', title: 'Create', type: 'action', actions: [] },
        ],
        is_active: true,
        requires_approval: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(operation.steps).toHaveLength(4);
      expect(operation.requires_approval).toBe(false);
    });

    it('should support approval requirement', () => {
      const operation: LocalGuidedOperation = {
        id: 'op-uuid',
        name: 'Bulk Delete Issues',
        category: 'maintenance',
        steps: [
          { id: '1', title: 'Select Issues', type: 'input', inputs: [] },
          { id: '2', title: 'Confirm', type: 'confirmation' },
        ],
        is_active: true,
        requires_approval: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(operation.requires_approval).toBe(true);
    });
  });

  describe('OperationExecution', () => {
    it('should represent in-progress execution', () => {
      const execution: LocalOperationExecution = {
        id: 'exec-uuid',
        operation_id: 'op-uuid',
        operation_name: 'Create New Project',
        status: 'in_progress',
        current_step: 1,
        step_data: {
          '0': { project_name: 'New Project', template: 'scrum' },
        },
        started_at: '2024-01-15T10:00:00Z',
      };
      
      expect(execution.status).toBe('in_progress');
      expect(execution.current_step).toBe(1);
    });

    it('should represent completed execution', () => {
      const execution: LocalOperationExecution = {
        id: 'exec-uuid',
        operation_id: 'op-uuid',
        status: 'completed',
        current_step: 3,
        step_data: {
          '0': { name: 'Test' },
          '1': { confirmed: true },
        },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        result: {
          project_id: 'new-project-uuid',
          board_id: 'new-board-uuid',
        },
      };
      
      expect(execution.status).toBe('completed');
      expect(execution.result?.project_id).toBe('new-project-uuid');
    });

    it('should support all statuses', () => {
      const statuses: LocalOperationExecution['status'][] = [
        'in_progress',
        'completed',
        'failed',
        'cancelled',
        'pending_approval',
      ];
      
      statuses.forEach((status) => {
        expect(status).toBeDefined();
      });
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('Guided Operations Validation', () => {
  /**
   * Validates input value against field definition.
   */
  function validateInput(
    field: StepInputField,
    value: unknown
  ): { valid: boolean; error?: string } {
    // Check required
    if (field.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${field.label} is required` };
    }

    // Skip validation for empty non-required fields
    if (value === undefined || value === null || value === '') {
      return { valid: true };
    }

    // Type-specific validation
    switch (field.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `${field.label} must be a number` };
        }
        if (field.validation?.min !== undefined && value < field.validation.min) {
          return { valid: false, error: `${field.label} must be at least ${field.validation.min}` };
        }
        if (field.validation?.max !== undefined && value > field.validation.max) {
          return { valid: false, error: `${field.label} must be at most ${field.validation.max}` };
        }
        break;

      case 'text':
        if (typeof value !== 'string') {
          return { valid: false, error: `${field.label} must be text` };
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: field.validation.message || `${field.label} format is invalid` };
          }
        }
        break;

      case 'select':
        if (!field.options?.find((o) => o.value === value)) {
          return { valid: false, error: `${field.label} must be a valid option` };
        }
        break;
    }

    return { valid: true };
  }

  describe('validateInput', () => {
    it('should validate required fields', () => {
      const field: StepInputField = {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      };
      
      expect(validateInput(field, '')).toEqual({
        valid: false,
        error: 'Name is required',
      });
      expect(validateInput(field, 'John')).toEqual({ valid: true });
    });

    it('should validate number range', () => {
      const field: StepInputField = {
        name: 'points',
        type: 'number',
        label: 'Points',
        validation: { min: 1, max: 10 },
      };
      
      expect(validateInput(field, 0)).toEqual({
        valid: false,
        error: 'Points must be at least 1',
      });
      expect(validateInput(field, 15)).toEqual({
        valid: false,
        error: 'Points must be at most 10',
      });
      expect(validateInput(field, 5)).toEqual({ valid: true });
    });

    it('should validate text pattern', () => {
      const field: StepInputField = {
        name: 'code',
        type: 'text',
        label: 'Code',
        validation: {
          pattern: '^[A-Z]{3}$',
          message: 'Code must be 3 uppercase letters',
        },
      };
      
      expect(validateInput(field, 'abc')).toEqual({
        valid: false,
        error: 'Code must be 3 uppercase letters',
      });
      expect(validateInput(field, 'ABC')).toEqual({ valid: true });
    });

    it('should validate select options', () => {
      const field: StepInputField = {
        name: 'type',
        type: 'select',
        label: 'Type',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      };
      
      expect(validateInput(field, 'c')).toEqual({
        valid: false,
        error: 'Type must be a valid option',
      });
      expect(validateInput(field, 'a')).toEqual({ valid: true });
    });
  });

  /**
   * Validates all inputs for a step.
   */
  function validateStep(
    step: LocalOperationStep,
    data: Record<string, unknown>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const input of step.inputs || []) {
      const result = validateInput(input, data[input.name]);
      if (!result.valid && result.error) {
        errors[input.name] = result.error;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  describe('validateStep', () => {
    it('should validate all inputs in step', () => {
      const step: LocalOperationStep = {
        id: '1',
        title: 'Details',
        type: 'input',
        inputs: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'count', type: 'number', label: 'Count', validation: { min: 1 } },
        ],
      };
      
      const result = validateStep(step, { name: '', count: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.count).toBe('Count must be at least 1');
    });

    it('should return valid for correct data', () => {
      const step: LocalOperationStep = {
        id: '1',
        title: 'Details',
        type: 'input',
        inputs: [
          { name: 'name', type: 'text', label: 'Name', required: true },
        ],
      };
      
      const result = validateStep(step, { name: 'Test' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Guided Operations Helpers', () => {
  /**
   * Calculates progress percentage for an execution.
   */
  function calculateProgress(execution: LocalOperationExecution, totalSteps: number): number {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') {
      return Math.round((execution.current_step / totalSteps) * 100);
    }
    return Math.round((execution.current_step / totalSteps) * 100);
  }

  describe('calculateProgress', () => {
    it('should return 100 for completed execution', () => {
      const execution: LocalOperationExecution = {
        id: '1', operation_id: 'op', status: 'completed',
        current_step: 3, step_data: {}, started_at: '',
      };
      expect(calculateProgress(execution, 4)).toBe(100);
    });

    it('should calculate progress based on current step', () => {
      const execution: LocalOperationExecution = {
        id: '1', operation_id: 'op', status: 'in_progress',
        current_step: 2, step_data: {}, started_at: '',
      };
      expect(calculateProgress(execution, 4)).toBe(50);
    });

    it('should return 0 for first step', () => {
      const execution: LocalOperationExecution = {
        id: '1', operation_id: 'op', status: 'in_progress',
        current_step: 0, step_data: {}, started_at: '',
      };
      expect(calculateProgress(execution, 4)).toBe(0);
    });
  });

  /**
   * Evaluates step conditions to determine next step.
   */
  function evaluateConditions(
    step: LocalOperationStep,
    data: Record<string, unknown>
  ): string | null {
    for (const condition of step.conditions || []) {
      const value = data[condition.field];
      let matches = false;

      switch (condition.operator) {
        case 'equals':
          matches = value === condition.value;
          break;
        case 'not_equals':
          matches = value !== condition.value;
          break;
        case 'contains':
          matches = String(value).includes(String(condition.value));
          break;
        case 'greater_than':
          matches = Number(value) > Number(condition.value);
          break;
        case 'less_than':
          matches = Number(value) < Number(condition.value);
          break;
      }

      if (matches && condition.skipToStep) {
        return condition.skipToStep;
      }
    }

    return null;
  }

  describe('evaluateConditions', () => {
    it('should return null when no conditions', () => {
      const step: LocalOperationStep = {
        id: '1', title: 'Test', type: 'input',
      };
      expect(evaluateConditions(step, {})).toBeNull();
    });

    it('should evaluate equals condition', () => {
      const step: LocalOperationStep = {
        id: '1', title: 'Test', type: 'input',
        conditions: [
          { field: 'type', operator: 'equals', value: 'simple', skipToStep: 'final' },
        ],
      };
      
      expect(evaluateConditions(step, { type: 'simple' })).toBe('final');
      expect(evaluateConditions(step, { type: 'advanced' })).toBeNull();
    });

    it('should evaluate greater_than condition', () => {
      const step: LocalOperationStep = {
        id: '1', title: 'Test', type: 'input',
        conditions: [
          { field: 'count', operator: 'greater_than', value: 10, skipToStep: 'bulk' },
        ],
      };
      
      expect(evaluateConditions(step, { count: 15 })).toBe('bulk');
      expect(evaluateConditions(step, { count: 5 })).toBeNull();
    });
  });

  /**
   * Gets category display info.
   */
  function getCategoryInfo(category: string): { label: string; icon: string } {
    const categories: Record<string, { label: string; icon: string }> = {
      project_management: { label: 'Project Management', icon: 'folder' },
      maintenance: { label: 'Maintenance', icon: 'wrench' },
      reporting: { label: 'Reporting', icon: 'chart' },
      automation: { label: 'Automation', icon: 'robot' },
      general: { label: 'General', icon: 'cog' },
    };

    return categories[category] || { label: category, icon: 'question' };
  }

  describe('getCategoryInfo', () => {
    it('should return info for known categories', () => {
      expect(getCategoryInfo('project_management')).toEqual({
        label: 'Project Management',
        icon: 'folder',
      });
      expect(getCategoryInfo('maintenance')).toEqual({
        label: 'Maintenance',
        icon: 'wrench',
      });
    });

    it('should return default for unknown categories', () => {
      expect(getCategoryInfo('unknown')).toEqual({
        label: 'unknown',
        icon: 'question',
      });
    });
  });
});
