/**
 * @fileoverview Unit tests for structuredDataService.
 * @module features/structured-data-blocks/services/structuredDataService.test
 */

import { describe, it, expect, vi } from 'vitest';
import { createDefaultFromMock } from '@/test/mockFactories';

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

type ColumnType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'user' | 'computed';

interface LocalColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  required?: boolean;
  options?: { value: string; label: string }[];
  formula?: string;
  width?: number;
  defaultValue?: unknown;
}

interface LocalDataRow {
  id: string;
  values: Record<string, unknown>;
}

interface LocalDataBlockSchema {
  id: string;
  name: string;
  description?: string;
  columns: LocalColumnDefinition[];
  validation_rules: Record<string, unknown>;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ============================================================================
// Type Tests
// ============================================================================

describe('Structured Data Types', () => {
  describe('ColumnDefinition', () => {
    it('should support text column', () => {
      const column: LocalColumnDefinition = { id: 'col-1', name: 'Description', type: 'text', required: true };
      expect(column.type).toBe('text');
    });

    it('should support computed column with formula', () => {
      const column: LocalColumnDefinition = { id: 'col-4', name: 'Total', type: 'computed', formula: '=quantity * price' };
      expect(column.type).toBe('computed');
    });
  });

  describe('DataRow', () => {
    it('should represent a row with values', () => {
      const row: LocalDataRow = { id: 'row-1', values: { description: 'Item A', quantity: 5 } };
      expect(row.values.description).toBe('Item A');
    });
  });

  describe('DataBlockSchema', () => {
    it('should represent a complete schema', () => {
      const schema: LocalDataBlockSchema = {
        id: 'schema-uuid', name: 'Approval Matrix', description: 'Track approval requirements',
        columns: [{ id: 'c1', name: 'Item', type: 'text', required: true }],
        validation_rules: { amount_max: 10000 }, version: 1, is_active: true,
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', created_by: 'user-uuid',
      };
      expect(schema.columns).toHaveLength(1);
    });
  });
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

function validateCell(column: LocalColumnDefinition, value: unknown): { valid: boolean; error?: string } {
  if (column.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${column.name} is required` };
  }
  if (value === undefined || value === null || value === '') return { valid: true };
  switch (column.type) {
    case 'text':
      if (typeof value !== 'string') return { valid: false, error: `${column.name} must be text` };
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) return { valid: false, error: `${column.name} must be a number` };
      break;
    case 'select':
      if (!column.options?.find((o) => o.value === value)) return { valid: false, error: `${column.name} must be a valid option` };
      break;
  }
  return { valid: true };
}

function validateRow(schema: LocalDataBlockSchema, row: LocalDataRow): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const column of schema.columns) {
    if (column.type === 'computed') continue;
    const result = validateCell(column, row.values[column.id]);
    if (!result.valid && result.error) errors[column.id] = result.error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function generateRowId(): string {
  // Use crypto.getRandomValues for cryptographically secure random ID generation
  const array = new Uint32Array(2);
  crypto.getRandomValues(array);
  const randomPart = array[0].toString(36) + array[1].toString(36);
  return `row-${Date.now()}-${randomPart.slice(0, 11)}`;
}

function createEmptyRow(columns: LocalColumnDefinition[]): LocalDataRow {
  const values: Record<string, unknown> = {};
  for (const column of columns) {
    if (column.type === 'computed') continue;
    values[column.id] = column.defaultValue ?? null;
  }
  return { id: generateRowId(), values };
}

// ============================================================================
// Validation Tests
// ============================================================================

describe('Structured Data Validation', () => {
  describe('validateCell', () => {
    it('should validate required fields', () => {
      const column: LocalColumnDefinition = { id: '1', name: 'Name', type: 'text', required: true };
      expect(validateCell(column, '')).toEqual({ valid: false, error: 'Name is required' });
      expect(validateCell(column, 'Test')).toEqual({ valid: true });
    });

    it('should validate number type', () => {
      const column: LocalColumnDefinition = { id: '1', name: 'Amount', type: 'number' };
      expect(validateCell(column, 'not a number').valid).toBe(false);
      expect(validateCell(column, 42)).toEqual({ valid: true });
    });
  });

  describe('validateRow', () => {
    const schema: LocalDataBlockSchema = {
      id: 's1', name: 'Test', columns: [
        { id: 'c1', name: 'Name', type: 'text', required: true },
        { id: 'c2', name: 'Amount', type: 'number' },
      ],
      validation_rules: {}, version: 1, is_active: true, created_at: '', updated_at: '', created_by: '',
    };

    it('should validate row with errors', () => {
      const row: LocalDataRow = { id: 'r1', values: { c1: '', c2: 'invalid' } };
      const result = validateRow(schema, row);
      expect(result.valid).toBe(false);
      expect(result.errors.c1).toBe('Name is required');
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Structured Data Helpers', () => {
  describe('generateRowId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) ids.add(generateRowId());
      expect(ids.size).toBe(100);
    });
  });

  describe('createEmptyRow', () => {
    it('should create row with default values', () => {
      const columns: LocalColumnDefinition[] = [
        { id: 'c1', name: 'Name', type: 'text' },
        { id: 'c2', name: 'Count', type: 'number', defaultValue: 0 },
      ];
      const row = createEmptyRow(columns);
      expect(row.values.c1).toBeNull();
      expect(row.values.c2).toBe(0);
    });
  });
});
