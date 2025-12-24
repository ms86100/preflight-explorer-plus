import { supabase } from "@/integrations/supabase/client";

export interface AvailableTransition {
  readonly transition_id: string | null;
  readonly transition_name: string;
  readonly to_status_id: string;
  readonly to_status_name: string;
  readonly to_status_color: string;
  readonly to_status_category: string;
}

export interface WorkflowScheme {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly is_default: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface WorkflowSchemeMapping {
  readonly id: string;
  readonly scheme_id: string;
  readonly issue_type_id: string | null;
  readonly workflow_id: string;
  readonly workflow?: { readonly id: string; readonly name: string };
  readonly issue_type?: { readonly id: string; readonly name: string } | null;
}

export interface ProjectWorkflowScheme {
  readonly id: string;
  readonly project_id: string;
  readonly scheme_id: string;
  readonly scheme?: WorkflowScheme;
}

/**
 * Get available transitions for an issue based on its workflow
 */
export async function getAvailableTransitions(issueId: string): Promise<AvailableTransition[]> {
  const { data, error } = await supabase.rpc('get_available_transitions', {
    p_issue_id: issueId
  });

  if (error) {
    console.error('Error getting available transitions:', error);
    throw error;
  }

  return (data || []) as AvailableTransition[];
}

/**
 * Validate if a status transition is allowed
 */
export async function validateTransition(
  issueId: string,
  fromStatusId: string,
  toStatusId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_status_transition', {
    p_issue_id: issueId,
    p_from_status_id: fromStatusId,
    p_to_status_id: toStatusId
  });

  if (error) {
    console.error('Error validating transition:', error);
    throw error;
  }

  return data === true;
}

/**
 * Get the workflow ID for an issue based on project and issue type
 */
export async function getWorkflowForIssue(
  projectId: string,
  issueTypeId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_workflow_for_issue', {
    p_project_id: projectId,
    p_issue_type_id: issueTypeId
  });

  if (error) {
    console.error('Error getting workflow for issue:', error);
    throw error;
  }

  return data as string | null;
}

/**
 * Execute a status transition with validation
 */
export async function executeTransition(
  issueId: string,
  toStatusId: string
): Promise<{ success: boolean; error?: string }> {
  // First get the current status
  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('status_id')
    .eq('id', issueId)
    .single();

  if (issueError || !issue) {
    return { success: false, error: 'Issue not found' };
  }

  // Validate the transition
  const isValid = await validateTransition(issueId, issue.status_id, toStatusId);

  if (!isValid) {
    return { success: false, error: 'This transition is not allowed by the workflow' };
  }

  // Execute the transition
  const { error: updateError } = await supabase
    .from('issues')
    .update({ status_id: toStatusId })
    .eq('id', issueId);

  if (updateError) {
    // Handle foreign key constraint errors with a user-friendly message
    if (updateError.message?.includes('foreign key constraint') || 
        updateError.code === '23503') {
      return { 
        success: false, 
        error: 'This transition is not allowed by the workflow' 
      };
    }
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

// Workflow Scheme Management

/**
 * Get all workflow schemes
 */
export async function getWorkflowSchemes(): Promise<WorkflowScheme[]> {
  const { data, error } = await supabase
    .from('workflow_schemes')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get workflow scheme with mappings
 */
export async function getWorkflowSchemeWithMappings(schemeId: string): Promise<{
  scheme: WorkflowScheme;
  mappings: WorkflowSchemeMapping[];
} | null> {
  const { data: scheme, error: schemeError } = await supabase
    .from('workflow_schemes')
    .select('*')
    .eq('id', schemeId)
    .single();

  if (schemeError) throw schemeError;
  if (!scheme) return null;

  const { data: mappings, error: mappingsError } = await supabase
    .from('workflow_scheme_mappings')
    .select(`
      *,
      workflow:workflows(id, name),
      issue_type:issue_types(id, name)
    `)
    .eq('scheme_id', schemeId);

  if (mappingsError) throw mappingsError;

  return {
    scheme,
    mappings: (mappings || []).map(m => ({
      ...m,
      workflow: m.workflow as { id: string; name: string } | undefined,
      issue_type: m.issue_type as { id: string; name: string } | null | undefined
    }))
  };
}

/**
 * Get project's workflow scheme
 */
export async function getProjectWorkflowScheme(projectId: string): Promise<ProjectWorkflowScheme | null> {
  const { data, error } = await supabase
    .from('project_workflow_schemes')
    .select(`
      *,
      scheme:workflow_schemes(*)
    `)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw error;
  return data ? {
    ...data,
    scheme: data.scheme as WorkflowScheme | undefined
  } : null;
}

/**
 * Assign a workflow scheme to a project
 */
export async function assignWorkflowSchemeToProject(
  projectId: string,
  schemeId: string
): Promise<void> {
  // Upsert the project workflow scheme
  const { error } = await supabase
    .from('project_workflow_schemes')
    .upsert({
      project_id: projectId,
      scheme_id: schemeId
    }, {
      onConflict: 'project_id'
    });

  if (error) throw error;
}

/**
 * Create a new workflow scheme
 */
export async function createWorkflowScheme(data: {
  name: string;
  description?: string;
}): Promise<WorkflowScheme> {
  const { data: scheme, error } = await supabase
    .from('workflow_schemes')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return scheme;
}

/**
 * Add or update a mapping in a workflow scheme
 */
export async function upsertWorkflowSchemeMapping(data: {
  scheme_id: string;
  issue_type_id: string | null;
  workflow_id: string;
}): Promise<WorkflowSchemeMapping> {
  const { data: mapping, error } = await supabase
    .from('workflow_scheme_mappings')
    .upsert(data, {
      onConflict: 'scheme_id,issue_type_id'
    })
    .select()
    .single();

  if (error) throw error;
  return mapping;
}

/**
 * Delete a mapping from a workflow scheme
 */
export async function deleteWorkflowSchemeMapping(mappingId: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_scheme_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) throw error;
}
