import {
  IMPORT_TYPE,
  IMPORT_STATUS,
  VALIDATION_ERROR_TYPE,
  type ImportTypeValue,
  type ImportStatusType,
  type ValidationErrorTypeValue,
} from '@/lib/constants';

// Re-export constants for convenience
export { IMPORT_TYPE, IMPORT_STATUS, VALIDATION_ERROR_TYPE };

// Type aliases for backward compatibility
export type ImportType = ImportTypeValue;
export type ImportStatus = ImportStatusType;

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
}

export interface ValidationError {
  row: number;
  field: string;
  errorType: ValidationErrorTypeValue;
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

export interface FieldMetadata {
  label: string;
  jiraHeader: string;
  type: 'text' | 'number' | 'date' | 'email' | 'select';
  required: boolean;
  maxLength?: number;
  example: string;
  description: string;
  validValues?: string[];
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

// Enhanced field definitions with full metadata for format guide
export const ENHANCED_FIELD_DEFINITIONS = {
  issues: {
    required: ['summary', 'issue_type', 'project_key'] as const,
    optional: ['description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'] as const,
    all: ['summary', 'issue_type', 'project_key', 'description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'] as const,
    metadata: {
      summary: {
        label: 'Summary',
        jiraHeader: 'Summary',
        type: 'text' as const,
        required: true,
        maxLength: 255,
        example: 'User login fails with error 500',
        description: 'Brief title describing the issue. Keep it concise but descriptive.',
      },
      issue_type: {
        label: 'Issue Type',
        jiraHeader: 'Issue Type',
        type: 'select' as const,
        required: true,
        example: 'Bug',
        description: 'Type of issue. Must match an existing issue type in the system.',
        validValues: ['Bug', 'Story', 'Task', 'Epic', 'Sub-task'],
      },
      project_key: {
        label: 'Project Key',
        jiraHeader: 'Project key',
        type: 'text' as const,
        required: true,
        maxLength: 10,
        example: 'PROJ',
        description: 'The unique key of the project. Must already exist in the system.',
      },
      description: {
        label: 'Description',
        jiraHeader: 'Description',
        type: 'text' as const,
        required: false,
        example: 'When attempting to login, users receive a 500 error...',
        description: 'Detailed description of the issue. Supports plain text.',
      },
      priority: {
        label: 'Priority',
        jiraHeader: 'Priority',
        type: 'select' as const,
        required: false,
        example: 'High',
        description: 'Priority level of the issue.',
        validValues: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
      },
      status: {
        label: 'Status',
        jiraHeader: 'Status',
        type: 'select' as const,
        required: false,
        example: 'To Do',
        description: 'Current status of the issue. Must match a valid status.',
        validValues: ['To Do', 'In Progress', 'In Review', 'Done'],
      },
      assignee_email: {
        label: 'Assignee Email',
        jiraHeader: 'Assignee',
        type: 'email' as const,
        required: false,
        example: 'john.doe@company.com',
        description: 'Email of the user to assign the issue to. User must exist.',
      },
      reporter_email: {
        label: 'Reporter Email',
        jiraHeader: 'Reporter',
        type: 'email' as const,
        required: false,
        example: 'jane.smith@company.com',
        description: 'Email of the user who reported the issue.',
      },
      story_points: {
        label: 'Story Points',
        jiraHeader: 'Story Points',
        type: 'number' as const,
        required: false,
        example: '5',
        description: 'Estimated effort using story points (typically 1, 2, 3, 5, 8, 13).',
      },
      due_date: {
        label: 'Due Date',
        jiraHeader: 'Due Date',
        type: 'date' as const,
        required: false,
        example: '2025-01-15',
        description: 'Target completion date. Use ISO format (YYYY-MM-DD) or Jira format (DD/MMM/YY).',
      },
      labels: {
        label: 'Labels',
        jiraHeader: 'Labels',
        type: 'text' as const,
        required: false,
        example: 'bug,urgent,frontend',
        description: 'Comma-separated list of labels to apply to the issue.',
      },
      epic_key: {
        label: 'Epic Key',
        jiraHeader: 'Epic Link',
        type: 'text' as const,
        required: false,
        example: 'PROJ-100',
        description: 'Issue key of the parent epic (e.g., PROJ-100).',
      },
    },
  },
  projects: {
    required: ['name', 'key'] as const,
    optional: ['description', 'lead_email', 'project_type', 'template'] as const,
    all: ['name', 'key', 'description', 'lead_email', 'project_type', 'template'] as const,
    metadata: {
      name: {
        label: 'Project Name',
        jiraHeader: 'Project Name',
        type: 'text' as const,
        required: true,
        maxLength: 100,
        example: 'Customer Portal',
        description: 'Display name for the project.',
      },
      key: {
        label: 'Project Key',
        jiraHeader: 'Project Key',
        type: 'text' as const,
        required: true,
        maxLength: 10,
        example: 'CUST',
        description: 'Unique uppercase key (2-10 chars). Used in issue keys like CUST-123.',
      },
      description: {
        label: 'Description',
        jiraHeader: 'Description',
        type: 'text' as const,
        required: false,
        example: 'Customer-facing web portal for order management',
        description: 'Brief description of the project purpose and scope.',
      },
      lead_email: {
        label: 'Lead Email',
        jiraHeader: 'Lead',
        type: 'email' as const,
        required: false,
        example: 'admin@company.com',
        description: 'Email of the project lead. User must exist in the system.',
      },
      project_type: {
        label: 'Project Type',
        jiraHeader: 'Project Type',
        type: 'select' as const,
        required: false,
        example: 'software',
        description: 'Type of project.',
        validValues: ['software', 'business'],
      },
      template: {
        label: 'Template',
        jiraHeader: 'Template',
        type: 'select' as const,
        required: false,
        example: 'scrum',
        description: 'Project template to use for board configuration.',
        validValues: ['scrum', 'kanban', 'basic'],
      },
    },
  },
  users: {
    required: ['email'] as const,
    optional: ['display_name', 'department', 'job_title', 'location'] as const,
    all: ['email', 'display_name', 'department', 'job_title', 'location'] as const,
    metadata: {
      email: {
        label: 'Email',
        jiraHeader: 'Email',
        type: 'email' as const,
        required: true,
        example: 'john.doe@company.com',
        description: 'User email address. Must be unique and valid format.',
      },
      display_name: {
        label: 'Display Name',
        jiraHeader: 'Display Name',
        type: 'text' as const,
        required: false,
        maxLength: 100,
        example: 'John Doe',
        description: 'Full name as shown in the UI.',
      },
      department: {
        label: 'Department',
        jiraHeader: 'Department',
        type: 'text' as const,
        required: false,
        maxLength: 100,
        example: 'Engineering',
        description: 'User department or team.',
      },
      job_title: {
        label: 'Job Title',
        jiraHeader: 'Job Title',
        type: 'text' as const,
        required: false,
        maxLength: 100,
        example: 'Senior Developer',
        description: 'User job title or role.',
      },
      location: {
        label: 'Location',
        jiraHeader: 'Location',
        type: 'text' as const,
        required: false,
        maxLength: 100,
        example: 'New York',
        description: 'User office location or city.',
      },
    },
  },
} as const;
