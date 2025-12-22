// Document Composer types

export type ExportFormat = 'pdf' | 'xlsx' | 'docx';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  format: ExportFormat;
  schema: TemplateSchema;
  created_at: string;
  updated_at: string;
  created_by: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: ExportFormat;
  issueCount: number;
  progress: number;
  fileUrl?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF Document',
  xlsx: 'Excel Spreadsheet',
  docx: 'Word Document',
};

export const FORMAT_ICONS: Record<ExportFormat, string> = {
  pdf: 'FileText',
  xlsx: 'Table',
  docx: 'FileType',
};
