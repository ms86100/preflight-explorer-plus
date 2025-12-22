/**
 * @fileoverview Shared validation utilities for Edge Functions
 * @module _shared/validation
 * 
 * Provides Zod schemas and validation helpers for input sanitization
 * across all edge functions.
 */

// Note: Using inline Zod-like validation since Deno edge functions
// need to minimize dependencies for cold start performance

// ============================================================================
// Constants
// ============================================================================

export const INPUT_LIMITS = {
  SHORT_TEXT: 100,
  MEDIUM_TEXT: 500,
  LONG_TEXT: 10000,
  EMAIL: 255,
  URL: 2048,
  UUID: 36,
  PROJECT_KEY: 10,
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates UUID format
 */
export function isValidUuid(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates email format
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > INPUT_LIMITS.EMAIL) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validates URL format with safe protocols
 */
export function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > INPUT_LIMITS.URL) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates string length
 */
export function isWithinLength(value: unknown, maxLength: number): boolean {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * Validates that value is one of allowed values
 */
export function isOneOf<T>(value: unknown, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Sanitizes string input by removing dangerous patterns
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\0/g, '')
    .trim();
}

/**
 * Validates project key format (uppercase letters and numbers)
 */
export function isValidProjectKey(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > INPUT_LIMITS.PROJECT_KEY) return false;
  return /^[A-Z][A-Z0-9]*$/.test(value);
}

// ============================================================================
// Schema Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// ============================================================================
// Schema Validators
// ============================================================================

/**
 * Validates git-api request
 */
export function validateGitApiRequest(body: unknown): ValidationResult<{
  organization_id?: string;
  project_id?: string;
  repository_id?: string;
  issue_id?: string;
  owner?: string;
  repo?: string;
  title?: string;
  body?: string;
  source_branch?: string;
  target_branch?: string;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate UUIDs if present
  if (data.organization_id !== undefined && !isValidUuid(data.organization_id)) {
    errors.push({ field: 'organization_id', message: 'Invalid UUID format' });
  }
  if (data.project_id !== undefined && !isValidUuid(data.project_id)) {
    errors.push({ field: 'project_id', message: 'Invalid UUID format' });
  }
  if (data.repository_id !== undefined && !isValidUuid(data.repository_id)) {
    errors.push({ field: 'repository_id', message: 'Invalid UUID format' });
  }
  if (data.issue_id !== undefined && !isValidUuid(data.issue_id)) {
    errors.push({ field: 'issue_id', message: 'Invalid UUID format' });
  }

  // Validate strings with length limits
  if (data.owner !== undefined && !isWithinLength(data.owner, INPUT_LIMITS.SHORT_TEXT)) {
    errors.push({ field: 'owner', message: 'Owner exceeds maximum length' });
  }
  if (data.repo !== undefined && !isWithinLength(data.repo, INPUT_LIMITS.SHORT_TEXT)) {
    errors.push({ field: 'repo', message: 'Repo exceeds maximum length' });
  }
  if (data.title !== undefined && !isWithinLength(data.title, INPUT_LIMITS.MEDIUM_TEXT)) {
    errors.push({ field: 'title', message: 'Title exceeds maximum length' });
  }
  if (data.body !== undefined && !isWithinLength(data.body, INPUT_LIMITS.LONG_TEXT)) {
    errors.push({ field: 'body', message: 'Body exceeds maximum length' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      organization_id: data.organization_id as string | undefined,
      project_id: data.project_id as string | undefined,
      repository_id: data.repository_id as string | undefined,
      issue_id: data.issue_id as string | undefined,
      owner: sanitizeString(data.owner),
      repo: sanitizeString(data.repo),
      title: sanitizeString(data.title),
      body: sanitizeString(data.body),
      source_branch: sanitizeString(data.source_branch),
      target_branch: sanitizeString(data.target_branch),
    }
  };
}

/**
 * Validates CSV import request
 */
export function validateCsvImportRequest(body: unknown): ValidationResult<{
  action: 'validate' | 'import' | 'get-status';
  jobId?: string;
  importType?: 'issues' | 'projects' | 'users';
  csvData?: string;
  fieldMappings?: Record<string, string>;
  projectId?: string;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate action
  const validActions = ['validate', 'import', 'get-status'] as const;
  if (!isOneOf(data.action, validActions)) {
    errors.push({ field: 'action', message: 'Action must be one of: validate, import, get-status' });
  }

  // Validate jobId if present
  if (data.jobId !== undefined && !isValidUuid(data.jobId)) {
    errors.push({ field: 'jobId', message: 'Invalid UUID format' });
  }

  // Validate importType if present
  const validImportTypes = ['issues', 'projects', 'users'] as const;
  if (data.importType !== undefined && !isOneOf(data.importType, validImportTypes)) {
    errors.push({ field: 'importType', message: 'Import type must be one of: issues, projects, users' });
  }

  // Validate projectId if present
  if (data.projectId !== undefined && !isValidUuid(data.projectId)) {
    errors.push({ field: 'projectId', message: 'Invalid UUID format' });
  }

  // Validate csvData length
  if (data.csvData !== undefined && typeof data.csvData === 'string' && data.csvData.length > 10 * 1024 * 1024) {
    errors.push({ field: 'csvData', message: 'CSV data exceeds 10MB limit' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      action: data.action as 'validate' | 'import' | 'get-status',
      jobId: data.jobId as string | undefined,
      importType: data.importType as 'issues' | 'projects' | 'users' | undefined,
      csvData: data.csvData as string | undefined,
      fieldMappings: data.fieldMappings as Record<string, string> | undefined,
      projectId: data.projectId as string | undefined,
    }
  };
}

/**
 * Validates LDAP sync request
 */
export function validateLdapSyncRequest(body: unknown): ValidationResult<{
  action: 'test_connection' | 'sync_groups' | 'process_webhook' | 'get_sync_status';
  config_id?: string;
  ldap_data?: unknown;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate action
  const validActions = ['test_connection', 'sync_groups', 'process_webhook', 'get_sync_status'] as const;
  if (!isOneOf(data.action, validActions)) {
    errors.push({ field: 'action', message: 'Invalid action' });
  }

  // Validate config_id if present
  if (data.config_id !== undefined && !isValidUuid(data.config_id)) {
    errors.push({ field: 'config_id', message: 'Invalid UUID format' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      action: data.action as 'test_connection' | 'sync_groups' | 'process_webhook' | 'get_sync_status',
      config_id: data.config_id as string | undefined,
      ldap_data: data.ldap_data,
    }
  };
}

/**
 * Validates OAuth request
 */
export function validateOAuthRequest(body: unknown): ValidationResult<{
  organization_id?: string;
  provider?: 'github' | 'gitlab' | 'bitbucket';
  host_url?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  code?: string;
  state?: string;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate organization_id if present
  if (data.organization_id !== undefined && !isValidUuid(data.organization_id)) {
    errors.push({ field: 'organization_id', message: 'Invalid UUID format' });
  }

  // Validate provider if present
  const validProviders = ['github', 'gitlab', 'bitbucket'] as const;
  if (data.provider !== undefined && !isOneOf(data.provider, validProviders)) {
    errors.push({ field: 'provider', message: 'Provider must be one of: github, gitlab, bitbucket' });
  }

  // Validate URLs
  if (data.host_url !== undefined && !isValidUrl(data.host_url)) {
    errors.push({ field: 'host_url', message: 'Invalid URL format' });
  }
  if (data.redirect_uri !== undefined && !isValidUrl(data.redirect_uri)) {
    errors.push({ field: 'redirect_uri', message: 'Invalid URL format' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      organization_id: data.organization_id as string | undefined,
      provider: data.provider as 'github' | 'gitlab' | 'bitbucket' | undefined,
      host_url: data.host_url as string | undefined,
      client_id: data.client_id as string | undefined,
      client_secret: data.client_secret as string | undefined,
      redirect_uri: data.redirect_uri as string | undefined,
      code: data.code as string | undefined,
      state: data.state as string | undefined,
    }
  };
}

/**
 * Validates rate limit request
 */
export function validateRateLimitRequest(body: unknown): ValidationResult<{
  endpoint: string;
  identifier?: string;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate endpoint (required)
  if (!isNonEmptyString(data.endpoint)) {
    errors.push({ field: 'endpoint', message: 'Endpoint is required' });
  } else if (!isWithinLength(data.endpoint, INPUT_LIMITS.SHORT_TEXT)) {
    errors.push({ field: 'endpoint', message: 'Endpoint exceeds maximum length' });
  }

  // Validate identifier if present
  if (data.identifier !== undefined && !isWithinLength(data.identifier, INPUT_LIMITS.MEDIUM_TEXT)) {
    errors.push({ field: 'identifier', message: 'Identifier exceeds maximum length' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      endpoint: sanitizeString(data.endpoint),
      identifier: data.identifier ? sanitizeString(data.identifier) : undefined,
    }
  };
}

/**
 * Validates cached query request
 */
export function validateCachedQueryRequest(body: unknown): ValidationResult<{
  cacheKey: string;
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  ttlOverride?: number;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate required fields
  if (!isNonEmptyString(data.cacheKey)) {
    errors.push({ field: 'cacheKey', message: 'Cache key is required' });
  }
  if (!isNonEmptyString(data.table)) {
    errors.push({ field: 'table', message: 'Table is required' });
  }

  // Validate table name (prevent SQL injection via table name)
  if (typeof data.table === 'string' && !/^[a-z_][a-z0-9_]*$/i.test(data.table)) {
    errors.push({ field: 'table', message: 'Invalid table name format' });
  }

  // Validate limit if present
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 1000) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 1000' });
    }
  }

  // Validate ttlOverride if present
  if (data.ttlOverride !== undefined) {
    if (typeof data.ttlOverride !== 'number' || data.ttlOverride < 1 || data.ttlOverride > 3600) {
      errors.push({ field: 'ttlOverride', message: 'TTL override must be between 1 and 3600 seconds' });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      cacheKey: sanitizeString(data.cacheKey),
      table: data.table as string,
      select: data.select as string | undefined,
      filters: data.filters as Record<string, unknown> | undefined,
      order: data.order as { column: string; ascending?: boolean } | undefined,
      limit: data.limit as number | undefined,
      ttlOverride: data.ttlOverride as number | undefined,
    }
  };
}

/**
 * Validates background jobs request
 */
export function validateBackgroundJobsRequest(body: unknown): ValidationResult<{
  jobs: Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    priority: number;
    scheduledAt: string;
  }>;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  if (!Array.isArray(data.jobs) || data.jobs.length === 0) {
    errors.push({ field: 'jobs', message: 'Jobs array is required and must not be empty' });
  } else if (data.jobs.length > 100) {
    errors.push({ field: 'jobs', message: 'Maximum 100 jobs per request' });
  }

  // Validate each job
  if (Array.isArray(data.jobs)) {
    const validJobTypes = ['cleanup_rate_limits', 'send_notifications', 'generate_report', 'sync_sprint_metrics', 'archive_old_issues'];
    
    data.jobs.forEach((job: unknown, index: number) => {
      if (!job || typeof job !== 'object') {
        errors.push({ field: `jobs[${index}]`, message: 'Job must be an object' });
        return;
      }
      
      const j = job as Record<string, unknown>;
      
      if (!isNonEmptyString(j.id)) {
        errors.push({ field: `jobs[${index}].id`, message: 'Job ID is required' });
      }
      if (!isOneOf(j.type, validJobTypes)) {
        errors.push({ field: `jobs[${index}].type`, message: 'Invalid job type' });
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      jobs: data.jobs as Array<{
        id: string;
        type: string;
        payload: Record<string, unknown>;
        priority: number;
        scheduledAt: string;
      }>,
    }
  };
}

/**
 * Creates a standardized validation error response
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: errors,
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
