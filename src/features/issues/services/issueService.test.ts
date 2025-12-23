/**
 * @fileoverview Unit tests for issueService
 * @module features/issues/services/issueService.test
 */

import { describe, it, expect, vi } from 'vitest';
import type { IssueInsert, IssueRow, IssueFilters, IssueWithRelations } from './issueService';

// Mock responses defined at module level to avoid deep nesting (S2004 fix)
const mockRangeResponse = () => Promise.resolve({
  data: mockIssues,
  error: null,
  count: mockIssues.length,
});

const mockMaybeSingleResponse = () => Promise.resolve({
  data: mockIssues[0],
  error: null,
});

const mockProfilesResponse = () => Promise.resolve({
  data: mockProfiles,
  error: null,
});

const mockOrderFn = vi.fn(() => ({ range: mockRangeResponse }));
const mockIlikeOrderFn = vi.fn(() => ({ range: mockRangeResponse }));
const mockIlikeFn = vi.fn(() => ({ order: mockIlikeOrderFn }));
const mockEqFn = vi.fn(() => ({
  order: mockOrderFn,
  maybeSingle: mockMaybeSingleResponse,
  ilike: mockIlikeFn,
  in: mockProfilesResponse,
}));
const mockSelectFn = vi.fn(() => ({ eq: mockEqFn }));

const mockInsertSingleFn = vi.fn(() => Promise.resolve({
  data: mockCreatedIssue,
  error: null,
}));
const mockInsertSelectFn = vi.fn(() => ({ single: mockInsertSingleFn }));
const mockInsertFn = vi.fn(() => ({ select: mockInsertSelectFn }));

const mockUpdateSingleFn = vi.fn(() => Promise.resolve({
  data: { ...mockIssues[0], summary: 'Updated Summary' },
  error: null,
}));
const mockUpdateSelectFn = vi.fn(() => ({ single: mockUpdateSingleFn }));
const mockUpdateEqFn = vi.fn(() => ({ select: mockUpdateSelectFn }));
const mockUpdateFn = vi.fn(() => ({ eq: mockUpdateEqFn }));

const mockDeleteEqFn = vi.fn(() => Promise.resolve({ error: null }));
const mockDeleteFn = vi.fn(() => ({ eq: mockDeleteEqFn }));

const mockSupabaseFrom = vi.fn(() => ({
  select: mockSelectFn,
  insert: mockInsertFn,
  update: mockUpdateFn,
  delete: mockDeleteFn,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockSupabaseFrom,
    rpc: vi.fn(() => Promise.resolve({
      data: mockProfiles,
      error: null,
    })),
  },
}));

const mockProfiles = [
  { id: 'user-1', display_name: 'John Doe', avatar_url: null },
  { id: 'user-2', display_name: 'Jane Smith', avatar_url: null },
];

const mockIssues: Partial<IssueWithRelations>[] = [
  {
    id: 'issue-1',
    project_id: 'proj-1',
    issue_key: 'DEMO-1',
    issue_number: 1,
    summary: 'First issue',
    description: 'Description',
    issue_type_id: 'type-1',
    status_id: 'status-1',
    priority_id: 'priority-1',
    reporter_id: 'user-1',
    assignee_id: 'user-2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockCreatedIssue: IssueRow = {
  id: 'issue-new',
  project_id: 'proj-1',
  issue_key: 'DEMO-2',
  issue_number: 2,
  summary: 'New issue',
  description: null,
  issue_type_id: 'type-1',
  status_id: 'status-1',
  priority_id: null,
  resolution_id: null,
  reporter_id: 'user-1',
  assignee_id: null,
  parent_id: null,
  epic_id: null,
  due_date: null,
  original_estimate: null,
  remaining_estimate: null,
  time_spent: null,
  story_points: null,
  environment: null,
  lexorank: null,
  classification: 'restricted',
  resolved_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('IssueInsert interface', () => {
  it('should accept valid issue data', () => {
    const validIssue: IssueInsert = {
      project_id: 'proj-1',
      summary: 'Test Issue',
      issue_type_id: 'type-1',
      status_id: 'status-1',
    };
    
    expect(validIssue.project_id).toBe('proj-1');
    expect(validIssue.summary).toBe('Test Issue');
  });

  it('should accept optional fields', () => {
    const fullIssue: IssueInsert = {
      project_id: 'proj-1',
      summary: 'Full Issue',
      description: 'A detailed description',
      issue_type_id: 'type-1',
      status_id: 'status-1',
      priority_id: 'priority-1',
      assignee_id: 'user-1',
      parent_id: 'parent-issue-1',
      epic_id: 'epic-1',
      due_date: '2024-12-31',
      story_points: 5,
      classification: 'confidential',
    };
    
    expect(fullIssue.description).toBe('A detailed description');
    expect(fullIssue.story_points).toBe(5);
    expect(fullIssue.classification).toBe('confidential');
  });
});

describe('IssueRow interface', () => {
  it('should have all required fields', () => {
    const issue: IssueRow = mockCreatedIssue;
    
    expect(issue.id).toBeDefined();
    expect(issue.project_id).toBeDefined();
    expect(issue.issue_key).toBeDefined();
    expect(issue.issue_number).toBeDefined();
    expect(issue.summary).toBeDefined();
    expect(issue.reporter_id).toBeDefined();
    expect(issue.created_at).toBeDefined();
  });
});

describe('IssueFilters interface', () => {
  it('should allow all filter combinations', () => {
    const filters: IssueFilters = {
      statusId: 'status-1',
      priorityId: 'priority-1',
      assigneeId: 'user-1',
      issueTypeId: 'type-1',
      search: 'bug',
    };
    
    expect(filters.statusId).toBe('status-1');
    expect(filters.search).toBe('bug');
  });

  it('should allow empty filters', () => {
    const emptyFilters: IssueFilters = {};
    
    expect(Object.keys(emptyFilters)).toHaveLength(0);
  });
});

// Helper functions moved to module scope (S7721/S2004 fix)
const validateSummary = (summary: string): boolean => {
  return summary.trim().length > 0;
};

const validateStoryPoints = (points: number | undefined): boolean => {
  if (points === undefined) return true;
  return points >= 0;
};

const validateIssueKey = (key: string): boolean => {
  return /^[A-Z][A-Z0-9]+-\d+$/.test(key);
};

const validateDueDate = (date: string | undefined): boolean => {
  if (!date) return true;
  const parsed = Date.parse(date);
  return !Number.isNaN(parsed);
};

describe('Issue validation', () => {
  it('should validate summary is not empty', () => {
    expect(validateSummary('Valid summary')).toBe(true);
    expect(validateSummary('')).toBe(false);
    expect(validateSummary('   ')).toBe(false);
  });

  it('should validate story points are positive', () => {
    expect(validateStoryPoints(5)).toBe(true);
    expect(validateStoryPoints(0)).toBe(true);
    expect(validateStoryPoints(undefined)).toBe(true);
    expect(validateStoryPoints(-1)).toBe(false);
  });

  it('should validate issue key format', () => {
    expect(validateIssueKey('DEMO-1')).toBe(true);
    expect(validateIssueKey('ABC123-456')).toBe(true);
    expect(validateIssueKey('demo-1')).toBe(false);
    expect(validateIssueKey('DEMO1')).toBe(false);
    expect(validateIssueKey('DEMO-')).toBe(false);
  });

  it('should validate due date format', () => {
    expect(validateDueDate('2024-12-31')).toBe(true);
    expect(validateDueDate('2024-12-31T00:00:00Z')).toBe(true);
    expect(validateDueDate(undefined)).toBe(true);
    expect(validateDueDate('invalid-date')).toBe(false);
  });
});

describe('Classification levels', () => {
  it('should accept valid classification values', () => {
    const validClassifications = ['unclassified', 'restricted', 'confidential', 'secret', 'top_secret'];
    
    validClassifications.forEach(classification => {
      const issue: IssueInsert = {
        project_id: 'proj-1',
        summary: 'Test',
        issue_type_id: 'type-1',
        status_id: 'status-1',
        classification: classification as IssueInsert['classification'],
      };
      
      expect(issue.classification).toBe(classification);
    });
  });
});
