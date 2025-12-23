import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  action: 'validate' | 'import' | 'get-status';
  jobId?: string;
  importType?: 'issues' | 'projects' | 'users';
  csvData?: string;
  fieldMappings?: Record<string, string>;
  projectId?: string;
}

interface ValidationError {
  row: number;
  field: string;
  errorType: string;
  message: string;
  originalValue?: string;
}

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  preview: Array<Record<string, unknown>>;
  headers: string[];
}

// Field definitions for each import type
const FIELD_DEFINITIONS = {
  issues: {
    required: ['summary', 'issue_type', 'project_key'],
    optional: ['description', 'priority', 'status', 'assignee_email', 'reporter_email', 'story_points', 'due_date', 'labels', 'epic_key'],
    mappable: ['Summary', 'Issue Type', 'Project Key', 'Description', 'Priority', 'Status', 'Assignee', 'Reporter', 'Story Points', 'Due Date', 'Labels', 'Epic Link']
  },
  projects: {
    required: ['name', 'key'],
    optional: ['description', 'lead_email', 'project_type', 'template'],
    mappable: ['Name', 'Key', 'Description', 'Lead', 'Project Type', 'Template']
  },
  users: {
    required: ['email'],
    optional: ['display_name', 'department', 'job_title', 'location'],
    mappable: ['Email', 'Display Name', 'Department', 'Job Title', 'Location']
  }
};

function parseCSV(csvData: string): { headers: string[]; rows: string[][] } {
  const lines = csvData.trim().split('\n');
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// ============= Helper functions for validation (reduces S3776 complexity) =============

function pushValidationError(
  errors: ValidationError[],
  row: number,
  field: string,
  message: string,
  originalValue?: string
): void {
  errors.push({
    row,
    field,
    errorType: 'validation',
    message,
    originalValue
  });
}

function mapRowData(
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>
): Record<string, string> {
  const mappedData: Record<string, string> = {};
  for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
    const columnIndex = headers.indexOf(sourceColumn);
    if (columnIndex !== -1 && row[columnIndex]) {
      mappedData[targetField] = row[columnIndex];
    }
  }
  return mappedData;
}

function validateRequiredFields(
  mappedData: Record<string, string>,
  requiredFields: string[],
  rowIndex: number,
  errors: ValidationError[]
): void {
  for (const requiredField of requiredFields) {
    if (!mappedData[requiredField] || mappedData[requiredField].trim() === '') {
      pushValidationError(
        errors,
        rowIndex,
        requiredField,
        `Required field "${requiredField}" is missing or empty`,
        mappedData[requiredField]
      );
    }
  }
}

function validateIssueFields(
  mappedData: Record<string, string>,
  rowIndex: number,
  errors: ValidationError[]
): void {
  if (mappedData.story_points && Number.isNaN(Number(mappedData.story_points))) {
    pushValidationError(errors, rowIndex, 'story_points', 'Story points must be a number', mappedData.story_points);
  }
  if (mappedData.due_date && Number.isNaN(Date.parse(mappedData.due_date))) {
    pushValidationError(errors, rowIndex, 'due_date', 'Due date must be a valid date', mappedData.due_date);
  }
}

function validateUserFields(
  mappedData: Record<string, string>,
  rowIndex: number,
  errors: ValidationError[]
): void {
  if (mappedData.email && !isValidEmail(mappedData.email)) {
    pushValidationError(errors, rowIndex, 'email', 'Invalid email format', mappedData.email);
  }
}

function validateProjectFields(
  mappedData: Record<string, string>,
  rowIndex: number,
  errors: ValidationError[]
): void {
  if (mappedData.key && !/^[A-Z][A-Z0-9]{1,9}$/.test(mappedData.key.toUpperCase())) {
    pushValidationError(
      errors,
      rowIndex,
      'key',
      'Project key must be 2-10 uppercase alphanumeric characters starting with a letter',
      mappedData.key
    );
  }
}

function runTypeSpecificValidations(
  importType: 'issues' | 'projects' | 'users',
  mappedData: Record<string, string>,
  rowIndex: number,
  errors: ValidationError[]
): void {
  switch (importType) {
    case 'issues':
      validateIssueFields(mappedData, rowIndex, errors);
      break;
    case 'users':
      validateUserFields(mappedData, rowIndex, errors);
      break;
    case 'projects':
      validateProjectFields(mappedData, rowIndex, errors);
      break;
  }
}

function validateRow(
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>,
  importType: 'issues' | 'projects' | 'users',
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = FIELD_DEFINITIONS[importType];
  const mappedData = mapRowData(row, headers, fieldMappings);

  validateRequiredFields(mappedData, fields.required, rowIndex, errors);
  runTypeSpecificValidations(importType, mappedData, rowIndex, errors);

  return errors;
}

/**
 * Validates email format with ReDoS-safe regex
 * Uses bounded quantifiers to prevent catastrophic backtracking
 */
function isValidEmail(email: string): boolean {
  // Limit input length first to prevent DoS
  if (email.length > 254) return false;
  // Use bounded quantifiers to prevent ReDoS attacks
  // Local part: 1-64 chars, domain: 1-253 chars, TLD: 2-63 chars
  return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(email);
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ============= Helper functions for CSV validation (reduces S3776 complexity) =============

function createPreviewRows(
  rows: string[][],
  headers: string[],
  fieldMappings: Record<string, string>
): Array<Record<string, unknown>> {
  const preview: Array<Record<string, unknown>> = [];
  const previewCount = Math.min(5, rows.length);
  
  for (let i = 0; i < previewCount; i++) {
    const previewRow: Record<string, unknown> = {};
    for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
      const columnIndex = headers.indexOf(sourceColumn);
      if (columnIndex !== -1) {
        previewRow[targetField] = rows[i][columnIndex];
      }
    }
    preview.push(previewRow);
  }
  
  return preview;
}

async function checkProjectKeyDuplicates(
  supabase: SupabaseClient,
  rows: string[][],
  headers: string[],
  fieldMappings: Record<string, string>,
  errors: ValidationError[]
): Promise<void> {
  const keyColumn = fieldMappings['key'];
  if (!keyColumn) return;

  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) return;

  const keys = rows.map(r => r[keyIndex]?.toUpperCase()).filter(Boolean);
  if (keys.length === 0) return;

  const { data: existingProjects } = await supabase
    .from('projects')
    .select('pkey')
    .in('pkey', [...new Set(keys)]);

  if (!existingProjects) return;

  for (const proj of existingProjects as { pkey: string }[]) {
    const rowIndex = keys.indexOf(proj.pkey);
    if (rowIndex !== -1) {
      errors.push({
        row: rowIndex + 2,
        field: 'key',
        errorType: 'duplicate',
        message: `Project key "${proj.pkey}" already exists`,
        originalValue: proj.pkey
      });
    }
  }
}

async function validateCSV(
  supabase: SupabaseClient,
  csvData: string,
  fieldMappings: Record<string, string>,
  importType: 'issues' | 'projects' | 'users'
): Promise<ValidationResult> {
  const { headers, rows } = parseCSV(csvData);
  const errors: ValidationError[] = [];
  let validRows = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowErrors = validateRow(rows[i], headers, fieldMappings, importType, i + 2);
    if (rowErrors.length === 0) {
      validRows++;
    } else {
      errors.push(...rowErrors);
    }
  }

  if (importType === 'projects') {
    await checkProjectKeyDuplicates(supabase, rows, headers, fieldMappings, errors);
  }

  const preview = createPreviewRows(rows, headers, fieldMappings);

  return {
    isValid: errors.length === 0,
    totalRows: rows.length,
    validRows,
    errors: errors.slice(0, 100),
    preview,
    headers
  };
}

// ============= Helper functions for issue import (reduces S3776 complexity) =============

interface IssueLookupData {
  issueTypeMap: Map<string, string>;
  priorityMap: Map<string, string>;
  statusMap: Map<string, string>;
  projectMap: Map<string, string>;
  defaultTypeId: string | undefined;
  defaultStatusId: string | undefined;
}

async function fetchIssueLookupData(supabase: SupabaseClient): Promise<IssueLookupData> {
  const [issueTypesRes, prioritiesRes, statusesRes, projectsRes] = await Promise.all([
    supabase.from('issue_types').select('id, name'),
    supabase.from('priorities').select('id, name'),
    supabase.from('issue_statuses').select('id, name'),
    supabase.from('projects').select('id, pkey')
  ]);

  const issueTypes = (issueTypesRes.data || []) as { id: string; name: string }[];
  const priorities = (prioritiesRes.data || []) as { id: string; name: string }[];
  const statuses = (statusesRes.data || []) as { id: string; name: string }[];
  const projects = (projectsRes.data || []) as { id: string; pkey: string }[];

  return {
    issueTypeMap: new Map(issueTypes.map(t => [t.name.toLowerCase(), t.id])),
    priorityMap: new Map(priorities.map(p => [p.name.toLowerCase(), p.id])),
    statusMap: new Map(statuses.map(s => [s.name.toLowerCase(), s.id])),
    projectMap: new Map(projects.map(p => [p.pkey.toLowerCase(), p.id])),
    defaultTypeId: issueTypes[0]?.id,
    defaultStatusId: statuses.find(s => s.name.toLowerCase() === 'to do')?.id || statuses[0]?.id
  };
}

async function logImportError(
  supabase: SupabaseClient,
  jobId: string,
  rowNumber: number,
  fieldName: string,
  errorType: string,
  errorMessage: string,
  originalValue: string
): Promise<void> {
  await supabase.from('import_errors').insert({
    job_id: jobId,
    row_number: rowNumber,
    field_name: fieldName,
    error_type: errorType,
    error_message: errorMessage,
    original_value: originalValue
  });
}

async function updateJobProgress(
  supabase: SupabaseClient,
  jobId: string,
  processed: number,
  success: number,
  failed: number
): Promise<void> {
  await supabase.from('import_jobs').update({
    processed_records: processed,
    successful_records: success,
    failed_records: failed
  }).eq('id', jobId);
}

function buildIssueData(
  mappedData: Record<string, string>,
  lookupData: IssueLookupData,
  projectId: string,
  userId: string
): Record<string, unknown> {
  return {
    summary: mappedData.summary,
    description: mappedData.description || null,
    project_id: projectId,
    issue_type_id: lookupData.issueTypeMap.get(mappedData.issue_type?.toLowerCase()) || lookupData.defaultTypeId,
    priority_id: lookupData.priorityMap.get(mappedData.priority?.toLowerCase()) || null,
    status_id: lookupData.statusMap.get(mappedData.status?.toLowerCase()) || lookupData.defaultStatusId,
    story_points: mappedData.story_points ? Number(mappedData.story_points) : null,
    due_date: mappedData.due_date ? new Date(mappedData.due_date).toISOString().split('T')[0] : null,
    reporter_id: userId,
    issue_key: '',
    issue_number: 0
  };
}

async function processIssueRow(
  supabase: SupabaseClient,
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>,
  lookupData: IssueLookupData,
  jobId: string,
  userId: string,
  rowIndex: number
): Promise<boolean> {
  const mappedData = mapRowData(row, headers, fieldMappings);
  const projectKey = mappedData.project_key?.toUpperCase();
  const projectId = lookupData.projectMap.get(projectKey?.toLowerCase() || '');

  if (!projectId) {
    await logImportError(supabase, jobId, rowIndex, 'project_key', 'reference', `Project "${projectKey}" not found`, projectKey || '');
    return false;
  }

  const issueData = buildIssueData(mappedData, lookupData, projectId, userId);
  const { error } = await supabase.from('issues').insert(issueData);

  if (error) {
    await logImportError(supabase, jobId, rowIndex, 'system', 'system', error.message, JSON.stringify(mappedData));
    return false;
  }

  return true;
}

async function importIssues(
  supabase: SupabaseClient,
  csvData: string,
  fieldMappings: Record<string, string>,
  jobId: string,
  userId: string
): Promise<{ success: number; failed: number }> {
  const { headers, rows } = parseCSV(csvData);
  let success = 0;
  let failed = 0;

  const lookupData = await fetchIssueLookupData(supabase);

  for (let i = 0; i < rows.length; i++) {
    try {
      const isSuccess = await processIssueRow(supabase, rows[i], headers, fieldMappings, lookupData, jobId, userId, i + 2);
      if (isSuccess) {
        success++;
      } else {
        failed++;
      }

      if (i % 10 === 0) {
        await updateJobProgress(supabase, jobId, i + 1, success, failed);
      }
    } catch (err) {
      failed++;
      console.error(`[csv-import] Row ${i + 2} error:`, err);
    }
  }

  return { success, failed };
}

// ============= Helper functions for project import (reduces S3776 complexity) =============

function buildProjectData(mappedData: Record<string, string>, userId: string): Record<string, unknown> {
  return {
    name: mappedData.name,
    pkey: mappedData.key?.toUpperCase(),
    description: mappedData.description || null,
    project_type: mappedData.project_type || 'software',
    template: mappedData.template || 'scrum',
    lead_id: userId
  };
}

function getProjectErrorInfo(errorMessage: string): { fieldName: string; errorType: string } {
  const isPkeyError = errorMessage.includes('pkey');
  const isDuplicateError = errorMessage.includes('duplicate');
  return {
    fieldName: isPkeyError ? 'key' : 'system',
    errorType: isDuplicateError ? 'duplicate' : 'system'
  };
}

async function processProjectRow(
  supabase: SupabaseClient,
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>,
  jobId: string,
  userId: string,
  rowIndex: number
): Promise<boolean> {
  const mappedData = mapRowData(row, headers, fieldMappings);
  const projectData = buildProjectData(mappedData, userId);
  const { error } = await supabase.from('projects').insert(projectData);

  if (error) {
    const errorInfo = getProjectErrorInfo(error.message);
    await logImportError(supabase, jobId, rowIndex, errorInfo.fieldName, errorInfo.errorType, error.message, JSON.stringify(mappedData));
    return false;
  }

  return true;
}

async function importProjects(
  supabase: SupabaseClient,
  csvData: string,
  fieldMappings: Record<string, string>,
  jobId: string,
  userId: string
): Promise<{ success: number; failed: number }> {
  const { headers, rows } = parseCSV(csvData);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      const isSuccess = await processProjectRow(supabase, rows[i], headers, fieldMappings, jobId, userId, i + 2);
      if (isSuccess) {
        success++;
      } else {
        failed++;
      }

      if (i % 10 === 0) {
        await updateJobProgress(supabase, jobId, i + 1, success, failed);
      }
    } catch (err) {
      failed++;
      console.error(`[csv-import] Row ${i + 2} error:`, err);
    }
  }

  return { success, failed };
}

// ============= Helper functions for user import (reduces S3776 complexity) =============

async function updateExistingProfile(
  supabase: SupabaseClient,
  profileId: string,
  mappedData: Record<string, string>
): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({
    display_name: mappedData.display_name || undefined,
    department: mappedData.department || undefined,
    job_title: mappedData.job_title || undefined,
    location: mappedData.location || undefined
  }).eq('id', profileId);

  return !error;
}

async function processUserRow(
  supabase: SupabaseClient,
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>,
  jobId: string,
  rowIndex: number
): Promise<boolean> {
  const mappedData = mapRowData(row, headers, fieldMappings);

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', mappedData.email)
    .single();

  if (existingProfile) {
    return await updateExistingProfile(supabase, (existingProfile as { id: string }).id, mappedData);
  }

  await logImportError(
    supabase,
    jobId,
    rowIndex,
    'email',
    'reference',
    `User with email "${mappedData.email}" does not exist. Users must sign up first.`,
    mappedData.email
  );
  return false;
}

async function importUsers(
  supabase: SupabaseClient,
  csvData: string,
  fieldMappings: Record<string, string>,
  jobId: string
): Promise<{ success: number; failed: number }> {
  const { headers, rows } = parseCSV(csvData);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      const isSuccess = await processUserRow(supabase, rows[i], headers, fieldMappings, jobId, i + 2);
      if (isSuccess) {
        success++;
      } else {
        failed++;
      }

      if (i % 10 === 0) {
        await updateJobProgress(supabase, jobId, i + 1, success, failed);
      }
    } catch (err) {
      failed++;
      console.error(`[csv-import] Row ${i + 2} error:`, err);
    }
  }

  return { success, failed };
}

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;

// ============= Request handling helpers =============

interface AuthResult {
  userId: string | null;
  error: string | null;
}

async function authenticateRequest(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { userId: null, error: 'Unauthorized' };
  }

  const token = authHeader.replace('Bearer ', '');
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });
  
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError) {
    console.error('[csv-import] Auth error:', authError.message);
  }
  
  return { userId: user?.id || null, error: user?.id ? null : 'Unauthorized' };
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleValidateAction(
  supabase: SupabaseClient,
  csvData: string | undefined,
  importType: 'issues' | 'projects' | 'users' | undefined,
  fieldMappings: Record<string, string> | undefined
): Promise<Response> {
  if (!csvData || !importType || !fieldMappings) {
    return createErrorResponse('Missing required fields: csvData, importType, fieldMappings', 400);
  }
  const result = await validateCSV(supabase, csvData, fieldMappings, importType);
  return createSuccessResponse(result);
}

async function handleGetStatusAction(
  supabase: SupabaseClient,
  jobId: string | undefined
): Promise<Response> {
  if (!jobId) {
    return createErrorResponse('Missing jobId', 400);
  }

  const { data: job } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const { data: errors } = await supabase
    .from('import_errors')
    .select('*')
    .eq('job_id', jobId)
    .order('row_number')
    .limit(100);

  return createSuccessResponse({ job, errors });
}

async function processImportJob(
  supabase: SupabaseClient,
  jobId: string,
  csvData: string,
  userId: string
): Promise<void> {
  try {
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error(`[csv-import] Job ${jobId} not found`);
      return;
    }

    const jobData = job as { import_type: string; field_mappings: Record<string, string> };
    let result: { success: number; failed: number };

    switch (jobData.import_type) {
      case 'issues':
        result = await importIssues(supabase, csvData, jobData.field_mappings, jobId, userId);
        break;
      case 'projects':
        result = await importProjects(supabase, csvData, jobData.field_mappings, jobId, userId);
        break;
      case 'users':
        result = await importUsers(supabase, csvData, jobData.field_mappings, jobId);
        break;
      default:
        throw new Error(`Unknown import type: ${jobData.import_type}`);
    }

    await supabase.from('import_jobs').update({
      status: 'completed',
      successful_records: result.success,
      failed_records: result.failed,
      processed_records: result.success + result.failed,
      completed_at: new Date().toISOString()
    }).eq('id', jobId);

    console.log(`[csv-import] Job ${jobId} completed: ${result.success} success, ${result.failed} failed`);
  } catch (err) {
    console.error(`[csv-import] Job ${jobId} failed:`, err);
    await supabase.from('import_jobs').update({
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
      completed_at: new Date().toISOString()
    }).eq('id', jobId);
  }
}

async function handleImportAction(
  supabase: SupabaseClient,
  jobId: string | undefined,
  csvData: string | undefined,
  userId: string
): Promise<Response> {
  if (!jobId) {
    return createErrorResponse('Missing jobId', 400);
  }

  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return createErrorResponse('Import job not found', 404);
  }

  await supabase.from('import_jobs').update({
    status: 'importing',
    started_at: new Date().toISOString()
  }).eq('id', jobId);

  const importPromise = processImportJob(supabase, jobId, csvData!, userId);

  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(importPromise);
  }

  return createSuccessResponse({ message: 'Import started', jobId });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authResult = await authenticateRequest(req, supabaseUrl, supabaseAnonKey);
    if (!authResult.userId) {
      console.error('[csv-import] No valid user found from auth header');
      return createErrorResponse('Unauthorized', 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ImportRequest = await req.json();
    const { action, jobId, importType, csvData, fieldMappings } = body;

    console.log(`[csv-import] Action: ${action}, Import Type: ${importType}, Job ID: ${jobId}`);

    switch (action) {
      case 'validate':
        return handleValidateAction(supabase, csvData, importType, fieldMappings);
      case 'import':
        return handleImportAction(supabase, jobId, csvData, authResult.userId);
      case 'get-status':
        return handleGetStatusAction(supabase, jobId);
      default:
        return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('[csv-import] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
