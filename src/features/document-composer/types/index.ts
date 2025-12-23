// Document Composer types

import { EXPORT_STATUS, type ExportStatusType } from '@/lib/constants';

export type ExportFormat = 'pdf' | 'xlsx' | 'docx' | 'html' | 'csv' | 'json';

// Re-export status constants for convenience
export { EXPORT_STATUS };
export type { ExportStatusType };

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  schema: TemplateSchema;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_default?: boolean;
}

export interface TemplateSchema {
  header?: TemplateHeader;
  sections: TemplateSection[];
  footer?: TemplateFooter;
  watermark?: WatermarkConfig;
}

export interface TemplateHeader {
  title: string;
  subtitle?: string;
  logo?: boolean;
  classification?: boolean;
}

export interface TemplateSection {
  id?: string;
  name: string;
  type: 'fields' | 'timeline' | 'comments' | 'attachments' | 'linked-items' | 'custom';
  fields?: string[];
  condition?: SectionCondition;
}

export interface SectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'exists';
  value?: string;
}

export interface TemplateFooter {
  showDate?: boolean;
  showPageNumbers?: boolean;
  customText?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  useClassification?: boolean;
  opacity?: number;
}

export interface ExportRequest {
  issueIds: string[];
  templateId?: string;
  format: ExportFormat;
  includeAttachments?: boolean;
  includeComments?: boolean;
  includeHistory?: boolean;
}

export interface ExportJob {
  id: string;
  name?: string;
  template_id?: string;
  template_name?: string;
  status: ExportStatusType;
  format: ExportFormat;
  issue_ids?: string[];
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

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF Document',
  xlsx: 'Excel Spreadsheet',
  docx: 'Word Document',
  html: 'HTML Document',
  csv: 'CSV File',
  json: 'JSON File',
};

export const FORMAT_ICONS: Record<ExportFormat, string> = {
  pdf: 'FileText',
  xlsx: 'Table',
  docx: 'FileType',
  html: 'Code',
  csv: 'Table',
  json: 'FileText',
};
