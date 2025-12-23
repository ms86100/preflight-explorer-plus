/**
 * @fileoverview Unit tests for importService.
 * @module features/migration/services/importService.test
 */

import { describe, it, expect, vi } from 'vitest';
import { parseCSVHeaders, countCSVRows } from './importService';

// ============================================================================
// Mock Response Functions (module level - S2004 fix)
// ============================================================================

function mockSessionResponse() {
  return Promise.resolve({ data: { session: { access_token: 'mock-token' } } });
}

function mockUserResponse() {
  return Promise.resolve({ data: { user: { id: 'user-uuid' } } });
}

function mockLimitResponse() {
  return Promise.resolve({ data: [], error: null });
}

function mockInsertSingleResponse() {
  return Promise.resolve({ data: {}, error: null });
}

// ============================================================================
// Mock Factory Function (module level - S2004 fix)
// ============================================================================

function createDefaultFromMock() {
  return {
    select: vi.fn(() => ({
      order: vi.fn(() => ({ limit: mockLimitResponse })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: mockInsertSingleResponse })),
    })),
  };
}

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(mockSessionResponse),
      getUser: vi.fn(mockUserResponse),
    },
    from: vi.fn(() => createDefaultFromMock()),
  },
}));

// Mock fetch for edge function calls
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
);

// ============================================================================
// Type Definitions for Testing
// ============================================================================

type ImportType = 'issues' | 'users' | 'projects' | 'components';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  preview: Record<string, unknown>[];
}

interface ImportJob {
  id: string;
  user_id: string;
  import_type: ImportType;
  file_name: string | null;
  status: 'pending' | 'validated' | 'processing' | 'completed' | 'failed';
  total_records: number | null;
  processed_records: number | null;
  successful_records: number | null;
  failed_records: number | null;
  field_mappings: Record<string, string> | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

// ============================================================================
// parseCSVHeaders Tests
// ============================================================================

describe('parseCSVHeaders', () => {
  it('should parse simple headers', () => {
    const csv = 'Name,Email,Role\nJohn,john@test.com,Admin';
    expect(parseCSVHeaders(csv)).toEqual(['Name', 'Email', 'Role']);
  });

  it('should handle quoted headers', () => {
    const csv = '"First Name","Last Name","Email Address"\nJohn,Doe,john@test.com';
    expect(parseCSVHeaders(csv)).toEqual(['First Name', 'Last Name', 'Email Address']);
  });

  it('should handle empty CSV', () => {
    expect(parseCSVHeaders('')).toEqual([]);
  });

  it('should trim whitespace from headers', () => {
    const csv = '  Name  ,  Email  ,  Role  \nJohn,john@test.com,Admin';
    expect(parseCSVHeaders(csv)).toEqual(['Name', 'Email', 'Role']);
  });
});

// ============================================================================
// countCSVRows Tests
// ============================================================================

describe('countCSVRows', () => {
  it('should count rows excluding header', () => {
    const csv = 'Name,Email\nJohn,john@test.com\nJane,jane@test.com';
    expect(countCSVRows(csv)).toBe(2);
  });

  it('should return 0 for header-only CSV', () => {
    expect(countCSVRows('Name,Email')).toBe(0);
  });

  it('should return 0 for empty CSV', () => {
    expect(countCSVRows('')).toBe(0);
  });
});

// ============================================================================
// Type Tests
// ============================================================================

describe('Import Types', () => {
  describe('ImportType', () => {
    it('should accept all valid import types', () => {
      const types: ImportType[] = ['issues', 'users', 'projects', 'components'];
      types.forEach((type) => expect(type).toBeDefined());
    });
  });

  describe('ImportJob', () => {
    it('should represent pending job', () => {
      const job: ImportJob = {
        id: 'job-uuid', user_id: 'user-uuid', import_type: 'issues',
        file_name: 'issues.csv', status: 'pending', total_records: null,
        processed_records: null, successful_records: null, failed_records: null,
        field_mappings: null, created_at: '2024-01-15T10:00:00Z',
        started_at: null, completed_at: null, error_message: null,
      };
      expect(job.status).toBe('pending');
    });
  });
});

// ============================================================================
// Field Mapping Tests - Module Level Helpers
// ============================================================================

const issueTargetFields = ['summary', 'description', 'issue_type', 'status', 'priority', 'assignee', 'reporter', 'due_date', 'story_points', 'labels', 'components'];

function suggestMapping(header: string, targetFields: string[]): string | null {
  const normalized = header.toLowerCase().split(/[^a-z0-9]/).join('');
  for (const field of targetFields) {
    if (field.split('_').join('') === normalized) return field;
  }
  const mappings: Record<string, string[]> = {
    summary: ['title', 'name', 'subject'],
    description: ['desc', 'details', 'body', 'content'],
    issue_type: ['type', 'issuetype', 'category'],
    priority: ['prio', 'importance', 'urgency'],
    assignee: ['assigned', 'owner', 'assignedto'],
  };
  for (const [field, aliases] of Object.entries(mappings)) {
    if (aliases.some((alias) => normalized.includes(alias))) return field;
  }
  return null;
}

function validateMappings(mappings: Record<string, string>, requiredFields: string[]): { valid: boolean; missing: string[] } {
  const mappedTargets = new Set(Object.values(mappings));
  const missing = requiredFields.filter((field) => !mappedTargets.has(field));
  return { valid: missing.length === 0, missing };
}

function calculateProgress(job: ImportJob): number {
  if (job.status === 'completed') return 100;
  if (job.status === 'pending' || job.status === 'validated') return 0;
  if (!job.total_records || !job.processed_records) return 0;
  return Math.round((job.processed_records / job.total_records) * 100);
}

describe('Field Mapping', () => {
  describe('suggestMapping', () => {
    it('should match exact field names', () => {
      expect(suggestMapping('summary', issueTargetFields)).toBe('summary');
    });

    it('should match common aliases', () => {
      expect(suggestMapping('Title', issueTargetFields)).toBe('summary');
    });
  });
});

describe('Field Mapping Validation', () => {
  it('should validate complete mappings', () => {
    const mappings = { Title: 'summary', Type: 'issue_type', Status: 'status' };
    expect(validateMappings(mappings, ['summary', 'issue_type', 'status'])).toEqual({ valid: true, missing: [] });
  });
});

describe('calculateProgress', () => {
  it('should return 100 for completed jobs', () => {
    const job: ImportJob = {
      id: '1', user_id: 'u', import_type: 'issues', file_name: null,
      status: 'completed', total_records: 100, processed_records: 100,
      successful_records: 100, failed_records: 0, field_mappings: null,
      created_at: '', started_at: null, completed_at: null, error_message: null,
    };
    expect(calculateProgress(job)).toBe(100);
  });

  it('should return 0 for pending jobs', () => {
    const job: ImportJob = {
      id: '1', user_id: 'u', import_type: 'issues', file_name: null,
      status: 'pending', total_records: null, processed_records: null,
      successful_records: null, failed_records: null, field_mappings: null,
      created_at: '', started_at: null, completed_at: null, error_message: null,
    };
    expect(calculateProgress(job)).toBe(0);
  });
});
