-- Drop and recreate the SELECT policy with authenticated role
DROP POLICY IF EXISTS "Users can view accessible projects" ON public.projects;

CREATE POLICY "Users can view accessible projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  is_project_member(auth.uid(), id) OR 
  (lead_id = auth.uid())
);