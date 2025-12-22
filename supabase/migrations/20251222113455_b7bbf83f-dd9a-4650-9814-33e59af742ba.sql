-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage workflow steps" ON public.workflow_steps;
DROP POLICY IF EXISTS "Admins can manage workflow transitions" ON public.workflow_transitions;

-- Create new INSERT policy for workflow_steps that allows:
-- 1. Admins
-- 2. Project leads for project-specific workflows
-- 3. Any authenticated user for global workflows (project_id IS NULL)
CREATE POLICY "Users can insert workflow steps" ON public.workflow_steps
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_steps.workflow_id
    AND (
      w.project_id IS NULL  -- Global workflows - allow authenticated users
      OR p.lead_id = auth.uid()  -- Project lead
    )
  )
);

-- Create UPDATE policy for workflow_steps
CREATE POLICY "Users can update workflow steps" ON public.workflow_steps
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_steps.workflow_id
    AND (
      w.project_id IS NULL
      OR p.lead_id = auth.uid()
    )
  )
);

-- Create DELETE policy for workflow_steps
CREATE POLICY "Users can delete workflow steps" ON public.workflow_steps
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_steps.workflow_id
    AND (
      w.project_id IS NULL
      OR p.lead_id = auth.uid()
    )
  )
);

-- Create new INSERT policy for workflow_transitions
CREATE POLICY "Users can insert workflow transitions" ON public.workflow_transitions
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_transitions.workflow_id
    AND (
      w.project_id IS NULL
      OR p.lead_id = auth.uid()
    )
  )
);

-- Create UPDATE policy for workflow_transitions
CREATE POLICY "Users can update workflow transitions" ON public.workflow_transitions
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_transitions.workflow_id
    AND (
      w.project_id IS NULL
      OR p.lead_id = auth.uid()
    )
  )
);

-- Create DELETE policy for workflow_transitions
CREATE POLICY "Users can delete workflow transitions" ON public.workflow_transitions
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM workflows w
    LEFT JOIN projects p ON p.id = w.project_id
    WHERE w.id = workflow_transitions.workflow_id
    AND (
      w.project_id IS NULL
      OR p.lead_id = auth.uid()
    )
  )
);