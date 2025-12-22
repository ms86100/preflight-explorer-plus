import { supabase } from "@/integrations/supabase/client";
import type { ImportType, ValidationResult, ImportJob, ImportError } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function validateCSV(
  csvData: string,
  fieldMappings: Record<string, string>,
  importType: ImportType
): Promise<ValidationResult> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/csv-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'validate',
      importType,
      csvData,
      fieldMappings
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Validation failed');
  }

  return response.json();
}

export async function createImportJob(
  importType: ImportType,
  fileName: string,
  totalRecords: number,
  fieldMappings: Record<string, string>
): Promise<ImportJob> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      user_id: user.id,
      import_type: importType,
      file_name: fileName,
      total_records: totalRecords,
      field_mappings: fieldMappings,
      status: 'validated'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as ImportJob;
}

export async function startImport(
  jobId: string,
  csvData: string
): Promise<{ message: string; jobId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/csv-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'import',
      jobId,
      csvData
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Import failed');
  }

  return response.json();
}

export async function getImportStatus(
  jobId: string
): Promise<{ job: ImportJob; errors: ImportError[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/csv-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'get-status',
      jobId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get status');
  }

  return response.json();
}

export async function getImportHistory(): Promise<ImportJob[]> {
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return data as unknown as ImportJob[];
}

export function parseCSVHeaders(csvData: string): string[] {
  const lines = csvData.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headerLine = lines[0];
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    
    if (char === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  headers.push(current.trim());
  return headers;
}

export function countCSVRows(csvData: string): number {
  const lines = csvData.trim().split('\n');
  return Math.max(0, lines.length - 1); // Exclude header
}
