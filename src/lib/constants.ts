/**
 * @fileoverview Centralized constants for the application.
 * @module lib/constants
 * 
 * @description
 * This module contains all shared constants, enums, and magic literals
 * to ensure consistency across the codebase and satisfy SonarCloud rules.
 * 
 * @example
 * ```typescript
 * import { EXPORT_STATUS, TEAM_ROLE, RATE_LIMITS } from '@/lib/constants';
 * 
 * if (job.status === EXPORT_STATUS.COMPLETED) { ... }
 * if (member.role === TEAM_ROLE.LEAD) { ... }
 * ```
 */

// ============================================================================
// Status Constants
// ============================================================================

/**
 * Export job status values.
 */
export const EXPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ExportStatusType = typeof EXPORT_STATUS[keyof typeof EXPORT_STATUS];

/**
 * Import job status values.
 */
export const IMPORT_STATUS = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  VALIDATED: 'validated',
  IMPORTING: 'importing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type ImportStatusType = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS];

/**
 * Build status values for CI/CD.
 */
export const BUILD_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELED: 'canceled',
} as const;

export type BuildStatusType = typeof BUILD_STATUS[keyof typeof BUILD_STATUS];

/**
 * Deployment status values.
 */
export const DEPLOYMENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back',
} as const;

export type DeploymentStatusType = typeof DEPLOYMENT_STATUS[keyof typeof DEPLOYMENT_STATUS];

/**
 * Pull request status values.
 */
export const PULL_REQUEST_STATUS = {
  OPEN: 'open',
  MERGED: 'merged',
  DECLINED: 'declined',
  CLOSED: 'closed',
} as const;

export type PullRequestStatusType = typeof PULL_REQUEST_STATUS[keyof typeof PULL_REQUEST_STATUS];

// ============================================================================
// Role Constants
// ============================================================================

/**
 * Team member role values.
 */
export const TEAM_ROLE = {
  LEAD: 'lead',
  MEMBER: 'member',
} as const;

export type TeamRoleType = typeof TEAM_ROLE[keyof typeof TEAM_ROLE];

/**
 * Application role values.
 */
export const APP_ROLE = {
  ADMIN: 'admin',
  PROJECT_ADMIN: 'project_admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
} as const;

export type AppRoleType = typeof APP_ROLE[keyof typeof APP_ROLE];

// ============================================================================
// Git Provider Constants
// ============================================================================

/**
 * Git provider type values.
 */
export const GIT_PROVIDER = {
  GITLAB: 'gitlab',
  GITHUB: 'github',
  BITBUCKET: 'bitbucket',
} as const;

export type GitProviderType = typeof GIT_PROVIDER[keyof typeof GIT_PROVIDER];

/**
 * Deployment environment values.
 */
export const DEPLOYMENT_ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TESTING: 'testing',
  OTHER: 'other',
} as const;

export type DeploymentEnvironmentType = typeof DEPLOYMENT_ENVIRONMENT[keyof typeof DEPLOYMENT_ENVIRONMENT];

// ============================================================================
// Project Constants
// ============================================================================

/**
 * Project template values.
 */
export const PROJECT_TEMPLATE = {
  SCRUM: 'scrum',
  KANBAN: 'kanban',
  BASIC: 'basic',
  PROJECT_MANAGEMENT: 'project_management',
  TASK_MANAGEMENT: 'task_management',
  PROCESS_MANAGEMENT: 'process_management',
} as const;

export type ProjectTemplateType = typeof PROJECT_TEMPLATE[keyof typeof PROJECT_TEMPLATE];

/**
 * Project type values.
 */
export const PROJECT_TYPE = {
  SOFTWARE: 'software',
  BUSINESS: 'business',
} as const;

export type ProjectTypeValue = typeof PROJECT_TYPE[keyof typeof PROJECT_TYPE];

/**
 * Board type values.
 */
export const BOARD_TYPE = {
  SCRUM: 'scrum',
  KANBAN: 'kanban',
} as const;

export type BoardTypeValue = typeof BOARD_TYPE[keyof typeof BOARD_TYPE];

// ============================================================================
// Classification Constants
// ============================================================================

/**
 * Classification level values.
 */
export const CLASSIFICATION_LEVEL = {
  PUBLIC: 'public',
  RESTRICTED: 'restricted',
  CONFIDENTIAL: 'confidential',
  EXPORT_CONTROLLED: 'export_controlled',
} as const;

export type ClassificationLevelType = typeof CLASSIFICATION_LEVEL[keyof typeof CLASSIFICATION_LEVEL];

// ============================================================================
// Sprint & Workflow Constants
// ============================================================================

/**
 * Sprint state values.
 */
export const SPRINT_STATE = {
  FUTURE: 'future',
  ACTIVE: 'active',
  CLOSED: 'closed',
} as const;

export type SprintStateType = typeof SPRINT_STATE[keyof typeof SPRINT_STATE];

/**
 * Status category values for workflow.
 */
export const STATUS_CATEGORY = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type StatusCategoryType = typeof STATUS_CATEGORY[keyof typeof STATUS_CATEGORY];

/**
 * Issue type category values.
 */
export const ISSUE_TYPE_CATEGORY = {
  STANDARD: 'standard',
  SUBTASK: 'subtask',
  EPIC: 'epic',
} as const;

export type IssueTypeCategoryType = typeof ISSUE_TYPE_CATEGORY[keyof typeof ISSUE_TYPE_CATEGORY];

// ============================================================================
// Import Type Constants
// ============================================================================

/**
 * Import type values.
 */
export const IMPORT_TYPE = {
  ISSUES: 'issues',
  PROJECTS: 'projects',
  USERS: 'users',
} as const;

export type ImportTypeValue = typeof IMPORT_TYPE[keyof typeof IMPORT_TYPE];

/**
 * Validation error type values.
 */
export const VALIDATION_ERROR_TYPE = {
  VALIDATION: 'validation',
  MAPPING: 'mapping',
  DUPLICATE: 'duplicate',
  REFERENCE: 'reference',
  SYSTEM: 'system',
} as const;

export type ValidationErrorTypeValue = typeof VALIDATION_ERROR_TYPE[keyof typeof VALIDATION_ERROR_TYPE];

// ============================================================================
// Smart Commit Constants
// ============================================================================

/**
 * Smart commit action type values.
 */
export const SMART_COMMIT_ACTION = {
  COMMENT: 'comment',
  TIME: 'time',
  TRANSITION: 'transition',
} as const;

export type SmartCommitActionType = typeof SMART_COMMIT_ACTION[keyof typeof SMART_COMMIT_ACTION];

// ============================================================================
// Rate Limit Constants
// ============================================================================

/**
 * Rate limit configurations per endpoint type.
 * These values are enforced on the server side.
 */
export const RATE_LIMITS = {
  /** Login attempts: Strict limit to prevent brute force */
  'auth/login': { maxRequests: 10, windowMinutes: 1, description: 'Login attempts' },
  /** Signup attempts: Prevent mass account creation */
  'auth/signup': { maxRequests: 5, windowMinutes: 1, description: 'Signup attempts' },
  /** Password reset: Prevent email spam */
  'auth/reset': { maxRequests: 3, windowMinutes: 1, description: 'Password reset' },
  /** Read operations: Higher limit for data fetching */
  'api/read': { maxRequests: 200, windowMinutes: 1, description: 'Read operations' },
  /** List operations: Moderate limit for bulk reads */
  'api/list': { maxRequests: 100, windowMinutes: 1, description: 'List operations' },
  /** Write operations: Lower limit to prevent spam */
  'api/write': { maxRequests: 60, windowMinutes: 1, description: 'Write operations' },
  /** Update operations: Same as write */
  'api/update': { maxRequests: 60, windowMinutes: 1, description: 'Update operations' },
  /** Delete operations: Lowest limit for destructive actions */
  'api/delete': { maxRequests: 30, windowMinutes: 1, description: 'Delete operations' },
  /** File uploads: Limited due to resource intensity */
  'api/upload': { maxRequests: 20, windowMinutes: 1, description: 'File uploads' },
  /** Search queries: Moderate limit for database-intensive operations */
  'api/search': { maxRequests: 50, windowMinutes: 1, description: 'Search queries' },
  /** Default fallback limit */
  'default': { maxRequests: 100, windowMinutes: 1, description: 'Default limit' },
} as const;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

// ============================================================================
// Numeric Constants
// ============================================================================

/**
 * Polling interval constants in milliseconds.
 */
export const POLLING_INTERVALS = {
  /** Fast polling for real-time updates */
  FAST: 1000,
  /** Standard polling for status updates */
  STANDARD: 3000,
  /** Slow polling for background tasks */
  SLOW: 10000,
  /** Very slow polling for long-running tasks */
  BACKGROUND: 30000,
} as const;

/**
 * Default pagination values.
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Timeout constants in milliseconds.
 */
export const TIMEOUTS = {
  /** Short timeout for quick operations */
  SHORT: 5000,
  /** Standard timeout for API calls */
  STANDARD: 10000,
  /** Long timeout for complex operations */
  LONG: 30000,
  /** Very long timeout for file uploads */
  UPLOAD: 60000,
} as const;

/**
 * Debounce delay constants in milliseconds.
 */
export const DEBOUNCE_DELAYS = {
  /** Fast debounce for real-time search */
  FAST: 150,
  /** Standard debounce for input fields */
  STANDARD: 300,
  /** Slow debounce for expensive operations */
  SLOW: 500,
} as const;

/**
 * Window duration constants in minutes for rate limiting.
 */
export const WINDOW_MINUTES = {
  ONE: 1,
  FIVE: 5,
  FIFTEEN: 15,
  SIXTY: 60,
} as const;

/**
 * Fallback rate limit values for error scenarios.
 */
export const FALLBACK_RATE_LIMIT = {
  REMAINING: 100,
  LIMIT: 100,
  WINDOW_MS: 60000,
} as const;

// ============================================================================
// Export Format Constants
// ============================================================================

/**
 * Export format values.
 */
export const EXPORT_FORMAT = {
  PDF: 'pdf',
  XLSX: 'xlsx',
  DOCX: 'docx',
  HTML: 'html',
  CSV: 'csv',
  JSON: 'json',
} as const;

export type ExportFormatType = typeof EXPORT_FORMAT[keyof typeof EXPORT_FORMAT];

// ============================================================================
// Action Type Constants (for automation/webhooks)
// ============================================================================

/**
 * CSV import action values.
 */
export const CSV_IMPORT_ACTION = {
  VALIDATE: 'validate',
  IMPORT: 'import',
  GET_STATUS: 'get-status',
} as const;

export type CsvImportActionType = typeof CSV_IMPORT_ACTION[keyof typeof CSV_IMPORT_ACTION];

/**
 * LDAP sync action values.
 */
export const LDAP_SYNC_ACTION = {
  TEST_CONNECTION: 'test_connection',
  SYNC_GROUPS: 'sync_groups',
  PROCESS_WEBHOOK: 'process_webhook',
  GET_SYNC_STATUS: 'get_sync_status',
} as const;

export type LdapSyncActionType = typeof LDAP_SYNC_ACTION[keyof typeof LDAP_SYNC_ACTION];

/**
 * Git sync action values.
 */
export const GIT_SYNC_ACTION = {
  SYNC: 'sync',
  SYNC_ALL: 'sync_all',
  GET_STATUS: 'get_status',
} as const;

export type GitSyncActionType = typeof GIT_SYNC_ACTION[keyof typeof GIT_SYNC_ACTION];
