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

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    field: string;
    errorType: string;
    message: string;
    originalValue?: string;
  }>;
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

function validateRow(
  row: string[],
  headers: string[],
  fieldMappings: Record<string, string>,
  importType: 'issues' | 'projects' | 'users',
  rowIndex: number
): Array<{ row: number; field: string; errorType: string; message: string; originalValue?: string }> {
  const errors: Array<{ row: number; field: string; errorType: string; message: string; originalValue?: string }> = [];
  const fields = FIELD_DEFINITIONS[importType];

  // Create mapped data
  const mappedData: Record<string, string> = {};
  for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
    const columnIndex = headers.indexOf(sourceColumn);
    if (columnIndex !== -1 && row[columnIndex]) {
      mappedData[targetField] = row[columnIndex];
    }
  }

  // Check required fields
  for (const requiredField of fields.required) {
    if (!mappedData[requiredField] || mappedData[requiredField].trim() === '') {
      errors.push({
        row: rowIndex,
        field: requiredField,
        errorType: 'validation',
        message: `Required field "${requiredField}" is missing or empty`,
        originalValue: mappedData[requiredField]
      });
    }
  }

  // Type-specific validations
  if (importType === 'issues') {
    if (mappedData.story_points && isNaN(Number(mappedData.story_points))) {
      errors.push({
        row: rowIndex,
        field: 'story_points',
        errorType: 'validation',
        message: 'Story points must be a number',
        originalValue: mappedData.story_points
      });
    }
    if (mappedData.due_date && isNaN(Date.parse(mappedData.due_date))) {
      errors.push({
        row: rowIndex,
        field: 'due_date',
        errorType: 'validation',
        message: 'Due date must be a valid date',
        originalValue: mappedData.due_date
      });
    }
  }

  if (importType === 'users') {
    if (mappedData.email && !isValidEmail(mappedData.email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        errorType: 'validation',
        message: 'Invalid email format',
        originalValue: mappedData.email
      });
    }
  }

  if (importType === 'projects') {
    if (mappedData.key && !/^[A-Z][A-Z0-9]{1,9}$/.test(mappedData.key.toUpperCase())) {
      errors.push({
        row: rowIndex,
        field: 'key',
        errorType: 'validation',
        message: 'Project key must be 2-10 uppercase alphanumeric characters starting with a letter',
        originalValue: mappedData.key
      });
    }
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function validateCSV(
  supabase: SupabaseClient,
  csvData: string,
  fieldMappings: Record<string, string>,
  importType: 'issues' | 'projects' | 'users'
): Promise<ValidationResult> {
  const { headers, rows } = parseCSV(csvData);
  
  const errors: ValidationResult['errors'] = [];
  let validRows = 0;

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const rowErrors = validateRow(rows[i], headers, fieldMappings, importType, i + 2); // +2 for 1-indexed and header row
    if (rowErrors.length === 0) {
      validRows++;
    } else {
      errors.push(...rowErrors);
    }
  }

  // Check for duplicates in key fields
  if (importType === 'projects') {
    const keyColumn = fieldMappings['key'];
    if (keyColumn) {
      const keyIndex = headers.indexOf(keyColumn);
      const keys = rows.map(r => r[keyIndex]?.toUpperCase());
      
      // Check against existing projects
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('pkey')
        .in('pkey', [...new Set(keys)]);
      
      if (existingProjects) {
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
    }
  }

  // Create preview of first 5 valid rows
  const preview: Array<Record<string, unknown>> = [];
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const previewRow: Record<string, unknown> = {};
    for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
      const columnIndex = headers.indexOf(sourceColumn);
      if (columnIndex !== -1) {
        previewRow[targetField] = rows[i][columnIndex];
      }
    }
    preview.push(previewRow);
  }

  return {
    isValid: errors.length === 0,
    totalRows: rows.length,
    validRows,
    errors: errors.slice(0, 100), // Limit to first 100 errors
    preview,
    headers
  };
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

  // Get lookup data
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

  const issueTypeMap = new Map(issueTypes.map(t => [t.name.toLowerCase(), t.id]));
  const priorityMap = new Map(priorities.map(p => [p.name.toLowerCase(), p.id]));
  const statusMap = new Map(statuses.map(s => [s.name.toLowerCase(), s.id]));
  const projectMap = new Map(projects.map(p => [p.pkey.toLowerCase(), p.id]));

  // Get default values
  const defaultTypeId = issueTypes[0]?.id;
  const defaultStatusId = statuses.find(s => s.name.toLowerCase() === 'to do')?.id || statuses[0]?.id;

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const mappedData: Record<string, string> = {};
      
      for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
        const columnIndex = headers.indexOf(sourceColumn);
        if (columnIndex !== -1 && row[columnIndex]) {
          mappedData[targetField] = row[columnIndex];
        }
      }

      const projectKey = mappedData.project_key?.toUpperCase();
      const projectId = projectMap.get(projectKey?.toLowerCase() || '');

      if (!projectId) {
        await supabase.from('import_errors').insert({
          job_id: jobId,
          row_number: i + 2,
          field_name: 'project_key',
          error_type: 'reference',
          error_message: `Project "${projectKey}" not found`,
          original_value: projectKey
        });
        failed++;
        continue;
      }

      const issueData = {
        summary: mappedData.summary,
        description: mappedData.description || null,
        project_id: projectId,
        issue_type_id: issueTypeMap.get(mappedData.issue_type?.toLowerCase()) || defaultTypeId,
        priority_id: priorityMap.get(mappedData.priority?.toLowerCase()) || null,
        status_id: statusMap.get(mappedData.status?.toLowerCase()) || defaultStatusId,
        story_points: mappedData.story_points ? Number(mappedData.story_points) : null,
        due_date: mappedData.due_date ? new Date(mappedData.due_date).toISOString().split('T')[0] : null,
        reporter_id: userId,
        issue_key: '', // Will be generated by trigger
        issue_number: 0 // Will be generated by trigger
      };

      const { error } = await supabase.from('issues').insert(issueData);

      if (error) {
        await supabase.from('import_errors').insert({
          job_id: jobId,
          row_number: i + 2,
          field_name: 'system',
          error_type: 'system',
          error_message: error.message,
          original_value: JSON.stringify(mappedData)
        });
        failed++;
      } else {
        success++;
      }

      // Update progress
      if (i % 10 === 0) {
        await supabase.from('import_jobs').update({
          processed_records: i + 1,
          successful_records: success,
          failed_records: failed
        }).eq('id', jobId);
      }
    } catch (err) {
      failed++;
      console.error(`[csv-import] Row ${i + 2} error:`, err);
    }
  }

  return { success, failed };
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
      const row = rows[i];
      const mappedData: Record<string, string> = {};
      
      for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
        const columnIndex = headers.indexOf(sourceColumn);
        if (columnIndex !== -1 && row[columnIndex]) {
          mappedData[targetField] = row[columnIndex];
        }
      }

      const projectData = {
        name: mappedData.name,
        pkey: mappedData.key?.toUpperCase(),
        description: mappedData.description || null,
        project_type: mappedData.project_type || 'software',
        template: mappedData.template || 'scrum',
        lead_id: userId // Default to importing user
      };

      const { error } = await supabase.from('projects').insert(projectData);

      if (error) {
        await supabase.from('import_errors').insert({
          job_id: jobId,
          row_number: i + 2,
          field_name: error.message.includes('pkey') ? 'key' : 'system',
          error_type: error.message.includes('duplicate') ? 'duplicate' : 'system',
          error_message: error.message,
          original_value: JSON.stringify(mappedData)
        });
        failed++;
      } else {
        success++;
      }

      if (i % 10 === 0) {
        await supabase.from('import_jobs').update({
          processed_records: i + 1,
          successful_records: success,
          failed_records: failed
        }).eq('id', jobId);
      }
    } catch (err) {
      failed++;
      console.error(`[csv-import] Row ${i + 2} error:`, err);
    }
  }

  return { success, failed };
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
      const row = rows[i];
      const mappedData: Record<string, string> = {};
      
      for (const [targetField, sourceColumn] of Object.entries(fieldMappings)) {
        const columnIndex = headers.indexOf(sourceColumn);
        if (columnIndex !== -1 && row[columnIndex]) {
          mappedData[targetField] = row[columnIndex];
        }
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', mappedData.email)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from('profiles').update({
          display_name: mappedData.display_name || undefined,
          department: mappedData.department || undefined,
          job_title: mappedData.job_title || undefined,
          location: mappedData.location || undefined
        }).eq('id', (existingProfile as { id: string }).id);

        if (error) {
          failed++;
        } else {
          success++;
        }
      } else {
        // Note: We can't create auth users directly, only update profiles
        await supabase.from('import_errors').insert({
          job_id: jobId,
          row_number: i + 2,
          field_name: 'email',
          error_type: 'reference',
          error_message: `User with email "${mappedData.email}" does not exist. Users must sign up first.`,
          original_value: mappedData.email
        });
        failed++;
      }

      if (i % 10 === 0) {
        await supabase.from('import_jobs').update({
          processed_records: i + 1,
          successful_records: success,
          failed_records: failed
        }).eq('id', jobId);
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ImportRequest = await req.json();
    const { action, jobId, importType, csvData, fieldMappings } = body;

    console.log(`[csv-import] Action: ${action}, Import Type: ${importType}, Job ID: ${jobId}`);

    if (action === 'validate') {
      if (!csvData || !importType || !fieldMappings) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: csvData, importType, fieldMappings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await validateCSV(supabase, csvData, fieldMappings, importType);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'Missing jobId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Import job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update status to importing
      await supabase.from('import_jobs').update({
        status: 'importing',
        started_at: new Date().toISOString()
      }).eq('id', jobId);

      // Process import in background
      const importPromise = (async () => {
        try {
          let result: { success: number; failed: number };
          const jobData = job as { import_type: string; field_mappings: Record<string, string> };

          switch (jobData.import_type) {
            case 'issues':
              result = await importIssues(supabase, csvData!, jobData.field_mappings, jobId, userId);
              break;
            case 'projects':
              result = await importProjects(supabase, csvData!, jobData.field_mappings, jobId, userId);
              break;
            case 'users':
              result = await importUsers(supabase, csvData!, jobData.field_mappings, jobId);
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
      })();

      // Use waitUntil for background processing
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(importPromise);
      }

      return new Response(
        JSON.stringify({ message: 'Import started', jobId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-status') {
      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'Missing jobId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      return new Response(
        JSON.stringify({ job, errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[csv-import] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
