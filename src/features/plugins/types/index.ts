// Plugin types and registry definitions
// Open for extension - new plugins can be registered without modifying core

// Known plugin keys - use string type directly for extensibility
// Specific keys are documented here for reference:
// - 'com.jira.core', 'com.jira.agile', 'com.jira.workflow'
// - 'com.jira.automation', 'com.jira.customfields', 'com.jira.reports'
// - 'com.jira.admin', 'com.app.document-composer'
// - 'com.app.structured-data-blocks', 'com.app.guided-operations'

export interface Plugin {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly version: string;
  readonly vendor: string | null;
  readonly vendor_url: string | null;
  readonly documentation_url: string | null;
  readonly icon_url: string | null;
  readonly category: string;
  readonly is_system: boolean;
  readonly is_enabled: boolean;
  readonly config?: Record<string, unknown>;
  readonly hooks?: string[];
  readonly permissions?: string[];
}

// Feature-to-Plugin mapping
// Maps feature identifiers to the plugin keys that provide them
export const FEATURE_PLUGIN_MAP: Record<string, string[]> = {
  // Core features
  'issues': ['com.jira.core'],
  'projects': ['com.jira.core'],
  
  // Agile features
  'boards': ['com.jira.agile'],
  'sprints': ['com.jira.agile'],
  'backlog': ['com.jira.agile'],
  'scrum': ['com.jira.agile'],
  'kanban': ['com.jira.agile'],
  
  // Workflow features
  'workflows': ['com.jira.workflow'],
  'workflow-designer': ['com.jira.workflow'],
  'transitions': ['com.jira.workflow'],
  
  // Automation features
  'automation': ['com.jira.automation'],
  'automation-rules': ['com.jira.automation'],
  
  // Custom fields
  'custom-fields': ['com.jira.customfields'],
  
  // Reports
  'reports': ['com.jira.reports'],
  'burndown': ['com.jira.reports'],
  'velocity': ['com.jira.reports'],
  'cumulative-flow': ['com.jira.reports'],
  
  // Admin
  'admin': ['com.jira.admin'],
  'ldap': ['com.jira.admin'],
  'migration': ['com.jira.admin'],
  
  // Document Composer plugin features
  'document-composer': ['com.app.document-composer'],
  'export-pdf': ['com.app.document-composer'],
  'export-excel': ['com.app.document-composer'],
  'export-word': ['com.app.document-composer'],
  'document-templates': ['com.app.document-composer'],
  
  // Structured Data Blocks plugin features
  'structured-data-blocks': ['com.app.structured-data-blocks'],
  'data-matrix': ['com.app.structured-data-blocks'],
  'schema-editor': ['com.app.structured-data-blocks'],
  
  // Guided Operations plugin features
  'guided-operations': ['com.app.guided-operations'],
  'bulk-actions': ['com.app.guided-operations'],
  'approval-flows': ['com.app.guided-operations'],
  'guided-workflows': ['com.app.guided-operations'],
};

// Plugin categories
export const PLUGIN_CATEGORIES = {
  core: 'Core',
  agile: 'Agile & Boards',
  workflow: 'Workflow',
  automation: 'Automation',
  reports: 'Reports',
  admin: 'Administration',
  integration: 'Integrations',
  export: 'Export & Documents',
  data: 'Data Management',
  operations: 'Operations',
  other: 'Other',
} as const;

export type PluginCategory = keyof typeof PLUGIN_CATEGORIES;
