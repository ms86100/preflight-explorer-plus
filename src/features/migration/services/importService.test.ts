/**
 * @fileoverview Unit tests for importService.
 * @module features/migration/services/importService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCSVHeaders, countCSVRows } from './importService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: 'mock-token' } },
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-uuid' } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
  },
}));

// Mock fetch for edge function calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
);

// ============================================================================
// Type Definitions for Testing
// ============================================================================

/** Import type options */
type ImportType = 'issues' | 'users' | 'projects' | 'components';

/** Validation error from CSV import */
interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

/** Validation result from edge function */
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  preview: Record<string, unknown>[];
}

/** Import job status */
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
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['Name', 'Email', 'Role']);
  });

  it('should handle quoted headers', () => {
    const csv = '"First Name","Last Name","Email Address"\nJohn,Doe,john@test.com';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['First Name', 'Last Name', 'Email Address']);
  });

  it('should handle escaped quotes in headers', () => {
    const csv = '"Field ""A""","Field B"\nvalue1,value2';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['Field "A"', 'Field B']);
  });

  it('should handle empty CSV', () => {
    const csv = '';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual([]);
  });

  it('should trim whitespace from headers', () => {
    const csv = '  Name  ,  Email  ,  Role  \nJohn,john@test.com,Admin';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['Name', 'Email', 'Role']);
  });

  it('should handle headers with commas inside quotes', () => {
    const csv = '"Last, First","Email"\n"Doe, John",john@test.com';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['Last, First', 'Email']);
  });

  it('should handle single column CSV', () => {
    const csv = 'Name\nJohn\nJane';
    const headers = parseCSVHeaders(csv);
    expect(headers).toEqual(['Name']);
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
    const csv = 'Name,Email';
    expect(countCSVRows(csv)).toBe(0);
  });

  it('should return 0 for empty CSV', () => {
    const csv = '';
    expect(countCSVRows(csv)).toBe(0);
  });

  it('should handle CSV with trailing newline', () => {
    const csv = 'Name,Email\nJohn,john@test.com\n';
    // With trailing newline, split gives an extra empty string
    expect(countCSVRows(csv)).toBe(1);
  });

  it('should handle large CSV', () => {
    const header = 'Name,Email,Role';
    const rows = Array.from({ length: 1000 }, (_, i) => `User${i},user${i}@test.com,User`);
    const csv = [header, ...rows].join('\n');
    expect(countCSVRows(csv)).toBe(1000);
  });
});

// ============================================================================
// Type Tests
// ============================================================================

describe('Import Types', () => {
  describe('ImportType', () => {
    it('should accept all valid import types', () => {
      const types: ImportType[] = ['issues', 'users', 'projects', 'components'];
      types.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('ValidationError', () => {
    it('should represent a validation error', () => {
      const error: ValidationError = {
        row: 5,
        field: 'email',
        message: 'Invalid email format',
        value: 'not-an-email',
      };
      
      expect(error.row).toBe(5);
      expect(error.field).toBe('email');
    });

    it('should allow optional value', () => {
      const error: ValidationError = {
        row: 1,
        field: 'required_field',
        message: 'Field is required',
      };
      
      expect(error.value).toBeUndefined();
    });
  });

  describe('ValidationResult', () => {
    it('should represent valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        preview: [
          { name: 'John', email: 'john@test.com' },
          { name: 'Jane', email: 'jane@test.com' },
        ],
      };
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should represent invalid result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          { row: 2, field: 'email', message: 'Required field missing' },
        ],
        warnings: [
          { row: 3, field: 'role', message: 'Unknown role, using default' },
        ],
        preview: [],
      };
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('ImportJob', () => {
    it('should support all statuses', () => {
      const statuses: ImportJob['status'][] = [
        'pending',
        'validated',
        'processing',
        'completed',
        'failed',
      ];
      
      statuses.forEach((status) => {
        expect(status).toBeDefined();
      });
    });

    it('should represent pending job', () => {
      const job: ImportJob = {
        id: 'job-uuid',
        user_id: 'user-uuid',
        import_type: 'issues',
        file_name: 'issues.csv',
        status: 'pending',
        total_records: null,
        processed_records: null,
        successful_records: null,
        failed_records: null,
        field_mappings: null,
        created_at: '2024-01-15T10:00:00Z',
        started_at: null,
        completed_at: null,
        error_message: null,
      };
      
      expect(job.status).toBe('pending');
    });

    it('should represent completed job', () => {
      const job: ImportJob = {
        id: 'job-uuid',
        user_id: 'user-uuid',
        import_type: 'issues',
        file_name: 'issues.csv',
        status: 'completed',
        total_records: 100,
        processed_records: 100,
        successful_records: 98,
        failed_records: 2,
        field_mappings: { summary: 'Title', description: 'Details' },
        created_at: '2024-01-15T10:00:00Z',
        started_at: '2024-01-15T10:01:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        error_message: null,
      };
      
      expect(job.successful_records).toBe(98);
      expect(job.failed_records).toBe(2);
    });

    it('should represent failed job', () => {
      const job: ImportJob = {
        id: 'job-uuid',
        user_id: 'user-uuid',
        import_type: 'users',
        file_name: 'users.csv',
        status: 'failed',
        total_records: 50,
        processed_records: 10,
        successful_records: 10,
        failed_records: 0,
        field_mappings: null,
        created_at: '2024-01-15T10:00:00Z',
        started_at: '2024-01-15T10:01:00Z',
        completed_at: '2024-01-15T10:02:00Z',
        error_message: 'Database connection lost',
      };
      
      expect(job.status).toBe('failed');
      expect(job.error_message).toBe('Database connection lost');
    });
  });
});

// ============================================================================
// Field Mapping Tests
// ============================================================================

describe('Field Mapping', () => {
  /** Target fields for issues import */
  const issueTargetFields = [
    'summary',
    'description',
    'issue_type',
    'status',
    'priority',
    'assignee',
    'reporter',
    'due_date',
    'story_points',
    'labels',
    'components',
  ];

  /**
   * Suggests field mapping based on header similarity.
   */
  function suggestMapping(
    header: string,
    targetFields: string[]
  ): string | null {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Direct match
    for (const field of targetFields) {
      if (field.replace(/_/g, '') === normalized) {
        return field;
      }
    }
    
    // Partial match
    const mappings: Record<string, string[]> = {
      summary: ['title', 'name', 'subject'],
      description: ['desc', 'details', 'body', 'content'],
      issue_type: ['type', 'issuetype', 'category'],
      priority: ['prio', 'importance', 'urgency'],
      assignee: ['assigned', 'owner', 'assignedto'],
      reporter: ['author', 'creator', 'createdby'],
      due_date: ['due', 'duedate', 'deadline'],
      story_points: ['points', 'estimate', 'storypoints'],
    };
    
    for (const [field, aliases] of Object.entries(mappings)) {
      if (aliases.some((alias) => normalized.includes(alias))) {
        return field;
      }
    }
    
    return null;
  }

  describe('suggestMapping', () => {
    it('should match exact field names', () => {
      expect(suggestMapping('summary', issueTargetFields)).toBe('summary');
      expect(suggestMapping('description', issueTargetFields)).toBe('description');
      expect(suggestMapping('priority', issueTargetFields)).toBe('priority');
    });

    it('should match field names with different casing', () => {
      expect(suggestMapping('Summary', issueTargetFields)).toBe('summary');
      expect(suggestMapping('DESCRIPTION', issueTargetFields)).toBe('description');
    });

    it('should match common aliases', () => {
      expect(suggestMapping('Title', issueTargetFields)).toBe('summary');
      expect(suggestMapping('Details', issueTargetFields)).toBe('description');
      expect(suggestMapping('Type', issueTargetFields)).toBe('issue_type');
      expect(suggestMapping('Owner', issueTargetFields)).toBe('assignee');
    });

    it('should match fields with spaces and special chars', () => {
      expect(suggestMapping('Issue Type', issueTargetFields)).toBe('issue_type');
      expect(suggestMapping('Due Date', issueTargetFields)).toBe('due_date');
      expect(suggestMapping('Story Points', issueTargetFields)).toBe('story_points');
    });

    it('should return null for unknown fields', () => {
      expect(suggestMapping('CustomField', issueTargetFields)).toBeNull();
      expect(suggestMapping('RandomColumn', issueTargetFields)).toBeNull();
    });
  });

  /**
   * Validates field mappings for completeness.
   */
  function validateMappings(
    mappings: Record<string, string>,
    requiredFields: string[]
  ): { valid: boolean; missing: string[] } {
    const mappedTargets = new Set(Object.values(mappings));
    const missing = requiredFields.filter((field) => !mappedTargets.has(field));
    
    return {
      valid: missing.length === 0,
      missing,
    };
  }

  describe('validateMappings', () => {
    it('should validate complete mappings', () => {
      const mappings = {
        Title: 'summary',
        Type: 'issue_type',
        Status: 'status',
      };
      const required = ['summary', 'issue_type', 'status'];
      
      expect(validateMappings(mappings, required)).toEqual({
        valid: true,
        missing: [],
      });
    });

    it('should detect missing required fields', () => {
      const mappings = {
        Title: 'summary',
      };
      const required = ['summary', 'issue_type', 'status'];
      
      expect(validateMappings(mappings, required)).toEqual({
        valid: false,
        missing: ['issue_type', 'status'],
      });
    });

    it('should handle empty mappings', () => {
      const mappings = {};
      const required = ['summary'];
      
      expect(validateMappings(mappings, required)).toEqual({
        valid: false,
        missing: ['summary'],
      });
    });
  });
});

// ============================================================================
// Progress Calculation Tests
// ============================================================================

describe('Progress Calculation', () => {
  /**
   * Calculates import progress percentage.
   */
  function calculateProgress(job: ImportJob): number {
    if (job.status === 'completed') return 100;
    if (job.status === 'pending' || job.status === 'validated') return 0;
    if (!job.total_records || !job.processed_records) return 0;
    
    return Math.round((job.processed_records / job.total_records) * 100);
  }

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

    it('should calculate progress for processing jobs', () => {
      const job: ImportJob = {
        id: '1', user_id: 'u', import_type: 'issues', file_name: null,
        status: 'processing', total_records: 100, processed_records: 50,
        successful_records: 48, failed_records: 2, field_mappings: null,
        created_at: '', started_at: null, completed_at: null, error_message: null,
      };
      expect(calculateProgress(job)).toBe(50);
    });
  });
});
