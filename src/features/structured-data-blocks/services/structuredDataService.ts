import { supabase } from '@/integrations/supabase/client';
import type { DataBlockSchema, DataBlockInstance, ColumnDefinition, DataRow } from '../types';

// =============================================
// SCHEMA OPERATIONS
// =============================================

export async function getSchemas(): Promise<DataBlockSchema[]> {
  const { data, error } = await supabase
    .from('data_block_schemas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(mapDbToSchema);
}

export async function getSchema(id: string): Promise<DataBlockSchema | null> {
  const { data, error } = await supabase
    .from('data_block_schemas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return mapDbToSchema(data);
}

export async function createSchema(schema: {
  name: string;
  description?: string;
  columns: ColumnDefinition[];
  validation_rules?: Record<string, unknown>;
}): Promise<DataBlockSchema> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('data_block_schemas')
    .insert({
      name: schema.name,
      description: schema.description,
      columns: schema.columns,
      validation_rules: schema.validation_rules || {},
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToSchema(data);
}

export async function updateSchema(id: string, updates: {
  name?: string;
  description?: string;
  columns?: ColumnDefinition[];
  validation_rules?: Record<string, unknown>;
  is_active?: boolean;
  version?: number;
}): Promise<DataBlockSchema> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.columns !== undefined) updateData.columns = updates.columns;
  if (updates.validation_rules !== undefined) updateData.validation_rules = updates.validation_rules;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.version !== undefined) updateData.version = updates.version;

  const { data, error } = await supabase
    .from('data_block_schemas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToSchema(data);
}

export async function deleteSchema(id: string): Promise<void> {
  const { error } = await supabase
    .from('data_block_schemas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// INSTANCE OPERATIONS
// =============================================

export async function getInstances(schemaId?: string): Promise<DataBlockInstance[]> {
  let query = supabase
    .from('data_block_instances')
    .select('*, schema:data_block_schemas(name)')
    .order('created_at', { ascending: false });

  if (schemaId) {
    query = query.eq('schema_id', schemaId);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  return (data || []).map(mapDbToInstance);
}

export async function getInstance(id: string): Promise<DataBlockInstance | null> {
  const { data, error } = await supabase
    .from('data_block_instances')
    .select('*, schema:data_block_schemas(name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return mapDbToInstance(data);
}

export async function createInstance(instance: {
  schemaId: string;
  name?: string;
  issueId?: string;
  projectId?: string;
  rows?: DataRow[];
}): Promise<DataBlockInstance> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('data_block_instances')
    .insert({
      schema_id: instance.schemaId,
      name: instance.name,
      issue_id: instance.issueId || null,
      project_id: instance.projectId || null,
      rows: instance.rows || [],
      created_by: user.user.id,
    })
    .select('*, schema:data_block_schemas(name)')
    .single();

  if (error) throw error;
  return mapDbToInstance(data);
}

export async function updateInstance(id: string, updates: {
  name?: string;
  rows?: DataRow[];
}): Promise<DataBlockInstance> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.rows !== undefined) updateData.rows = updates.rows;

  const { data, error } = await supabase
    .from('data_block_instances')
    .update(updateData)
    .eq('id', id)
    .select('*, schema:data_block_schemas(name)')
    .single();

  if (error) throw error;
  return mapDbToInstance(data);
}

export async function deleteInstance(id: string): Promise<void> {
  const { error } = await supabase
    .from('data_block_instances')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// MAPPERS
// =============================================

function mapDbToSchema(db: Record<string, unknown>): DataBlockSchema {
  return {
    id: db.id as string,
    name: db.name as string,
    description: db.description as string | undefined,
    columns: db.columns as ColumnDefinition[],
    validation_rules: db.validation_rules as Record<string, unknown>,
    version: db.version as number,
    is_active: db.is_active as boolean,
    created_at: db.created_at as string,
    updated_at: db.updated_at as string,
    created_by: db.created_by as string,
  };
}

function mapDbToInstance(db: Record<string, unknown>): DataBlockInstance {
  const schema = db.schema as { name: string } | null;
  const rawRows = db.rows as unknown[] || [];
  
  // Map raw rows to DataRow format
  const rows: DataRow[] = rawRows.map((row, index) => {
    if (typeof row === 'object' && row !== null && 'id' in row && 'values' in row) {
      return row as DataRow;
    }
    // If row is just values object, wrap it
    return {
      id: `row-${index}`,
      values: row as Record<string, unknown>,
    };
  });

  return {
    id: db.id as string,
    schema_id: db.schema_id as string,
    schema_name: schema?.name,
    name: db.name as string | undefined,
    issue_id: db.issue_id as string | undefined,
    project_id: db.project_id as string | undefined,
    rows,
    created_at: db.created_at as string,
    updated_at: db.updated_at as string,
  };
}
