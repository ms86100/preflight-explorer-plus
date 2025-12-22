-- Create workflow_schemes table (maps issue types to workflows per project)
CREATE TABLE public.workflow_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow_scheme_mappings table (which workflow applies to which issue type)
CREATE TABLE public.workflow_scheme_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_id UUID NOT NULL REFERENCES public.workflow_schemes(id) ON DELETE CASCADE,
  issue_type_id UUID REFERENCES public.issue_types(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(scheme_id, issue_type_id)
);

-- Create project_workflow_schemes table (links projects to workflow schemes)
CREATE TABLE public.project_workflow_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  scheme_id UUID NOT NULL REFERENCES public.workflow_schemes(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_workflow_scheme_mappings_scheme ON public.workflow_scheme_mappings(scheme_id);
CREATE INDEX idx_workflow_scheme_mappings_workflow ON public.workflow_scheme_mappings(workflow_id);
CREATE INDEX idx_project_workflow_schemes_project ON public.project_workflow_schemes(project_id);

-- Enable RLS
ALTER TABLE public.workflow_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_scheme_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workflow_schemes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_schemes
CREATE POLICY "Authenticated can view workflow schemes"
ON public.workflow_schemes FOR SELECT
USING (true);

CREATE POLICY "Admins can manage workflow schemes"
ON public.workflow_schemes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for workflow_scheme_mappings
CREATE POLICY "Authenticated can view workflow scheme mappings"
ON public.workflow_scheme_mappings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage workflow scheme mappings"
ON public.workflow_scheme_mappings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for project_workflow_schemes
CREATE POLICY "Project members can view project workflow schemes"
ON public.project_workflow_schemes FOR SELECT
USING (is_project_member(auth.uid(), project_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project leads can manage project workflow schemes"
ON public.project_workflow_schemes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
  SELECT 1 FROM projects WHERE projects.id = project_workflow_schemes.project_id AND projects.lead_id = auth.uid()
));

-- Insert default workflow scheme
INSERT INTO public.workflow_schemes (id, name, description, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workflow Scheme', 'Default scheme using the standard software workflow', true);

-- Map the default workflow to all issue types in default scheme (null issue_type_id means "all types")
INSERT INTO public.workflow_scheme_mappings (scheme_id, issue_type_id, workflow_id)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000000001');

-- Create function to get workflow for an issue
CREATE OR REPLACE FUNCTION public.get_workflow_for_issue(p_project_id UUID, p_issue_type_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
  v_scheme_id UUID;
BEGIN
  -- Get the workflow scheme for this project
  SELECT scheme_id INTO v_scheme_id
  FROM project_workflow_schemes
  WHERE project_id = p_project_id;
  
  -- If no scheme assigned, use default
  IF v_scheme_id IS NULL THEN
    SELECT id INTO v_scheme_id FROM workflow_schemes WHERE is_default = true LIMIT 1;
  END IF;
  
  -- Get specific mapping for this issue type
  SELECT workflow_id INTO v_workflow_id
  FROM workflow_scheme_mappings
  WHERE scheme_id = v_scheme_id AND issue_type_id = p_issue_type_id;
  
  -- If no specific mapping, get the default mapping (null issue_type_id)
  IF v_workflow_id IS NULL THEN
    SELECT workflow_id INTO v_workflow_id
    FROM workflow_scheme_mappings
    WHERE scheme_id = v_scheme_id AND issue_type_id IS NULL;
  END IF;
  
  -- Fallback to default workflow
  IF v_workflow_id IS NULL THEN
    SELECT id INTO v_workflow_id FROM workflows WHERE is_default = true LIMIT 1;
  END IF;
  
  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to validate a status transition
CREATE OR REPLACE FUNCTION public.validate_status_transition(
  p_issue_id UUID,
  p_from_status_id UUID,
  p_to_status_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_workflow_id UUID;
  v_project_id UUID;
  v_issue_type_id UUID;
  v_from_step_id UUID;
  v_to_step_id UUID;
  v_transition_exists BOOLEAN;
BEGIN
  -- Get issue details
  SELECT project_id, issue_type_id INTO v_project_id, v_issue_type_id
  FROM issues WHERE id = p_issue_id;
  
  IF v_project_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the workflow for this issue
  v_workflow_id := get_workflow_for_issue(v_project_id, v_issue_type_id);
  
  IF v_workflow_id IS NULL THEN
    -- No workflow defined, allow any transition
    RETURN true;
  END IF;
  
  -- Get from step
  SELECT id INTO v_from_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = p_from_status_id;
  
  -- Get to step
  SELECT id INTO v_to_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = p_to_status_id;
  
  -- If statuses aren't in the workflow, allow transition (for flexibility)
  IF v_from_step_id IS NULL OR v_to_step_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if transition exists
  SELECT EXISTS(
    SELECT 1 FROM workflow_transitions
    WHERE workflow_id = v_workflow_id
      AND from_step_id = v_from_step_id
      AND to_step_id = v_to_step_id
  ) INTO v_transition_exists;
  
  RETURN v_transition_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get available transitions for an issue
CREATE OR REPLACE FUNCTION public.get_available_transitions(p_issue_id UUID)
RETURNS TABLE(
  transition_id UUID,
  transition_name TEXT,
  to_status_id UUID,
  to_status_name TEXT,
  to_status_color TEXT,
  to_status_category TEXT
) AS $$
DECLARE
  v_workflow_id UUID;
  v_project_id UUID;
  v_issue_type_id UUID;
  v_current_status_id UUID;
  v_current_step_id UUID;
BEGIN
  -- Get issue details
  SELECT project_id, issue_type_id, status_id 
  INTO v_project_id, v_issue_type_id, v_current_status_id
  FROM issues WHERE id = p_issue_id;
  
  IF v_project_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get the workflow for this issue
  v_workflow_id := get_workflow_for_issue(v_project_id, v_issue_type_id);
  
  IF v_workflow_id IS NULL THEN
    -- No workflow, return all statuses as available
    RETURN QUERY
    SELECT NULL::UUID, 'Move to ' || s.name, s.id, s.name, s.color, s.category::TEXT
    FROM issue_statuses s
    WHERE s.id != v_current_status_id
    ORDER BY s.position;
    RETURN;
  END IF;
  
  -- Get current step
  SELECT id INTO v_current_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = v_current_status_id;
  
  IF v_current_step_id IS NULL THEN
    -- Current status not in workflow, return all statuses in workflow
    RETURN QUERY
    SELECT NULL::UUID, 'Move to ' || s.name, s.id, s.name, s.color, s.category::TEXT
    FROM workflow_steps ws
    JOIN issue_statuses s ON s.id = ws.status_id
    WHERE ws.workflow_id = v_workflow_id AND ws.status_id != v_current_status_id
    ORDER BY s.position;
    RETURN;
  END IF;
  
  -- Return available transitions from current step
  RETURN QUERY
  SELECT 
    wt.id,
    wt.name,
    s.id,
    s.name,
    s.color,
    s.category::TEXT
  FROM workflow_transitions wt
  JOIN workflow_steps to_step ON to_step.id = wt.to_step_id
  JOIN issue_statuses s ON s.id = to_step.status_id
  WHERE wt.workflow_id = v_workflow_id
    AND wt.from_step_id = v_current_step_id
  ORDER BY s.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;