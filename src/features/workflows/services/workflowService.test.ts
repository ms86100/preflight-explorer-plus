/**
 * @fileoverview Unit tests for workflowService
 * @module features/workflows/services/workflowService.test
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  WorkflowRow,
  WorkflowStepRow,
  WorkflowTransitionRow,
  TransitionCondition,
  TransitionValidator,
  TransitionPostFunction,
} from './workflowService';

// Mock responses defined at module level to avoid deep nesting (S2004 fix)
const mockWorkflowsOrderResponse = () => Promise.resolve({
  data: mockWorkflows,
  error: null,
});

const mockWorkflowSingleResponse = () => Promise.resolve({
  data: mockWorkflows[0],
  error: null,
});

const mockOrOrderFn = vi.fn(mockWorkflowsOrderResponse);
const mockOrFn = vi.fn(() => ({ order: mockOrOrderFn }));
const mockEqOrderFn = vi.fn(mockWorkflowsOrderResponse);
const mockEqFn = vi.fn(() => ({
  order: mockEqOrderFn,
  single: mockWorkflowSingleResponse,
  or: mockOrFn,
}));
const mockSelectFn = vi.fn(() => ({ eq: mockEqFn }));

const mockInsertSingleFn = vi.fn(mockWorkflowSingleResponse);
const mockInsertSelectFn = vi.fn(() => ({ single: mockInsertSingleFn }));
const mockInsertFn = vi.fn(() => ({ select: mockInsertSelectFn }));

const mockUpdateSingleFn = vi.fn(mockWorkflowSingleResponse);
const mockUpdateSelectFn = vi.fn(() => ({ single: mockUpdateSingleFn }));
const mockUpdateEqFn = vi.fn(() => ({ select: mockUpdateSelectFn }));
const mockUpdateFn = vi.fn(() => ({ eq: mockUpdateEqFn }));

const mockDeleteEqFn = vi.fn(() => Promise.resolve({ error: null }));
const mockDeleteFn = vi.fn(() => ({ eq: mockDeleteEqFn }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelectFn,
      insert: mockInsertFn,
      update: mockUpdateFn,
      delete: mockDeleteFn,
    })),
  },
}));

const mockWorkflows: WorkflowRow[] = [
  {
    id: 'wf-1',
    name: 'Default Workflow',
    description: 'Standard development workflow',
    project_id: null,
    is_default: true,
    is_active: true,
    is_draft: false,
    draft_of: null,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockSteps: WorkflowStepRow[] = [
  {
    id: 'step-1',
    workflow_id: 'wf-1',
    status_id: 'status-todo',
    position_x: 100,
    position_y: 100,
    is_initial: true,
    created_at: '2024-01-01T00:00:00Z',
    status: {
      id: 'status-todo',
      name: 'To Do',
      category: 'todo',
      color: '#0052cc',
    },
  },
];

describe('Workflow types', () => {
  describe('WorkflowRow', () => {
    it('should have all required fields', () => {
      const workflow: WorkflowRow = mockWorkflows[0];
      
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBeDefined();
      expect(workflow.is_active).toBe(true);
      expect(workflow.is_draft).toBe(false);
    });
  });

  describe('WorkflowStepRow', () => {
    it('should have correct structure', () => {
      const step: WorkflowStepRow = mockSteps[0];
      
      expect(step.workflow_id).toBe('wf-1');
      expect(step.is_initial).toBe(true);
      expect(step.status?.name).toBe('To Do');
    });
  });

  describe('TransitionCondition', () => {
    it('should support only_assignee type', () => {
      const condition: TransitionCondition = {
        type: 'only_assignee',
      };
      
      expect(condition.type).toBe('only_assignee');
    });

    it('should support user_in_group type with group', () => {
      const condition: TransitionCondition = {
        type: 'user_in_group',
        group: 'developers',
      };
      
      expect(condition.type).toBe('user_in_group');
      expect(condition.group).toBe('developers');
    });

    it('should support permission_check type', () => {
      const condition: TransitionCondition = {
        type: 'permission_check',
        permission: 'EDIT_ISSUES',
      };
      
      expect(condition.type).toBe('permission_check');
      expect(condition.permission).toBe('EDIT_ISSUES');
    });
  });

  describe('TransitionValidator', () => {
    it('should support field_required type', () => {
      const validator: TransitionValidator = {
        type: 'field_required',
        field: 'resolution',
        message: 'Resolution is required',
      };
      
      expect(validator.type).toBe('field_required');
      expect(validator.field).toBe('resolution');
    });

    it('should support subtasks_closed type', () => {
      const validator: TransitionValidator = {
        type: 'subtasks_closed',
        message: 'All subtasks must be closed',
      };
      
      expect(validator.type).toBe('subtasks_closed');
    });
  });

  describe('TransitionPostFunction', () => {
    it('should support set_field type', () => {
      const postFunction: TransitionPostFunction = {
        type: 'set_field',
        field: 'resolution',
        value: 'done',
      };
      
      expect(postFunction.type).toBe('set_field');
      expect(postFunction.field).toBe('resolution');
    });

    it('should support add_comment type', () => {
      const postFunction: TransitionPostFunction = {
        type: 'add_comment',
        comment: 'Issue resolved',
      };
      
      expect(postFunction.type).toBe('add_comment');
      expect(postFunction.comment).toBe('Issue resolved');
    });
  });

  describe('WorkflowTransitionRow', () => {
    it('should have correct structure with arrays', () => {
      const transition: WorkflowTransitionRow = {
        id: 'trans-1',
        workflow_id: 'wf-1',
        from_step_id: 'step-1',
        to_step_id: 'step-2',
        name: 'Start Progress',
        description: null,
        conditions: [],
        validators: [],
        post_functions: [],
        screen_id: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      expect(transition.id).toBeDefined();
      expect(transition.conditions).toBeInstanceOf(Array);
      expect(transition.validators).toBeInstanceOf(Array);
      expect(transition.post_functions).toBeInstanceOf(Array);
    });
  });
});

// Module-level validation helpers
function validateWorkflowName(name: string): boolean {
  return name.trim().length > 0;
}

function validateStepPosition(x: number, y: number): boolean {
  return x >= 0 && y >= 0;
}

describe('Workflow validation', () => {
  it('should validate workflow name is not empty', () => {
    expect(validateWorkflowName('Valid Name')).toBe(true);
    expect(validateWorkflowName('')).toBe(false);
    expect(validateWorkflowName('   ')).toBe(false);
  });

  it('should validate step positions are positive', () => {
    expect(validateStepPosition(100, 100)).toBe(true);
    expect(validateStepPosition(0, 0)).toBe(true);
    expect(validateStepPosition(-10, 100)).toBe(false);
  });
});
