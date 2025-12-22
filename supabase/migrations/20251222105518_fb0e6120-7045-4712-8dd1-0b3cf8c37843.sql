-- Fix workflow RLS policies: Add explicit INSERT policy
-- The existing "Project leads can manage workflows" uses FOR ALL with qual,
-- but INSERT requires WITH CHECK clause to work properly

-- Drop the existing policy that's not working for INSERT
DROP POLICY IF EXISTS "Project leads can manage workflows" ON public.workflows;

-- Create separate policies for each operation

-- SELECT policy (unchanged)
-- Already exists: "Project members can view workflows"

-- INSERT policy: Allow admins and authenticated users for global workflows
CREATE POLICY "Users can create workflows"
ON public.workflows
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    -- Project leads can create workflows for their projects
    project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = workflows.project_id 
      AND projects.lead_id = auth.uid()
    )
  )
  OR (
    -- Any authenticated user can create global workflows (project_id IS NULL)
    project_id IS NULL
  )
);

-- UPDATE policy: Admins and project leads can update
CREATE POLICY "Admins and project leads can update workflows"
ON public.workflows
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = workflows.project_id 
      AND projects.lead_id = auth.uid()
    )
  )
  OR (
    -- Creator can update global workflows (would need created_by column, skip for now)
    project_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- DELETE policy: Admins and project leads can delete
CREATE POLICY "Admins and project leads can delete workflows"
ON public.workflows
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = workflows.project_id 
      AND projects.lead_id = auth.uid()
    )
  )
);