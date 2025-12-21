import { supabase } from "@/integrations/supabase/client";

export interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepRow {
  id: string;
  workflow_id: string;
  status_id: string;
  position_x: number;
  position_y: number;
  is_initial: boolean;
  created_at: string;
  status?: {
    id: string;
    name: string;
    category: string;
    color: string;
  };
}

export interface WorkflowTransitionRow {
  id: string;
  workflow_id: string;
  from_step_id: string;
  to_step_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WorkflowWithDetails extends WorkflowRow {
  steps: WorkflowStepRow[];
  transitions: WorkflowTransitionRow[];
}

export async function getWorkflows(projectId?: string): Promise<WorkflowRow[]> {
  let query = supabase
    .from('workflows')
    .select('*')
    .eq('is_active', true);
  
  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

export async function getWorkflow(id: string): Promise<WorkflowRow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getWorkflowWithDetails(id: string): Promise<WorkflowWithDetails | null> {
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();
  
  if (workflowError) throw workflowError;
  if (!workflow) return null;

  const { data: steps, error: stepsError } = await supabase
    .from('workflow_steps')
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .eq('workflow_id', id);
  
  if (stepsError) throw stepsError;

  const { data: transitions, error: transitionsError } = await supabase
    .from('workflow_transitions')
    .select('*')
    .eq('workflow_id', id);
  
  if (transitionsError) throw transitionsError;

  return {
    ...workflow,
    steps: (steps || []).map(s => ({
      ...s,
      status: s.status as WorkflowStepRow['status']
    })),
    transitions: transitions || []
  };
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  project_id?: string;
}): Promise<WorkflowRow> {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return workflow;
}

export async function updateWorkflow(id: string, data: Partial<WorkflowRow>): Promise<WorkflowRow> {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Workflow Steps
export async function addWorkflowStep(data: {
  workflow_id: string;
  status_id: string;
  position_x?: number;
  position_y?: number;
  is_initial?: boolean;
}): Promise<WorkflowStepRow> {
  const { data: step, error } = await supabase
    .from('workflow_steps')
    .insert(data)
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .single();
  if (error) throw error;
  return {
    ...step,
    status: step.status as WorkflowStepRow['status']
  };
}

export async function updateWorkflowStep(id: string, data: {
  position_x?: number;
  position_y?: number;
  is_initial?: boolean;
}): Promise<WorkflowStepRow> {
  const { data: step, error } = await supabase
    .from('workflow_steps')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      status:issue_statuses(id, name, category, color)
    `)
    .single();
  if (error) throw error;
  return {
    ...step,
    status: step.status as WorkflowStepRow['status']
  };
}

export async function deleteWorkflowStep(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_steps')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Workflow Transitions
export async function addWorkflowTransition(data: {
  workflow_id: string;
  from_step_id: string;
  to_step_id: string;
  name: string;
  description?: string;
}): Promise<WorkflowTransitionRow> {
  const { data: transition, error } = await supabase
    .from('workflow_transitions')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return transition;
}

export async function updateWorkflowTransition(id: string, data: {
  name?: string;
  description?: string;
}): Promise<WorkflowTransitionRow> {
  const { data: transition, error } = await supabase
    .from('workflow_transitions')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return transition;
}

export async function deleteWorkflowTransition(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_transitions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
