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
 * Validates email format with ReDoS-safe regex
 * Uses bounded quantifiers to prevent catastrophic backtracking
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > INPUT_LIMITS.EMAIL) return false;
  // Use bounded quantifiers to prevent ReDoS attacks
  // Local part: 1-64 chars, domain: 1-253 chars, TLD: 2-63 chars
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;
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
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replaceAll(/javascript:/gi, '')
    .replaceAll(/on\w+\s*=/gi, '')
    .replaceAll('\0', '')
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

// Helper: validate UUID fields (S3776 fix)
function validateUuidFields(
  data: Record<string, unknown>,
  fields: string[],
  errors: ValidationError[]
): void {
  for (const field of fields) {
    if (data[field] !== undefined && !isValidUuid(data[field])) {
      errors.push({ field, message: 'Invalid UUID format' });
    }
  }
}

// Helper: validate string length fields (S3776 fix)
function validateStringLengthFields(
  data: Record<string, unknown>,
  fieldLimits: Array<{ field: string; limit: number; message: string }>,
  errors: ValidationError[]
): void {
  for (const { field, limit, message } of fieldLimits) {
    if (data[field] !== undefined && !isWithinLength(data[field], limit)) {
      errors.push({ field, message });
    }
  }
}

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
  
  // Validate UUIDs using helper
  validateUuidFields(data, ['organization_id', 'project_id', 'repository_id', 'issue_id'], errors);

  // Validate strings with length limits using helper
  validateStringLengthFields(data, [
    { field: 'owner', limit: INPUT_LIMITS.SHORT_TEXT, message: 'Owner exceeds maximum length' },
    { field: 'repo', limit: INPUT_LIMITS.SHORT_TEXT, message: 'Repo exceeds maximum length' },
    { field: 'title', limit: INPUT_LIMITS.MEDIUM_TEXT, message: 'Title exceeds maximum length' },
    { field: 'body', limit: INPUT_LIMITS.LONG_TEXT, message: 'Body exceeds maximum length' },
  ], errors);

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
 * Validates git-sync request
 */
export function validateGitSyncRequest(body: unknown): ValidationResult<{
  action?: 'sync' | 'sync_all' | 'get_status';
  organization_id?: string;
  repository_id?: string;
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  // Validate action
  const validActions = ['sync', 'sync_all', 'get_status'] as const;
  if (data.action !== undefined && !isOneOf(data.action, validActions)) {
    errors.push({ field: 'action', message: 'Action must be one of: sync, sync_all, get_status' });
  }

  // Validate UUIDs if present
  if (data.organization_id !== undefined && !isValidUuid(data.organization_id)) {
    errors.push({ field: 'organization_id', message: 'Invalid UUID format' });
  }
  if (data.repository_id !== undefined && !isValidUuid(data.repository_id)) {
    errors.push({ field: 'repository_id', message: 'Invalid UUID format' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      action: data.action as 'sync' | 'sync_all' | 'get_status' | undefined,
      organization_id: data.organization_id as string | undefined,
      repository_id: data.repository_id as string | undefined,
    }
  };
}

/**
 * Validates git-demo-seed request
 */
export function validateGitDemoSeedRequest(body: unknown): ValidationResult<{
  action: 'seed' | 'cleanup';
}> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  const data = body as Record<string, unknown>;
  
  const validActions = ['seed', 'cleanup'] as const;
  if (!isOneOf(data.action, validActions)) {
    errors.push({ field: 'action', message: 'Action must be one of: seed, cleanup' });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      action: data.action as 'seed' | 'cleanup',
    }
  };
}

// Helper: validate a single job object (S3776 fix)
const VALID_JOB_TYPES = ['cleanup_rate_limits', 'send_notifications', 'generate_report', 'sync_sprint_metrics', 'archive_old_issues'] as const;

function validateSingleJob(job: unknown, index: number, errors: ValidationError[]): void {
  if (!job || typeof job !== 'object') {
    errors.push({ field: `jobs[${index}]`, message: 'Job must be an object' });
    return;
  }
  
  const j = job as Record<string, unknown>;
  
  if (!isNonEmptyString(j.id)) {
    errors.push({ field: `jobs[${index}].id`, message: 'Job ID is required' });
  }
  if (!isOneOf(j.type, VALID_JOB_TYPES)) {
    errors.push({ field: `jobs[${index}].type`, message: 'Invalid job type' });
  }
}

// Helper: validate jobs array (S3776 fix)
function validateJobsArray(data: Record<string, unknown>, errors: ValidationError[]): void {
  if (!Array.isArray(data.jobs) || data.jobs.length === 0) {
    errors.push({ field: 'jobs', message: 'Jobs array is required and must not be empty' });
    return;
  }
  
  if (data.jobs.length > 100) {
    errors.push({ field: 'jobs', message: 'Maximum 100 jobs per request' });
  }

  data.jobs.forEach((job: unknown, index: number) => {
    validateSingleJob(job, index, errors);
  });
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
  
  validateJobsArray(data, errors);

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
