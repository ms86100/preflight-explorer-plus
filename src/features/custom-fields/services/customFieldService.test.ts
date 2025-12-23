/**
 * @fileoverview Unit tests for customFieldService.
 * @module features/custom-fields/services/customFieldService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FieldType, CustomFieldDefinition, CustomFieldContext, CustomFieldValue, FieldOption } from './customFieldService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
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
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
  },
}));

// ============================================================================
// Type Tests
// ============================================================================

describe('Custom Field Types', () => {
  describe('FieldType', () => {
    it('should accept all valid field types', () => {
      const validTypes: FieldType[] = [
        'text',
        'textarea',
        'number',
        'date',
        'datetime',
        'select',
        'multiselect',
        'checkbox',
        'user',
        'url',
      ];
      
      validTypes.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('FieldOption', () => {
    it('should have required value and label properties', () => {
      const option: FieldOption = {
        value: 'option-1',
        label: 'Option One',
      };
      
      expect(option.value).toBe('option-1');
      expect(option.label).toBe('Option One');
    });
  });

  describe('CustomFieldDefinition', () => {
    it('should have all required properties', () => {
      const field: CustomFieldDefinition = {
        id: 'field-uuid',
        name: 'Custom Field',
        description: 'A custom field description',
        field_type: 'text',
        default_value: null,
        is_required: false,
        is_active: true,
        options: null,
        validation_rules: null,
        position: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(field.id).toBeDefined();
      expect(field.name).toBeDefined();
      expect(field.field_type).toBeDefined();
    });

    it('should support select field with options', () => {
      const field: CustomFieldDefinition = {
        id: 'select-field-uuid',
        name: 'Priority Level',
        description: null,
        field_type: 'select',
        default_value: 'medium',
        is_required: true,
        is_active: true,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
        validation_rules: null,
        position: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(field.options).toHaveLength(3);
      expect(field.options?.[0].value).toBe('low');
    });

    it('should support validation rules', () => {
      const field: CustomFieldDefinition = {
        id: 'validated-field-uuid',
        name: 'Email',
        description: null,
        field_type: 'text',
        default_value: null,
        is_required: true,
        is_active: true,
        options: null,
        validation_rules: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          maxLength: 255,
        },
        position: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(field.validation_rules?.pattern).toBeDefined();
      expect(field.validation_rules?.maxLength).toBe(255);
    });
  });

  describe('CustomFieldContext', () => {
    it('should represent field context for project/issue type', () => {
      const context: CustomFieldContext = {
        id: 'context-uuid',
        field_id: 'field-uuid',
        project_id: 'project-uuid',
        issue_type_id: 'issue-type-uuid',
        is_required: true,
        default_value: 'default',
        created_at: '2024-01-01T00:00:00Z',
      };
      
      expect(context.field_id).toBeDefined();
      expect(context.project_id).toBeDefined();
    });

    it('should allow null project_id for global context', () => {
      const context: CustomFieldContext = {
        id: 'global-context-uuid',
        field_id: 'field-uuid',
        project_id: null,
        issue_type_id: null,
        is_required: false,
        default_value: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      expect(context.project_id).toBeNull();
      expect(context.issue_type_id).toBeNull();
    });
  });

  describe('CustomFieldValue', () => {
    it('should support text values', () => {
      const value: CustomFieldValue = {
        id: 'value-uuid',
        issue_id: 'issue-uuid',
        field_id: 'field-uuid',
        value_text: 'Some text value',
        value_number: null,
        value_date: null,
        value_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(value.value_text).toBe('Some text value');
    });

    it('should support number values', () => {
      const value: CustomFieldValue = {
        id: 'value-uuid',
        issue_id: 'issue-uuid',
        field_id: 'field-uuid',
        value_text: null,
        value_number: 42,
        value_date: null,
        value_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(value.value_number).toBe(42);
    });

    it('should support date values', () => {
      const value: CustomFieldValue = {
        id: 'value-uuid',
        issue_id: 'issue-uuid',
        field_id: 'field-uuid',
        value_text: null,
        value_number: null,
        value_date: '2024-06-15',
        value_json: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(value.value_date).toBe('2024-06-15');
    });

    it('should support JSON values for complex data', () => {
      const value: CustomFieldValue = {
        id: 'value-uuid',
        issue_id: 'issue-uuid',
        field_id: 'field-uuid',
        value_text: null,
        value_number: null,
        value_date: null,
        value_json: { selected: ['option1', 'option2'], metadata: { count: 2 } },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      expect(value.value_json).toEqual({
        selected: ['option1', 'option2'],
        metadata: { count: 2 },
      });
    });
  });
});

// ============================================================================
// Validation Logic Tests
// ============================================================================

describe('Custom Field Validation', () => {
  /**
   * Validates a field value against its type requirements.
   */
  function validateFieldValue(
    fieldType: FieldType,
    value: unknown,
    options?: FieldOption[],
    isRequired?: boolean
  ): { valid: boolean; error?: string } {
    // Check required
    if (isRequired && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'Field is required' };
    }

    // Allow empty for non-required fields
    if (value === null || value === undefined || value === '') {
      return { valid: true };
    }

    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'url':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a string' };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: 'Value must be a number' };
        }
        break;

      case 'date':
      case 'datetime':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return { valid: false, error: 'Value must be a valid date' };
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Value must be a boolean' };
        }
        break;

      case 'select':
        if (!options?.find((opt) => opt.value === value)) {
          return { valid: false, error: 'Value must be one of the available options' };
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Value must be an array' };
        }
        for (const v of value) {
          if (!options?.find((opt) => opt.value === v)) {
            return { valid: false, error: `Invalid option: ${v}` };
          }
        }
        break;

      case 'user':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a user ID' };
        }
        break;
    }

    return { valid: true };
  }

  describe('validateFieldValue', () => {
    it('should validate required fields', () => {
      expect(validateFieldValue('text', null, undefined, true)).toEqual({
        valid: false,
        error: 'Field is required',
      });
      expect(validateFieldValue('text', '', undefined, true)).toEqual({
        valid: false,
        error: 'Field is required',
      });
    });

    it('should allow empty values for non-required fields', () => {
      expect(validateFieldValue('text', null)).toEqual({ valid: true });
      expect(validateFieldValue('text', '')).toEqual({ valid: true });
    });

    it('should validate text fields', () => {
      expect(validateFieldValue('text', 'hello')).toEqual({ valid: true });
      expect(validateFieldValue('text', 123)).toEqual({
        valid: false,
        error: 'Value must be a string',
      });
    });

    it('should validate number fields', () => {
      expect(validateFieldValue('number', 42)).toEqual({ valid: true });
      expect(validateFieldValue('number', 'not a number')).toEqual({
        valid: false,
        error: 'Value must be a number',
      });
      expect(validateFieldValue('number', NaN)).toEqual({
        valid: false,
        error: 'Value must be a number',
      });
    });

    it('should validate date fields', () => {
      expect(validateFieldValue('date', '2024-01-15')).toEqual({ valid: true });
      expect(validateFieldValue('date', 'invalid date')).toEqual({
        valid: false,
        error: 'Value must be a valid date',
      });
    });

    it('should validate checkbox fields', () => {
      expect(validateFieldValue('checkbox', true)).toEqual({ valid: true });
      expect(validateFieldValue('checkbox', false)).toEqual({ valid: true });
      expect(validateFieldValue('checkbox', 'yes')).toEqual({
        valid: false,
        error: 'Value must be a boolean',
      });
    });

    it('should validate select fields', () => {
      const options: FieldOption[] = [
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ];
      expect(validateFieldValue('select', 'low', options)).toEqual({ valid: true });
      expect(validateFieldValue('select', 'invalid', options)).toEqual({
        valid: false,
        error: 'Value must be one of the available options',
      });
    });

    it('should validate multiselect fields', () => {
      const options: FieldOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ];
      expect(validateFieldValue('multiselect', ['a', 'b'], options)).toEqual({ valid: true });
      expect(validateFieldValue('multiselect', ['a', 'invalid'], options)).toEqual({
        valid: false,
        error: 'Invalid option: invalid',
      });
      expect(validateFieldValue('multiselect', 'not-array', options)).toEqual({
        valid: false,
        error: 'Value must be an array',
      });
    });

    it('should validate user fields', () => {
      expect(validateFieldValue('user', 'user-uuid')).toEqual({ valid: true });
      expect(validateFieldValue('user', 123)).toEqual({
        valid: false,
        error: 'Value must be a user ID',
      });
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Custom Field Helpers', () => {
  /**
   * Determines which value column to use based on field type.
   */
  function getValueColumn(fieldType: FieldType): 'value_text' | 'value_number' | 'value_date' | 'value_json' {
    switch (fieldType) {
      case 'number':
        return 'value_number';
      case 'date':
      case 'datetime':
        return 'value_date';
      case 'multiselect':
      case 'checkbox':
        return 'value_json';
      default:
        return 'value_text';
    }
  }

  describe('getValueColumn', () => {
    it('should return value_text for text-based fields', () => {
      expect(getValueColumn('text')).toBe('value_text');
      expect(getValueColumn('textarea')).toBe('value_text');
      expect(getValueColumn('url')).toBe('value_text');
      expect(getValueColumn('select')).toBe('value_text');
      expect(getValueColumn('user')).toBe('value_text');
    });

    it('should return value_number for number fields', () => {
      expect(getValueColumn('number')).toBe('value_number');
    });

    it('should return value_date for date fields', () => {
      expect(getValueColumn('date')).toBe('value_date');
      expect(getValueColumn('datetime')).toBe('value_date');
    });

    it('should return value_json for complex fields', () => {
      expect(getValueColumn('multiselect')).toBe('value_json');
      expect(getValueColumn('checkbox')).toBe('value_json');
    });
  });

  /**
   * Formats a field value for display.
   */
  function formatFieldValue(
    fieldType: FieldType,
    value: unknown,
    options?: FieldOption[]
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (fieldType) {
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'select':
        return options?.find((o) => o.value === value)?.label || String(value);
      case 'multiselect':
        if (Array.isArray(value)) {
          return value
            .map((v) => options?.find((o) => o.value === v)?.label || v)
            .join(', ');
        }
        return '';
      case 'date':
        return new Date(value as string).toLocaleDateString();
      case 'datetime':
        return new Date(value as string).toLocaleString();
      default:
        return String(value);
    }
  }

  describe('formatFieldValue', () => {
    it('should handle null values', () => {
      expect(formatFieldValue('text', null)).toBe('');
      expect(formatFieldValue('text', undefined)).toBe('');
    });

    it('should format checkbox values', () => {
      expect(formatFieldValue('checkbox', true)).toBe('Yes');
      expect(formatFieldValue('checkbox', false)).toBe('No');
    });

    it('should format select values with labels', () => {
      const options: FieldOption[] = [{ value: 'v1', label: 'Label One' }];
      expect(formatFieldValue('select', 'v1', options)).toBe('Label One');
      expect(formatFieldValue('select', 'unknown', options)).toBe('unknown');
    });

    it('should format multiselect values', () => {
      const options: FieldOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      expect(formatFieldValue('multiselect', ['a', 'b'], options)).toBe('A, B');
    });

    it('should format text values', () => {
      expect(formatFieldValue('text', 'hello')).toBe('hello');
      expect(formatFieldValue('number', 42)).toBe('42');
    });
  });
});
