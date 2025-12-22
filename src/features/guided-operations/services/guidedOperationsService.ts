import { supabase } from '@/integrations/supabase/client';
import type { GuidedOperation, OperationStep, OperationExecution } from '../types';

// =============================================
// OPERATION DEFINITIONS
// =============================================

export async function getOperations(): Promise<GuidedOperation[]> {
  const { data, error } = await supabase
    .from('guided_operations')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(mapDbToOperation);
}

export async function getOperation(id: string): Promise<GuidedOperation | null> {
  const { data, error } = await supabase
    .from('guided_operations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return mapDbToOperation(data);
}

export async function createOperation(operation: {
  name: string;
  description?: string;
  category?: string;
  steps: OperationStep[];
  requires_approval?: boolean;
}): Promise<GuidedOperation> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('guided_operations')
    .insert([{
      name: operation.name,
      description: operation.description,
      category: operation.category || 'general',
      steps: JSON.parse(JSON.stringify(operation.steps)),
      requires_approval: operation.requires_approval || false,
      created_by: user.user.id,
    }])
    .select()
    .single();

  if (error) throw error;
  return mapDbToOperation(data);
}

export async function updateOperation(id: string, updates: {
  name?: string;
  description?: string;
  category?: string;
  steps?: OperationStep[];
  is_active?: boolean;
  requires_approval?: boolean;
}): Promise<GuidedOperation> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.steps !== undefined) updateData.steps = updates.steps;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.requires_approval !== undefined) updateData.requires_approval = updates.requires_approval;

  const { data, error } = await supabase
    .from('guided_operations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToOperation(data);
}

export async function deleteOperation(id: string): Promise<void> {
  const { error } = await supabase
    .from('guided_operations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// EXECUTION OPERATIONS
// =============================================

export async function getExecutions(operationId?: string): Promise<OperationExecution[]> {
  let query = supabase
    .from('guided_operation_executions')
    .select('*, operation:guided_operations(name)')
    .order('started_at', { ascending: false });

  if (operationId) {
    query = query.eq('operation_id', operationId);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  return (data || []).map(mapDbToExecution);
}

export async function startExecution(operationId: string): Promise<OperationExecution> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('guided_operation_executions')
    .insert({
      operation_id: operationId,
      status: 'in_progress',
      current_step: 0,
      step_data: {},
      started_by: user.user.id,
    })
    .select('*, operation:guided_operations(name)')
    .single();

  if (error) throw error;
  return mapDbToExecution(data);
}

export async function updateExecution(id: string, updates: {
  current_step?: number;
  step_data?: Record<string, unknown>;
  status?: OperationExecution['status'];
  result?: Record<string, unknown>;
}): Promise<OperationExecution> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.current_step !== undefined) updateData.current_step = updates.current_step;
  if (updates.step_data !== undefined) updateData.step_data = updates.step_data;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
      updateData.completed_at = new Date().toISOString();
    }
  }
  if (updates.result !== undefined) updateData.result = updates.result;

  const { data, error } = await supabase
    .from('guided_operation_executions')
    .update(updateData)
    .eq('id', id)
    .select('*, operation:guided_operations(name)')
    .single();

  if (error) throw error;
  return mapDbToExecution(data);
}

export async function cancelExecution(id: string): Promise<void> {
  await updateExecution(id, { status: 'cancelled' });
}

// =============================================
// MAPPERS
// =============================================

function mapDbToOperation(db: Record<string, unknown>): GuidedOperation {
  return {
    id: db.id as string,
    name: db.name as string,
    description: db.description as string | undefined,
    category: db.category as string,
    steps: db.steps as OperationStep[],
    is_active: db.is_active as boolean,
    requires_approval: db.requires_approval as boolean,
    created_at: db.created_at as string,
    updated_at: db.updated_at as string,
  };
}

function mapDbToExecution(db: Record<string, unknown>): OperationExecution {
  const operation = db.operation as { name: string } | null;
  return {
    id: db.id as string,
    operation_id: db.operation_id as string,
    operation_name: operation?.name,
    status: db.status as OperationExecution['status'],
    current_step: db.current_step as number,
    step_data: db.step_data as Record<string, unknown>,
    started_at: db.started_at as string,
    completed_at: db.completed_at as string | undefined,
    result: db.result as Record<string, unknown> | undefined,
  };
}
