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

/**
 * Clone a workflow including all its steps and transitions
 */
export async function cloneWorkflow(
  sourceWorkflowId: string,
  newName: string,
  projectId?: string
): Promise<WorkflowRow> {
  // 1. Get the source workflow with details
  const sourceWorkflow = await getWorkflowWithDetails(sourceWorkflowId);
  if (!sourceWorkflow) {
    throw new Error('Source workflow not found');
  }

  // 2. Create the new workflow
  const newWorkflow = await createWorkflow({
    name: newName,
    description: sourceWorkflow.description || undefined,
    project_id: projectId,
  });

  // 3. Create a mapping of old step IDs to new step IDs
  const stepIdMapping = new Map<string, string>();

  // 4. Clone all steps
  for (const step of sourceWorkflow.steps) {
    const { data: newStep, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: newWorkflow.id,
        status_id: step.status_id,
        position_x: step.position_x,
        position_y: step.position_y,
        is_initial: step.is_initial,
      })
      .select()
      .single();
    
    if (error) throw error;
    stepIdMapping.set(step.id, newStep.id);
  }

  // 5. Clone all transitions using the new step IDs
  for (const transition of sourceWorkflow.transitions) {
    const newFromStepId = stepIdMapping.get(transition.from_step_id);
    const newToStepId = stepIdMapping.get(transition.to_step_id);
    
    if (newFromStepId && newToStepId) {
      const { error } = await supabase
        .from('workflow_transitions')
        .insert({
          workflow_id: newWorkflow.id,
          from_step_id: newFromStepId,
          to_step_id: newToStepId,
          name: transition.name,
          description: transition.description,
        });
      
      if (error) throw error;
    }
  }

  return newWorkflow;
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
