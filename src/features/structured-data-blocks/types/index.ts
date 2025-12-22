// Structured Data Blocks types

export type ColumnType = 'string' | 'number' | 'boolean' | 'enum' | 'reference' | 'date';

export interface ColumnDefinition {
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
  version: string;
  columns: ColumnDefinition[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DataBlockInstance {
  id: string;
  schema_id: string;
  issue_id: string;
  rows: DataRow[];
  created_at: string;
  updated_at: string;
}

export interface DataRow {
  id: string;
  values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string;
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
