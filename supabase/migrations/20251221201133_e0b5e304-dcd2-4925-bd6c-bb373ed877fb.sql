-- Fix 1: Allow any authenticated user to create projects (then they become the lead)
DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Create function to auto-generate issue_key and issue_number
CREATE OR REPLACE FUNCTION public.generate_issue_key()
RETURNS TRIGGER AS $$
DECLARE
  project_key TEXT;
  next_number INTEGER;
BEGIN
  -- Get the project key
  SELECT pkey INTO project_key FROM projects WHERE id = NEW.project_id;
  
  -- Get and increment the issue counter atomically
  UPDATE projects 
  SET issue_counter = COALESCE(issue_counter, 0) + 1 
  WHERE id = NEW.project_id 
  RETURNING issue_counter INTO next_number;
  
  -- Set the issue_key and issue_number
  NEW.issue_key := project_key || '-' || next_number;
  NEW.issue_number := next_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS generate_issue_key_trigger ON issues;

-- Create trigger to auto-generate issue key before insert
CREATE TRIGGER generate_issue_key_trigger
  BEFORE INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_issue_key();

-- Fix 3: Allow project members OR the project creator to access project-related data
-- When creating a project, the user becomes the lead automatically
DROP POLICY IF EXISTS "Project members can manage boards" ON boards;
DROP POLICY IF EXISTS "Project members can view boards" ON boards;

CREATE POLICY "Anyone can view accessible boards" ON boards
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = boards.project_id AND projects.lead_id = auth.uid())
  );

CREATE POLICY "Project leads and members can manage boards" ON boards
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = boards.project_id AND projects.lead_id = auth.uid())
  );

-- Fix 4: Update issue policies to also allow project leads
DROP POLICY IF EXISTS "Project members can create issues" ON issues;
DROP POLICY IF EXISTS "Project members can view issues" ON issues;
DROP POLICY IF EXISTS "Project members can update issues" ON issues;

CREATE POLICY "Project members and leads can create issues" ON issues
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = issues.project_id AND projects.lead_id = auth.uid())
  );

CREATE POLICY "Project members and leads can view issues" ON issues
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = issues.project_id AND projects.lead_id = auth.uid())
  );

CREATE POLICY "Project members and leads can update issues" ON issues
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = issues.project_id AND projects.lead_id = auth.uid())
  );

-- Fix 5: Update project view policy to allow creators to view their projects
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_project_member(auth.uid(), id) OR 
    lead_id = auth.uid()
  );

-- Fix 6: Allow project role actors for project leads
DROP POLICY IF EXISTS "Project leads can manage role actors" ON project_role_actors;
CREATE POLICY "Project leads and admins can manage role actors" ON project_role_actors
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_role_actors.project_id AND projects.lead_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can view project role actors" ON project_role_actors;
CREATE POLICY "Members and leads can view project role actors" ON project_role_actors
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    is_project_member(auth.uid(), project_id) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_role_actors.project_id AND projects.lead_id = auth.uid())
  );