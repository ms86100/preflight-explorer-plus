import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'checkbox' | 'user' | 'url';

export interface FieldOption {
  value: string;
  label: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  description: string | null;
  field_type: FieldType;
  default_value: string | null;
  is_required: boolean;
  is_active: boolean;
  options: FieldOption[] | null;
  validation_rules: Record<string, unknown> | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldContext {
  id: string;
  field_id: string;
  project_id: string | null;
  issue_type_id: string | null;
  is_required: boolean;
  default_value: string | null;
  created_at: string;
  field?: CustomFieldDefinition;
}

export interface CustomFieldValue {
  id: string;
  issue_id: string;
  field_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_json: unknown | null;
  // DB column aliases for compatibility
  string_value?: string | null;
  number_value?: number | null;
  date_value?: string | null;
  json_value?: unknown | null;
  created_at: string;
  updated_at: string;
  field?: CustomFieldDefinition;
}

// Field Definitions
export async function getCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('is_active', true)
    .order('position');
  
  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    field_type: d.field_type as FieldType,
    options: d.options as unknown as FieldOption[] | null,
    validation_rules: d.validation_rules as unknown as Record<string, unknown> | null,
  }));
}

export async function getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition | null> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data ? {
    ...data,
    field_type: data.field_type as FieldType,
    options: data.options as unknown as FieldOption[] | null,
    validation_rules: data.validation_rules as unknown as Record<string, unknown> | null,
  } : null;
}

export async function createCustomFieldDefinition(data: {
  name: string;
  description?: string;
  field_type: FieldType;
  default_value?: string;
  is_required?: boolean;
  options?: FieldOption[];
  validation_rules?: Record<string, unknown>;
}): Promise<CustomFieldDefinition> {
  const { data: field, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      ...data,
      options: data.options as unknown as Json,
      validation_rules: data.validation_rules as unknown as Json,
    })
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...field,
    field_type: field.field_type as FieldType,
    options: field.options as unknown as FieldOption[] | null,
    validation_rules: field.validation_rules as unknown as Record<string, unknown> | null,
  };
}

export async function updateCustomFieldDefinition(
  id: string, 
  data: Partial<Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>>
): Promise<CustomFieldDefinition> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.options) updateData.options = data.options as unknown as Json;
  if (data.validation_rules) updateData.validation_rules = data.validation_rules as unknown as Json;
  
  const { data: field, error } = await supabase
    .from('custom_field_definitions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...field,
    field_type: field.field_type as FieldType,
    options: field.options as unknown as FieldOption[] | null,
    validation_rules: field.validation_rules as unknown as Record<string, unknown> | null,
  };
}

export async function deleteCustomFieldDefinition(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_definitions')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// Field Contexts
export async function getFieldContexts(projectId?: string, issueTypeId?: string): Promise<CustomFieldContext[]> {
  let query = supabase
    .from('custom_field_contexts')
    .select(`
      *,
      field:custom_field_definitions(*)
    `);
  
  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`);
  }
  if (issueTypeId) {
    query = query.or(`issue_type_id.eq.${issueTypeId},issue_type_id.is.null`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(ctx => ({
    ...ctx,
    field: ctx.field ? {
      ...ctx.field,
      field_type: ctx.field.field_type as FieldType,
      options: ctx.field.options as unknown as FieldOption[] | null,
      validation_rules: ctx.field.validation_rules as unknown as Record<string, unknown> | null,
    } : undefined,
  }));
}

export async function addFieldContext(data: {
  field_id: string;
  project_id?: string;
  issue_type_id?: string;
  is_required?: boolean;
  default_value?: string;
}): Promise<CustomFieldContext> {
  const { data: context, error } = await supabase
    .from('custom_field_contexts')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return context;
}

export async function removeFieldContext(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_contexts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Field Values
export async function getIssueCustomFieldValues(issueId: string): Promise<CustomFieldValue[]> {
  const { data, error } = await supabase
    .from('custom_field_values')
    .select(`
      *,
      field:custom_field_definitions(*)
    `)
    .eq('issue_id', issueId);
  
  if (error) throw error;
  
  return (data || []).map((val: any) => ({
    id: val.id,
    issue_id: val.issue_id,
    field_id: val.field_id,
    value_text: val.string_value ?? null,
    value_number: val.number_value ?? null,
    value_date: val.date_value ?? null,
    value_json: val.json_value ?? null,
    string_value: val.string_value,
    number_value: val.number_value,
    date_value: val.date_value,
    json_value: val.json_value,
    created_at: val.created_at,
    updated_at: val.updated_at,
    field: val.field ? {
      ...val.field,
      field_type: val.field.field_type as FieldType,
      options: val.field.options as unknown as FieldOption[] | null,
      validation_rules: val.field.validation_rules as unknown as Record<string, unknown> | null,
    } : undefined,
  }));
}

export async function setCustomFieldValue(data: {
  issue_id: string;
  field_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_json?: unknown | null;
}): Promise<CustomFieldValue> {
  const { data: value, error } = await supabase
    .from('custom_field_values')
    .upsert({
      issue_id: data.issue_id,
      field_id: data.field_id,
      string_value: data.value_text ?? null,
      number_value: data.value_number ?? null,
      date_value: data.value_date ?? null,
      json_value: data.value_json as Json ?? null,
    }, {
      onConflict: 'issue_id,field_id',
    })
    .select()
    .single();
  
  if (error) throw error;
  
  const val = value as any;
  return {
    id: val.id,
    issue_id: val.issue_id,
    field_id: val.field_id,
    value_text: val.string_value ?? null,
    value_number: val.number_value ?? null,
    value_date: val.date_value ?? null,
    value_json: val.json_value ?? null,
    string_value: val.string_value,
    number_value: val.number_value,
    date_value: val.date_value,
    json_value: val.json_value,
    created_at: val.created_at,
    updated_at: val.updated_at,
  };
}

export async function deleteCustomFieldValue(issueId: string, fieldId: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_values')
    .delete()
    .eq('issue_id', issueId)
    .eq('field_id', fieldId);
  if (error) throw error;
}
