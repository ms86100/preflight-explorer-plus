import { ImportType, ENHANCED_FIELD_DEFINITIONS } from '../types';

interface TemplateConfig {
  headers: string[];
  jiraHeaders: string[];
  sampleRows: string[][];
}

const TEMPLATE_CONFIGS: Record<ImportType, TemplateConfig> = {
  issues: {
    headers: ['summary', 'issue_type', 'project_key', 'description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'],
    jiraHeaders: ['Summary', 'Issue Type', 'Project key', 'Description', 'Priority', 'Status', 'Assignee', 'Reporter', 'Story Points', 'Due Date', 'Labels', 'Epic Link'],
    sampleRows: [
      ['User login fails with error 500', 'Bug', 'PROJ', 'When attempting to login, users receive a 500 error. Steps to reproduce: 1. Go to login page 2. Enter credentials 3. Click submit', 'High', 'To Do', 'john.doe@company.com', 'jane.smith@company.com', '3', '2025-01-15', 'bug,urgent', 'PROJ-100'],
      ['Implement password reset flow', 'Story', 'PROJ', 'As a user, I want to reset my password so I can regain access to my account', 'Medium', 'In Progress', 'alice.jones@company.com', 'bob.wilson@company.com', '5', '2025-01-20', 'feature,auth', ''],
      ['Update API documentation', 'Task', 'PROJ', 'Review and update all API endpoint documentation to reflect recent changes', 'Low', 'To Do', '', 'jane.smith@company.com', '2', '2025-02-01', 'documentation', ''],
    ]
  },
  projects: {
    headers: ['name', 'key', 'description', 'lead_email', 'project_type', 'template'],
    jiraHeaders: ['Project Name', 'Project Key', 'Description', 'Lead', 'Project Type', 'Template'],
    sampleRows: [
      ['Customer Portal', 'CUST', 'Customer-facing web portal for order management and support', 'admin@company.com', 'software', 'scrum'],
      ['Internal Tools', 'INTL', 'Internal tooling and automation projects', 'devops@company.com', 'software', 'kanban'],
      ['Marketing Website', 'MKTG', 'Company marketing website redesign project', 'marketing@company.com', 'business', 'basic'],
    ]
  },
  users: {
    headers: ['email', 'display_name', 'department', 'job_title', 'location'],
    jiraHeaders: ['Email', 'Display Name', 'Department', 'Job Title', 'Location'],
    sampleRows: [
      ['john.doe@company.com', 'John Doe', 'Engineering', 'Senior Developer', 'New York'],
      ['jane.smith@company.com', 'Jane Smith', 'Engineering', 'Tech Lead', 'San Francisco'],
      ['bob.wilson@company.com', 'Bob Wilson', 'Product', 'Product Manager', 'Chicago'],
    ]
  }
};

// Jira DC header mappings for auto-detection
export const JIRA_HEADER_MAPPINGS: Record<string, string> = {
  // Issues
  'Summary': 'summary',
  'Issue Type': 'issue_type',
  'Issue key': 'issue_key', // Not imported but recognized
  'Project key': 'project_key',
  'Project': 'project_key',
  'Description': 'description',
  'Priority': 'priority',
  'Status': 'status',
  'Assignee': 'assignee_email',
  'Reporter': 'reporter_email',
  'Story Points': 'story_points',
  'Story points': 'story_points',
  'Due Date': 'due_date',
  'Due date': 'due_date',
  'Labels': 'labels',
  'Epic Link': 'epic_key',
  'Epic Name': 'epic_key',
  'Parent': 'epic_key',
  
  // Projects
  'Project Name': 'name',
  'Project Key': 'key',
  'Lead': 'lead_email',
  'Project Lead': 'lead_email',
  'Project Type': 'project_type',
  'Template': 'template',
  
  // Users
  'Email': 'email',
  'Email Address': 'email',
  'Display Name': 'display_name',
  'Full Name': 'display_name',
  'Name': 'display_name',
  'Department': 'department',
  'Job Title': 'job_title',
  'Title': 'job_title',
  'Location': 'location',
  'Office': 'location',
};

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.split('"').join('""')}"`;
  }
  return field;
}

function generateCSVContent(config: TemplateConfig, useJiraHeaders: boolean = false): string {
  const headers = useJiraHeaders ? config.jiraHeaders : config.headers;
  const headerRow = headers.map(escapeCSVField).join(',');
  const dataRows = config.sampleRows.map(row => 
    row.map(escapeCSVField).join(',')
  ).join('\n');
  
  return `${headerRow}\n${dataRows}`;
}

export function generateTemplate(importType: ImportType, useJiraHeaders: boolean = false): string {
  const config = TEMPLATE_CONFIGS[importType];
  if (!config) {
    throw new Error(`Unknown import type: ${importType}`);
  }
  return generateCSVContent(config, useJiraHeaders);
}

export function generateEmptyTemplate(importType: ImportType, useJiraHeaders: boolean = false): string {
  const config = TEMPLATE_CONFIGS[importType];
  if (!config) {
    throw new Error(`Unknown import type: ${importType}`);
  }
  const headers = useJiraHeaders ? config.jiraHeaders : config.headers;
  return headers.map(escapeCSVField).join(',');
}

export function downloadTemplate(importType: ImportType, includeExamples: boolean = true, useJiraHeaders: boolean = false): void {
  const content = includeExamples 
    ? generateTemplate(importType, useJiraHeaders)
    : generateEmptyTemplate(importType, useJiraHeaders);
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const suffix = useJiraHeaders ? '_jira_format' : '';
  const exampleSuffix = includeExamples ? '_with_examples' : '_empty';
  link.href = url;
  link.download = `${importType}_template${suffix}${exampleSuffix}.csv`;
  
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function autoMapHeaders(csvHeaders: string[], importType: ImportType): Record<string, string> {
  const fieldDefs = ENHANCED_FIELD_DEFINITIONS[importType];
  const mappings: Record<string, string> = {};
  const allFields = fieldDefs.all as readonly string[];
  
  csvHeaders.forEach(csvHeader => {
    const normalizedHeader = csvHeader.trim();
    
    // Check exact match with Jira headers
    if (JIRA_HEADER_MAPPINGS[normalizedHeader]) {
      const targetField = JIRA_HEADER_MAPPINGS[normalizedHeader];
      if (allFields.includes(targetField)) {
        mappings[normalizedHeader] = targetField;
        return;
      }
    }
    
    // Check exact match with our field names
    const lowerHeader = normalizedHeader.toLowerCase().split(/[^a-z0-9]/).join('_');
    if (allFields.includes(lowerHeader)) {
      mappings[normalizedHeader] = lowerHeader;
      return;
    }
    
    // Check fuzzy match with field labels
    const metadata = fieldDefs.metadata as Record<string, { label: string }>;
    for (const [fieldKey, fieldMeta] of Object.entries(metadata)) {
      const labelNormalized = fieldMeta.label.toLowerCase().split(/[^a-z0-9]/).join('_');
      if (lowerHeader === labelNormalized || lowerHeader.includes(labelNormalized) || labelNormalized.includes(lowerHeader)) {
        mappings[normalizedHeader] = fieldKey;
        return;
      }
    }
  });
  
  return mappings;
}

export function getTemplateConfigs(): Record<ImportType, TemplateConfig> {
  return TEMPLATE_CONFIGS;
}
