export type ImportType = 'issues' | 'projects' | 'users';
export type ImportStatus = 'pending' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed' | 'cancelled';

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
}

export interface ValidationError {
  row: number;
  field: string;
  errorType: 'validation' | 'mapping' | 'duplicate' | 'reference' | 'system';
  message: string;
  originalValue?: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  preview: Record<string, unknown>[];
  headers: string[];
}

export interface ImportJob {
  id: string;
  user_id: string;
  import_type: ImportType;
  status: ImportStatus;
  source_format: string;
  file_name: string | null;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  field_mappings: Record<string, string>;
  validation_errors: ValidationError[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportError {
  id: string;
  job_id: string;
  row_number: number;
  field_name: string | null;
  error_type: string;
  error_message: string;
  original_value: string | null;
  created_at: string;
}

export const FIELD_DEFINITIONS = {
  issues: {
    required: ['summary', 'issue_type', 'project_key'],
    optional: ['description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'],
    all: ['summary', 'issue_type', 'project_key', 'description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'],
    labels: {
      summary: 'Summary',
      issue_type: 'Issue Type',
      project_key: 'Project Key',
      description: 'Description',
      priority: 'Priority',
      status: 'Status',
      assignee_email: 'Assignee Email',
      reporter_email: 'Reporter Email',
      story_points: 'Story Points',
      due_date: 'Due Date',
      labels: 'Labels',
      epic_key: 'Epic Key'
    }
  },
  projects: {
    required: ['name', 'key'],
    optional: ['description', 'lead_email', 'project_type', 'template'],
    all: ['name', 'key', 'description', 'lead_email', 'project_type', 'template'],
    labels: {
      name: 'Project Name',
      key: 'Project Key',
      description: 'Description',
      lead_email: 'Lead Email',
      project_type: 'Project Type',
      template: 'Template'
    }
  },
  users: {
    required: ['email'],
    optional: ['display_name', 'department', 'job_title', 'location'],
    all: ['email', 'display_name', 'department', 'job_title', 'location'],
    labels: {
      email: 'Email',
      display_name: 'Display Name',
      department: 'Department',
      job_title: 'Job Title',
      location: 'Location'
    }
  }
} as const;
