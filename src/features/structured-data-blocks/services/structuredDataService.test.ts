/**
 * @fileoverview Unit tests for structuredDataService.
 * @module features/structured-data-blocks/services/structuredDataService.test
 */

import { describe, it, expect, vi } from 'vitest';

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

/** Column types */
type ColumnType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'user' | 'computed';

/** Column definition */
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

/** Data row */
interface LocalDataRow {
  id: string;
  values: Record<string, unknown>;
}

/** Schema definition */
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

/** Instance of a schema */
interface LocalDataBlockInstance {
  id: string;
  schema_id: string;
  schema_name?: string;
  name?: string;
  issue_id?: string;
  project_id?: string;
  rows: LocalDataRow[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Type Tests
// ============================================================================

describe('Structured Data Types', () => {
  describe('ColumnDefinition', () => {
    it('should support text column', () => {
      const column: LocalColumnDefinition = {
        id: 'col-1',
        name: 'Description',
        type: 'text',
        required: true,
        width: 200,
      };
      
      expect(column.type).toBe('text');
      expect(column.required).toBe(true);
    });

    it('should support number column', () => {
      const column: LocalColumnDefinition = {
        id: 'col-2',
        name: 'Quantity',
        type: 'number',
        defaultValue: 0,
      };
      
      expect(column.type).toBe('number');
      expect(column.defaultValue).toBe(0);
    });

    it('should support select column with options', () => {
      const column: LocalColumnDefinition = {
        id: 'col-3',
        name: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
        ],
      };
      
      expect(column.options).toHaveLength(3);
    });

    it('should support computed column with formula', () => {
      const column: LocalColumnDefinition = {
        id: 'col-4',
        name: 'Total',
        type: 'computed',
        formula: '=quantity * price',
      };
      
      expect(column.type).toBe('computed');
      expect(column.formula).toBe('=quantity * price');
    });
  });

  describe('DataRow', () => {
    it('should represent a row with values', () => {
      const row: LocalDataRow = {
        id: 'row-1',
        values: {
          description: 'Item A',
          quantity: 5,
          status: 'approved',
        },
      };
      
      expect(row.values.description).toBe('Item A');
      expect(row.values.quantity).toBe(5);
    });
  });

  describe('DataBlockSchema', () => {
    it('should represent a complete schema', () => {
      const schema: LocalDataBlockSchema = {
        id: 'schema-uuid',
        name: 'Approval Matrix',
        description: 'Track approval requirements',
        columns: [
          { id: 'c1', name: 'Item', type: 'text', required: true },
          { id: 'c2', name: 'Amount', type: 'number' },
          { id: 'c3', name: 'Approver', type: 'user' },
          { id: 'c4', name: 'Status', type: 'select', options: [] },
        ],
        validation_rules: {
          amount_max: 10000,
        },
        version: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-uuid',
      };
      
      expect(schema.columns).toHaveLength(4);
      expect(schema.validation_rules.amount_max).toBe(10000);
    });
  });

  describe('DataBlockInstance', () => {
    it('should represent an instance with data', () => {
      const instance: LocalDataBlockInstance = {
        id: 'instance-uuid',
        schema_id: 'schema-uuid',
        schema_name: 'Approval Matrix',
        name: 'Q1 Approvals',
        issue_id: 'issue-uuid',
        rows: [
          { id: 'r1', values: { item: 'Server', amount: 5000 } },
          { id: 'r2', values: { item: 'Software', amount: 2000 } },
        ],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(instance.rows).toHaveLength(2);
      expect(instance.rows[0].values.item).toBe('Server');
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('Structured Data Validation', () => {
  /**
   * Validates a cell value against column definition.
   */
  function validateCell(
    column: LocalColumnDefinition,
    value: unknown
  ): { valid: boolean; error?: string } {
    // Check required
    if (column.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${column.name} is required` };
    }

    // Skip validation for empty non-required values
    if (value === undefined || value === null || value === '') {
      return { valid: true };
    }

    switch (column.type) {
      case 'text':
        if (typeof value !== 'string') {
          return { valid: false, error: `${column.name} must be text` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `${column.name} must be a number` };
        }
        break;

      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return { valid: false, error: `${column.name} must be a valid date` };
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${column.name} must be true or false` };
        }
        break;

      case 'select':
        if (!column.options?.find((o) => o.value === value)) {
          return { valid: false, error: `${column.name} must be a valid option` };
        }
        break;
    }

    return { valid: true };
  }

  describe('validateCell', () => {
    it('should validate required fields', () => {
      const column: LocalColumnDefinition = {
        id: '1', name: 'Name', type: 'text', required: true,
      };
      
      expect(validateCell(column, '')).toEqual({
        valid: false,
        error: 'Name is required',
      });
      expect(validateCell(column, 'Test')).toEqual({ valid: true });
    });

    it('should validate number type', () => {
      const column: LocalColumnDefinition = {
        id: '1', name: 'Amount', type: 'number',
      };
      
      expect(validateCell(column, 'not a number')).toEqual({
        valid: false,
        error: 'Amount must be a number',
      });
      expect(validateCell(column, 42)).toEqual({ valid: true });
    });

    it('should validate select options', () => {
      const column: LocalColumnDefinition = {
        id: '1', name: 'Status', type: 'select',
        options: [{ value: 'a', label: 'A' }],
      };
      
      expect(validateCell(column, 'invalid')).toEqual({
        valid: false,
        error: 'Status must be a valid option',
      });
      expect(validateCell(column, 'a')).toEqual({ valid: true });
    });
  });

  /**
   * Validates an entire row against schema.
   */
  function validateRow(
    schema: LocalDataBlockSchema,
    row: LocalDataRow
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const column of schema.columns) {
      if (column.type === 'computed') continue; // Skip computed columns
      
      const result = validateCell(column, row.values[column.id]);
      if (!result.valid && result.error) {
        errors[column.id] = result.error;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  describe('validateRow', () => {
    const schema: LocalDataBlockSchema = {
      id: 's1', name: 'Test', description: '',
      columns: [
        { id: 'c1', name: 'Name', type: 'text', required: true },
        { id: 'c2', name: 'Amount', type: 'number' },
      ],
      validation_rules: {},
      version: 1, is_active: true,
      created_at: '', updated_at: '', created_by: '',
    };

    it('should validate row with errors', () => {
      const row: LocalDataRow = {
        id: 'r1',
        values: { c1: '', c2: 'invalid' },
      };
      
      const result = validateRow(schema, row);
      expect(result.valid).toBe(false);
      expect(result.errors.c1).toBe('Name is required');
      expect(result.errors.c2).toBe('Amount must be a number');
    });

    it('should validate correct row', () => {
      const row: LocalDataRow = {
        id: 'r1',
        values: { c1: 'Test', c2: 100 },
      };
      
      const result = validateRow(schema, row);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Structured Data Helpers', () => {
  /**
   * Generates a new row ID.
   */
  function generateRowId(): string {
    return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  describe('generateRowId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRowId());
      }
      expect(ids.size).toBe(100);
    });

    it('should start with row- prefix', () => {
      expect(generateRowId()).toMatch(/^row-/);
    });
  });

  /**
   * Creates empty row with default values.
   */
  function createEmptyRow(columns: LocalColumnDefinition[]): LocalDataRow {
    const values: Record<string, unknown> = {};
    
    for (const column of columns) {
      if (column.type === 'computed') continue;
      values[column.id] = column.defaultValue ?? null;
    }
    
    return {
      id: generateRowId(),
      values,
    };
  }

  describe('createEmptyRow', () => {
    it('should create row with default values', () => {
      const columns: LocalColumnDefinition[] = [
        { id: 'c1', name: 'Name', type: 'text' },
        { id: 'c2', name: 'Count', type: 'number', defaultValue: 0 },
        { id: 'c3', name: 'Active', type: 'checkbox', defaultValue: false },
      ];
      
      const row = createEmptyRow(columns);
      expect(row.values.c1).toBeNull();
      expect(row.values.c2).toBe(0);
      expect(row.values.c3).toBe(false);
    });

    it('should skip computed columns', () => {
      const columns: LocalColumnDefinition[] = [
        { id: 'c1', name: 'Price', type: 'number' },
        { id: 'c2', name: 'Qty', type: 'number' },
        { id: 'c3', name: 'Total', type: 'computed', formula: '=c1*c2' },
      ];
      
      const row = createEmptyRow(columns);
      expect(row.values.c3).toBeUndefined();
    });
  });

  /**
   * Safely evaluates a simple arithmetic formula without using eval/Function.
   * Only supports basic math operations: +, -, *, /, parentheses, and numbers.
   */
  function evaluateFormula(
    formula: string,
    row: LocalDataRow,
    columns: LocalColumnDefinition[]
  ): number | string | null {
    if (!formula.startsWith('=')) return null;
    
    const expression = formula.slice(1);
    
    // Replace column references with values
    let evaluatable = expression;
    for (const column of columns) {
      const value = row.values[column.id];
      if (typeof value === 'number') {
        evaluatable = evaluatable.replace(new RegExp(`\\b${column.id}\\b`, 'g'), String(value));
      }
    }
    
    // Validate: only allow numbers, operators, parentheses, decimals, and whitespace
    const safePattern = /^[\d+\-*/().\s]+$/;
    if (!safePattern.test(evaluatable)) {
      return null;
    }
    
    try {
      // Safe recursive descent parser for basic arithmetic
      return parseExpression(evaluatable.replace(/\s/g, ''));
    } catch {
      return null;
    }
  }

  /**
   * Simple recursive descent parser for arithmetic expressions.
   * Handles +, -, *, /, and parentheses with correct precedence.
   */
  function parseExpression(expr: string): number {
    let pos = 0;

    function parseNumber(): number {
      let numStr = '';
      while (pos < expr.length && /[\d.]/.test(expr[pos])) {
        numStr += expr[pos++];
      }
      if (!numStr) throw new Error('Expected number');
      return parseFloat(numStr);
    }

    function parseFactor(): number {
      if (expr[pos] === '(') {
        pos++; // skip '('
        const result = parseAddSub();
        if (expr[pos] !== ')') throw new Error('Expected )');
        pos++; // skip ')'
        return result;
      }
      // Handle negative numbers
      if (expr[pos] === '-') {
        pos++;
        return -parseFactor();
      }
      return parseNumber();
    }

    function parseMulDiv(): number {
      let left = parseFactor();
      while (pos < expr.length && (expr[pos] === '*' || expr[pos] === '/')) {
        const op = expr[pos++];
        const right = parseFactor();
        left = op === '*' ? left * right : left / right;
      }
      return left;
    }

    function parseAddSub(): number {
      let left = parseMulDiv();
      while (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
        const op = expr[pos++];
        const right = parseMulDiv();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    const result = parseAddSub();
    if (pos !== expr.length) throw new Error('Unexpected character');
    return result;
  }

  describe('evaluateFormula', () => {
    const columns: LocalColumnDefinition[] = [
      { id: 'price', name: 'Price', type: 'number' },
      { id: 'qty', name: 'Quantity', type: 'number' },
    ];

    it('should evaluate simple multiplication', () => {
      const row: LocalDataRow = {
        id: 'r1',
        values: { price: 10, qty: 5 },
      };
      
      expect(evaluateFormula('=price*qty', row, columns)).toBe(50);
    });

    it('should evaluate addition', () => {
      const row: LocalDataRow = {
        id: 'r1',
        values: { price: 10, qty: 5 },
      };
      
      expect(evaluateFormula('=price+qty', row, columns)).toBe(15);
    });

    it('should return null for invalid formula', () => {
      const row: LocalDataRow = { id: 'r1', values: {} };
      expect(evaluateFormula('not a formula', row, columns)).toBeNull();
    });
  });

  /**
   * Calculates summary statistics for a column.
   */
  function calculateColumnStats(
    rows: LocalDataRow[],
    columnId: string
  ): { sum: number; avg: number; min: number; max: number; count: number } {
    const values = rows
      .map((r) => r.values[columnId])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    
    if (values.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  describe('calculateColumnStats', () => {
    it('should calculate stats for numeric column', () => {
      const rows: LocalDataRow[] = [
        { id: 'r1', values: { amount: 10 } },
        { id: 'r2', values: { amount: 20 } },
        { id: 'r3', values: { amount: 30 } },
      ];
      
      const stats = calculateColumnStats(rows, 'amount');
      expect(stats.sum).toBe(60);
      expect(stats.avg).toBe(20);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(30);
      expect(stats.count).toBe(3);
    });

    it('should handle empty rows', () => {
      const stats = calculateColumnStats([], 'amount');
      expect(stats).toEqual({ sum: 0, avg: 0, min: 0, max: 0, count: 0 });
    });

    it('should skip non-numeric values', () => {
      const rows: LocalDataRow[] = [
        { id: 'r1', values: { amount: 10 } },
        { id: 'r2', values: { amount: 'invalid' } },
        { id: 'r3', values: { amount: 20 } },
      ];
      
      const stats = calculateColumnStats(rows, 'amount');
      expect(stats.sum).toBe(30);
      expect(stats.count).toBe(2);
    });
  });
});

// ============================================================================
// Schema Migration Tests
// ============================================================================

describe('Schema Migration', () => {
  /**
   * Migrates instance data when schema changes.
   */
  function migrateInstanceData(
    instance: LocalDataBlockInstance,
    oldSchema: LocalDataBlockSchema,
    newSchema: LocalDataBlockSchema
  ): LocalDataBlockInstance {
    const oldColumnIds = new Set(oldSchema.columns.map((c) => c.id));
    const newColumnIds = new Set(newSchema.columns.map((c) => c.id));
    
    // Find added and removed columns
    const addedColumns = newSchema.columns.filter((c) => !oldColumnIds.has(c.id));
    const removedColumnIds = oldSchema.columns
      .filter((c) => !newColumnIds.has(c.id))
      .map((c) => c.id);
    
    // Migrate each row
    const newRows = instance.rows.map((row) => {
      const newValues = { ...row.values };
      
      // Remove old columns
      for (const id of removedColumnIds) {
        delete newValues[id];
      }
      
      // Add new columns with defaults
      for (const column of addedColumns) {
        if (column.type !== 'computed') {
          newValues[column.id] = column.defaultValue ?? null;
        }
      }
      
      return { ...row, values: newValues };
    });
    
    return { ...instance, rows: newRows };
  }

  describe('migrateInstanceData', () => {
    it('should add new columns with defaults', () => {
      const oldSchema: LocalDataBlockSchema = {
        id: 's1', name: 'Test', columns: [
          { id: 'c1', name: 'Name', type: 'text' },
        ],
        validation_rules: {}, version: 1, is_active: true,
        created_at: '', updated_at: '', created_by: '',
      };
      
      const newSchema: LocalDataBlockSchema = {
        ...oldSchema,
        version: 2,
        columns: [
          { id: 'c1', name: 'Name', type: 'text' },
          { id: 'c2', name: 'Status', type: 'text', defaultValue: 'new' },
        ],
      };
      
      const instance: LocalDataBlockInstance = {
        id: 'i1', schema_id: 's1',
        rows: [{ id: 'r1', values: { c1: 'Test' } }],
        created_at: '', updated_at: '',
      };
      
      const migrated = migrateInstanceData(instance, oldSchema, newSchema);
      expect(migrated.rows[0].values.c2).toBe('new');
    });

    it('should remove deleted columns', () => {
      const oldSchema: LocalDataBlockSchema = {
        id: 's1', name: 'Test', columns: [
          { id: 'c1', name: 'Name', type: 'text' },
          { id: 'c2', name: 'Old', type: 'text' },
        ],
        validation_rules: {}, version: 1, is_active: true,
        created_at: '', updated_at: '', created_by: '',
      };
      
      const newSchema: LocalDataBlockSchema = {
        ...oldSchema,
        version: 2,
        columns: [
          { id: 'c1', name: 'Name', type: 'text' },
        ],
      };
      
      const instance: LocalDataBlockInstance = {
        id: 'i1', schema_id: 's1',
        rows: [{ id: 'r1', values: { c1: 'Test', c2: 'Old Value' } }],
        created_at: '', updated_at: '',
      };
      
      const migrated = migrateInstanceData(instance, oldSchema, newSchema);
      expect(migrated.rows[0].values.c2).toBeUndefined();
    });
  });
});
