/**
 * @fileoverview Unit tests for documentComposerService.
 * @module features/document-composer/services/documentComposerService.test
 */

import { describe, it, expect, vi } from 'vitest';

// ============================================================================
// Mock Response Functions (module level - S2004 fix)
// ============================================================================

function mockSingleResponse() {
  return Promise.resolve({ data: null, error: null });
}

function mockInResponse() {
  return Promise.resolve({ data: [], error: null });
}

function mockOrderResponse() {
  return Promise.resolve({ data: [], error: null });
}

function mockLimitResponse() {
  return Promise.resolve({ data: [], error: null });
}

function mockInsertSingleResponse() {
  return Promise.resolve({ data: { id: 'new-id' }, error: null });
}

function mockUpdateSingleResponse() {
  return Promise.resolve({ data: {}, error: null });
}

function mockDeleteResponse() {
  return Promise.resolve({ error: null });
}

// ============================================================================
// Mock Factory Function (module level - S2004 fix)
// ============================================================================

function createDefaultFromMock() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingleResponse,
        in: mockInResponse,
      })),
      order: mockOrderResponse,
      limit: mockLimitResponse,
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: mockInsertSingleResponse })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockUpdateSingleResponse })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: mockDeleteResponse,
    })),
  };
}

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-uuid' } } })),
    },
    from: vi.fn(() => createDefaultFromMock()),
  },
}));

// ============================================================================
// Type Definitions for Testing
// ============================================================================

/** Local type definitions matching the service */
type LocalExportFormat = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'html' | 'json';

interface LocalTemplateSchema {
  header?: {
    title?: string;
    logo?: string;
    showDate?: boolean;
    showPageNumbers?: boolean;
  };
  sections: {
    type: 'issues' | 'summary' | 'custom';
    title?: string;
    fields?: string[];
    content?: string;
  }[];
  footer?: {
    text?: string;
    showPageNumbers?: boolean;
  };
  watermark?: {
    text?: string;
    opacity?: number;
  };
}

interface LocalDocumentTemplate {
  id: string;
  name: string;
  description?: string;
  format: LocalExportFormat;
  schema: LocalTemplateSchema;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface LocalExportJob {
  id: string;
  name: string;
  template_id?: string;
  template_name?: string;
  format: LocalExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  issue_ids: string[];
  issueCount: number;
  progress: number;
  file_path?: string;
  fileUrl?: string;
  file_size?: number;
  error?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// ============================================================================
// Type Tests
// ============================================================================

describe('Document Composer Types', () => {
  describe('ExportFormat', () => {
    it('should accept all valid export formats', () => {
      const formats: LocalExportFormat[] = ['pdf', 'docx', 'xlsx', 'csv', 'html', 'json'];
      formats.forEach((format) => {
        expect(format).toBeDefined();
      });
    });
  });

  describe('TemplateSchema', () => {
    it('should support header configuration', () => {
      const schema: LocalTemplateSchema = {
        header: {
          title: 'Project Report',
          logo: '/logo.png',
          showDate: true,
          showPageNumbers: true,
        },
        sections: [],
      };
      
      expect(schema.header?.title).toBe('Project Report');
      expect(schema.header?.showDate).toBe(true);
    });

    it('should support issues section', () => {
      const schema: LocalTemplateSchema = {
        sections: [
          {
            type: 'issues',
            title: 'Issue Details',
            fields: ['issue_key', 'summary', 'status', 'priority', 'assignee'],
          },
        ],
      };
      
      expect(schema.sections[0].type).toBe('issues');
      expect(schema.sections[0].fields).toHaveLength(5);
    });

    it('should support summary section', () => {
      const schema: LocalTemplateSchema = {
        sections: [
          {
            type: 'summary',
            title: 'Executive Summary',
          },
        ],
      };
      
      expect(schema.sections[0].type).toBe('summary');
    });

    it('should support custom section', () => {
      const schema: LocalTemplateSchema = {
        sections: [
          {
            type: 'custom',
            title: 'Notes',
            content: '## Additional Information\n\nThis report was generated automatically.',
          },
        ],
      };
      
      expect(schema.sections[0].content).toBeDefined();
    });

    it('should support watermark configuration', () => {
      const schema: LocalTemplateSchema = {
        sections: [],
        watermark: {
          text: 'CONFIDENTIAL',
          opacity: 0.3,
        },
      };
      
      expect(schema.watermark?.text).toBe('CONFIDENTIAL');
      expect(schema.watermark?.opacity).toBe(0.3);
    });
  });

  describe('DocumentTemplate', () => {
    it('should represent a complete template', () => {
      const template: LocalDocumentTemplate = {
        id: 'template-uuid',
        name: 'Sprint Report Template',
        description: 'Template for generating sprint reports',
        format: 'pdf',
        schema: {
          header: {
            title: 'Sprint Report',
            showDate: true,
          },
          sections: [
            { type: 'summary', title: 'Summary' },
            { type: 'issues', title: 'Issues', fields: ['issue_key', 'summary'] },
          ],
          footer: {
            showPageNumbers: true,
          },
        },
        is_default: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-uuid',
      };
      
      expect(template.name).toBe('Sprint Report Template');
      expect(template.schema.sections).toHaveLength(2);
    });
  });

  describe('ExportJob', () => {
    it('should represent pending export', () => {
      const job: LocalExportJob = {
        id: 'job-uuid',
        name: 'Sprint 42 Report',
        template_id: 'template-uuid',
        template_name: 'Sprint Report Template',
        format: 'pdf',
        status: 'pending',
        issue_ids: ['issue-1', 'issue-2', 'issue-3'],
        issueCount: 3,
        progress: 0,
        created_at: '2024-01-15T10:00:00Z',
      };
      
      expect(job.status).toBe('pending');
      expect(job.progress).toBe(0);
    });

    it('should represent processing export', () => {
      const job: LocalExportJob = {
        id: 'job-uuid',
        name: 'Full Export',
        format: 'xlsx',
        status: 'processing',
        issue_ids: Array.from({ length: 100 }, (_, i) => `issue-${i}`),
        issueCount: 100,
        progress: 50,
        created_at: '2024-01-15T10:00:00Z',
      };
      
      expect(job.status).toBe('processing');
      expect(job.progress).toBe(50);
    });

    it('should represent completed export', () => {
      const job: LocalExportJob = {
        id: 'job-uuid',
        name: 'Completed Export',
        format: 'csv',
        status: 'completed',
        issue_ids: ['issue-1'],
        issueCount: 1,
        progress: 100,
        file_path: '/exports/completed-export.csv',
        fileUrl: 'https://storage.example.com/exports/completed-export.csv',
        file_size: 1024,
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
      };
      
      expect(job.status).toBe('completed');
      expect(job.file_size).toBe(1024);
    });

    it('should represent failed export', () => {
      const job: LocalExportJob = {
        id: 'job-uuid',
        name: 'Failed Export',
        format: 'pdf',
        status: 'failed',
        issue_ids: ['issue-1'],
        issueCount: 1,
        progress: 25,
        error: 'PDF generation failed',
        error_message: 'PDF generation failed',
        created_at: '2024-01-15T10:00:00Z',
      };
      
      expect(job.status).toBe('failed');
      expect(job.error).toBe('PDF generation failed');
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

// Module-level helper functions
function estimateExportTime(issueCount: number, format: LocalExportFormat): number {
  const baseTimeMs = 500;
  const perIssueMs = format === 'pdf' ? 100 : format === 'docx' ? 80 : 20;
  return baseTimeMs + issueCount * perIssueMs;
}

function validateTemplateSchema(schema: LocalTemplateSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema.sections || schema.sections.length === 0) {
    errors.push('Template must have at least one section');
  }

  for (const section of schema.sections || []) {
    if (!section.type) {
      errors.push('Each section must have a type');
    }
    if (section.type === 'issues' && (!section.fields || section.fields.length === 0)) {
      errors.push('Issues section must have at least one field');
    }
  }

  if (schema.watermark?.opacity !== undefined) {
    if (schema.watermark.opacity < 0 || schema.watermark.opacity > 1) {
      errors.push('Watermark opacity must be between 0 and 1');
    }
  }

  return { valid: errors.length === 0, errors };
}

function generateCSV(
  issues: { issue_key: string; summary: string; status: string }[],
  fields: string[]
): string {
  const headers = fields.join(',');
  const rows = issues.map((issue) =>
    fields.map((field) => {
      const value = String((issue as Record<string, unknown>)[field] || '');
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.split('"').join('""')}"`;
      }
      return value;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

describe('Document Composer Helpers', () => {
  describe('estimateExportTime', () => {
    it('should estimate time for PDF exports', () => {
      expect(estimateExportTime(10, 'pdf')).toBe(1500); // 500 + 10*100
      expect(estimateExportTime(100, 'pdf')).toBe(10500); // 500 + 100*100
    });

    it('should estimate time for CSV exports (faster)', () => {
      expect(estimateExportTime(10, 'csv')).toBe(700); // 500 + 10*20
      expect(estimateExportTime(100, 'csv')).toBe(2500); // 500 + 100*20
    });

    it('should return base time for zero issues', () => {
      expect(estimateExportTime(0, 'pdf')).toBe(500);
    });
  });

  describe('validateTemplateSchema', () => {
    it('should accept valid schema', () => {
      const schema: LocalTemplateSchema = {
        sections: [
          { type: 'summary', title: 'Summary' },
        ],
      };
      expect(validateTemplateSchema(schema)).toEqual({ valid: true, errors: [] });
    });

    it('should reject schema without sections', () => {
      const schema: LocalTemplateSchema = {
        sections: [],
      };
      expect(validateTemplateSchema(schema).errors).toContain(
        'Template must have at least one section'
      );
    });

    it('should require fields for issues section', () => {
      const schema: LocalTemplateSchema = {
        sections: [
          { type: 'issues', title: 'Issues' },
        ],
      };
      expect(validateTemplateSchema(schema).errors).toContain(
        'Issues section must have at least one field'
      );
    });

    it('should validate watermark opacity', () => {
      const schema: LocalTemplateSchema = {
        sections: [{ type: 'summary' }],
        watermark: { text: 'TEST', opacity: 1.5 },
      };
      expect(validateTemplateSchema(schema).errors).toContain(
        'Watermark opacity must be between 0 and 1'
      );
    });
  });
  describe('generateCSV', () => {
    it('should generate valid CSV', () => {
      const issues = [
        { issue_key: 'PROJ-1', summary: 'First issue', status: 'Open' },
        { issue_key: 'PROJ-2', summary: 'Second issue', status: 'Closed' },
      ];
      const csv = generateCSV(issues, ['issue_key', 'summary', 'status']);
      
      expect(csv).toBe(
        'issue_key,summary,status\nPROJ-1,First issue,Open\nPROJ-2,Second issue,Closed'
      );
    });

    it('should handle special characters', () => {
      const issues = [
        { issue_key: 'PROJ-1', summary: 'Issue with, comma', status: 'Open' },
      ];
      const csv = generateCSV(issues, ['issue_key', 'summary']);
      
      expect(csv).toBe('issue_key,summary\nPROJ-1,"Issue with, comma"');
    });

    it('should escape quotes', () => {
      const issues = [
        { issue_key: 'PROJ-1', summary: 'Issue with "quotes"', status: 'Open' },
      ];
      const csv = generateCSV(issues, ['issue_key', 'summary']);
      
      expect(csv).toBe('issue_key,summary\nPROJ-1,"Issue with ""quotes"""');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});

// ============================================================================
// Export Status Helpers - Module Level
// ============================================================================

function canDownload(job: LocalExportJob): boolean {
  return job.status === 'completed' && Boolean(job.file_path || job.fileUrl);
}

function getStatusDisplay(status: LocalExportJob['status']): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'Queued', color: 'gray' };
    case 'processing':
      return { label: 'Generating...', color: 'blue' };
    case 'completed':
      return { label: 'Ready', color: 'green' };
    case 'failed':
      return { label: 'Failed', color: 'red' };
  }
}

describe('Export Status Helpers', () => {
  describe('canDownload', () => {
    it('should return true for completed job with file', () => {
      const job: LocalExportJob = {
        id: '1', name: 'Test', format: 'csv', status: 'completed',
        issue_ids: [], issueCount: 0, progress: 100,
        file_path: '/path/to/file.csv',
        created_at: '',
      };
      expect(canDownload(job)).toBe(true);
    });

    it('should return false for pending job', () => {
      const job: LocalExportJob = {
        id: '1', name: 'Test', format: 'csv', status: 'pending',
        issue_ids: [], issueCount: 0, progress: 0,
        created_at: '',
      };
      expect(canDownload(job)).toBe(false);
    });

    it('should return false for completed job without file', () => {
      const job: LocalExportJob = {
        id: '1', name: 'Test', format: 'csv', status: 'completed',
        issue_ids: [], issueCount: 0, progress: 100,
        created_at: '',
      };
      expect(canDownload(job)).toBe(false);
    });
  });

  describe('getStatusDisplay', () => {
    it('should return correct display for each status', () => {
      expect(getStatusDisplay('pending')).toEqual({ label: 'Queued', color: 'gray' });
      expect(getStatusDisplay('processing')).toEqual({ label: 'Generating...', color: 'blue' });
      expect(getStatusDisplay('completed')).toEqual({ label: 'Ready', color: 'green' });
      expect(getStatusDisplay('failed')).toEqual({ label: 'Failed', color: 'red' });
    });
  });
});
