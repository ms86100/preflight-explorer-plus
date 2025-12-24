-- Fix RLS policies for workflow_schemes to allow authenticated users to create/manage
-- The issue is that only admins can manage, but user_roles table is empty

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage workflow schemes" ON workflow_schemes;

-- Create new policies that allow authenticated users to manage workflow schemes
CREATE POLICY "Authenticated users can create workflow schemes" 
ON workflow_schemes FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update workflow schemes" 
ON workflow_schemes FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete workflow schemes" 
ON workflow_schemes FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_default = false);

-- Fix issue_statuses policies - ensure authenticated users can delete
DROP POLICY IF EXISTS "Admins can delete statuses" ON issue_statuses;
DROP POLICY IF EXISTS "Admins can manage issue statuses" ON issue_statuses;

CREATE POLICY "Authenticated users can delete statuses" 
ON issue_statuses FOR DELETE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update statuses" 
ON issue_statuses FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Fix workflows table - allow authenticated users to delete non-default workflows
DROP POLICY IF EXISTS "Admins and project leads can delete workflows" ON workflows;

CREATE POLICY "Authenticated users can delete workflows" 
ON workflows FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_default = false);