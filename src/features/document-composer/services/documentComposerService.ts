import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { DocumentTemplate, ExportJob, ExportFormat, TemplateSchema } from '../types';

// =============================================
// TEMPLATE OPERATIONS
// =============================================

export async function getTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(mapDbToTemplate);
}

export async function getTemplate(id: string): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return mapDbToTemplate(data);
}

export async function createTemplate(template: {
  name: string;
  description?: string;
  format: ExportFormat;
  schema: TemplateSchema;
  is_default?: boolean;
}): Promise<DocumentTemplate> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('document_templates')
    .insert([{
      name: template.name,
      description: template.description,
      format: template.format,
      header_config: JSON.parse(JSON.stringify(template.schema.header || {})),
      sections: JSON.parse(JSON.stringify(template.schema.sections || [])),
      footer_config: JSON.parse(JSON.stringify(template.schema.footer || {})),
      watermark_config: JSON.parse(JSON.stringify(template.schema.watermark || {})),
      is_default: template.is_default || false,
      created_by: user.user.id,
    }])
    .select()
    .single();

  if (error) throw error;
  return mapDbToTemplate(data);
}

export async function updateTemplate(id: string, updates: {
  name?: string;
  description?: string;
  format?: ExportFormat;
  schema?: TemplateSchema;
  is_default?: boolean;
}): Promise<DocumentTemplate> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.format !== undefined) updateData.format = updates.format;
  if (updates.schema?.header !== undefined) updateData.header_config = updates.schema.header;
  if (updates.schema?.sections !== undefined) updateData.sections = updates.schema.sections;
  if (updates.schema?.footer !== undefined) updateData.footer_config = updates.schema.footer;
  if (updates.schema?.watermark !== undefined) updateData.watermark_config = updates.schema.watermark;
  if (updates.is_default !== undefined) updateData.is_default = updates.is_default;

  const { data, error } = await supabase
    .from('document_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToTemplate(data);
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// EXPORT OPERATIONS
// =============================================

export async function getExports(): Promise<ExportJob[]> {
  const { data, error } = await supabase
    .from('document_exports')
    .select('*, template:document_templates(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(mapDbToExport);
}

export async function createExport(exportData: {
  templateId?: string;
  name: string;
  format: ExportFormat;
  issueIds: string[];
  options?: Record<string, unknown>;
}): Promise<ExportJob> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('document_exports')
    .insert([{
      template_id: exportData.templateId || null,
      name: exportData.name,
      format: exportData.format,
      issue_ids: JSON.parse(JSON.stringify(exportData.issueIds)),
      options: JSON.parse(JSON.stringify(exportData.options || {})),
      status: 'pending',
      created_by: user.user.id,
    }])
    .select()
    .single();

  if (error) throw error;
  
  // Simulate processing (in real app, this would be an edge function)
  setTimeout(() => processExport(data.id), 1000);
  
  return mapDbToExport(data);
}

async function processExport(exportId: string): Promise<void> {
  try {
    // Update to processing
    await supabase
      .from('document_exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // Simulate export generation (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Mark as completed
    await supabase
      .from('document_exports')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_size: Math.floor(Math.random() * 500000) + 50000, // Random file size
      })
      .eq('id', exportId);
  } catch {
    await supabase
      .from('document_exports')
      .update({ 
        status: 'failed',
        error_message: 'Export generation failed',
      })
      .eq('id', exportId);
  }
}

export async function deleteExport(id: string): Promise<void> {
  const { error } = await supabase
    .from('document_exports')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// MAPPERS
// =============================================

function mapDbToTemplate(db: Record<string, unknown>): DocumentTemplate {
  const headerConfig = db.header_config as Record<string, unknown> || {};
  const sections = db.sections as unknown[] || [];
  const footerConfig = db.footer_config as Record<string, unknown> || {};
  const watermarkConfig = db.watermark_config as Record<string, unknown> || {};

  return {
    id: db.id as string,
    name: db.name as string,
    description: db.description as string | undefined,
    format: db.format as ExportFormat,
    schema: {
      header: headerConfig as unknown as DocumentTemplate['schema']['header'],
      sections: sections as DocumentTemplate['schema']['sections'],
      footer: footerConfig as unknown as DocumentTemplate['schema']['footer'],
      watermark: watermarkConfig as unknown as DocumentTemplate['schema']['watermark'],
    },
    is_default: db.is_default as boolean,
    created_at: db.created_at as string,
    updated_at: db.updated_at as string,
    created_by: db.created_by as string,
  };
}

function mapDbToExport(db: Record<string, unknown>): ExportJob {
  const template = db.template as { name: string } | null;
  const issueIds = db.issue_ids as string[] || [];
  
  return {
    id: db.id as string,
    name: db.name as string,
    template_id: db.template_id as string | undefined,
    template_name: template?.name,
    format: db.format as ExportFormat,
    status: db.status as ExportJob['status'],
    issue_ids: issueIds,
    issueCount: issueIds.length,
    progress: db.status === 'completed' ? 100 : db.status === 'processing' ? 50 : 0,
    file_path: db.file_path as string | undefined,
    fileUrl: db.file_path as string | undefined,
    file_size: db.file_size as number | undefined,
    error: db.error_message as string | undefined,
    error_message: db.error_message as string | undefined,
    created_at: db.created_at as string,
    completed_at: db.completed_at as string | undefined,
  };
}
