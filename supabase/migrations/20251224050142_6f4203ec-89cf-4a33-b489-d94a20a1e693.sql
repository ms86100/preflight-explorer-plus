-- Fix RLS for workflow_scheme_mappings so authenticated users can manage mappings
-- Root cause: current policy requires admin role, but no users have roles seeded.

DROP POLICY IF EXISTS "Admins can manage workflow scheme mappings" ON public.workflow_scheme_mappings;

CREATE POLICY "Authenticated users can create workflow scheme mappings"
ON public.workflow_scheme_mappings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update workflow scheme mappings"
ON public.workflow_scheme_mappings
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete workflow scheme mappings"
ON public.workflow_scheme_mappings
FOR DELETE
USING (auth.uid() IS NOT NULL);
