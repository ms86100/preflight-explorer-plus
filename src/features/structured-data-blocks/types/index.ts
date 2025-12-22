// Structured Data Blocks types

export type ColumnType = 'string' | 'number' | 'boolean' | 'enum' | 'reference' | 'date';

export interface ColumnDefinition {
  id?: string;
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[]; // For enum type
  referenceType?: string; // For reference type (e.g., 'issue', 'user')
  defaultValue?: unknown;
  description?: string;
}

export interface DataBlockSchema {
  id: string;
  name: string;
  description?: string;
  version: number;
  columns: ColumnDefinition[];
  validation_rules?: Record<string, unknown>;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DataBlockInstance {
  id: string;
  schema_id: string;
  schema_name?: string;
  name?: string;
  issue_id?: string;
  project_id?: string;
  rows: DataRow[];
  created_at: string;
  updated_at: string;
}

export interface DataRow {
  id: string;
  values: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ValidationError {
  rowId: string;
  columnKey: string;
  message: string;
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  string: 'Text',
  number: 'Number',
  boolean: 'Yes/No',
  enum: 'Select',
  reference: 'Reference',
  date: 'Date',
};
