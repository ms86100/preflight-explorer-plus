-- Create workflows table
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow_steps table (statuses in workflow)
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  is_initial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workflow_id, status_id)
);

-- Create workflow_transitions table
CREATE TABLE public.workflow_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  from_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  to_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workflow_id, from_step_id, to_step_id)
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Project members can view workflows" ON public.workflows
  FOR SELECT USING (
    project_id IS NULL OR 
    is_project_member(auth.uid(), project_id) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Project leads can manage workflows" ON public.workflows
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = workflows.project_id 
      AND projects.lead_id = auth.uid()
    )
  );

-- RLS Policies for workflow_steps
CREATE POLICY "Users can view workflow steps" ON public.workflow_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w 
      WHERE w.id = workflow_steps.workflow_id 
      AND (w.project_id IS NULL OR is_project_member(auth.uid(), w.project_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins can manage workflow steps" ON public.workflow_steps
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM workflows w 
      JOIN projects p ON p.id = w.project_id 
      WHERE w.id = workflow_steps.workflow_id 
      AND p.lead_id = auth.uid()
    )
  );

-- RLS Policies for workflow_transitions
CREATE POLICY "Users can view workflow transitions" ON public.workflow_transitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w 
      WHERE w.id = workflow_transitions.workflow_id 
      AND (w.project_id IS NULL OR is_project_member(auth.uid(), w.project_id) OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins can manage workflow transitions" ON public.workflow_transitions
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM workflows w 
      JOIN projects p ON p.id = w.project_id 
      WHERE w.id = workflow_transitions.workflow_id 
      AND p.lead_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default workflow with steps and transitions
INSERT INTO public.workflows (id, name, description, is_default, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Software Workflow', 'Standard workflow for software projects', true, true);

-- Get status IDs and insert workflow steps
WITH status_ids AS (
  SELECT id, name, category FROM issue_statuses
)
INSERT INTO public.workflow_steps (workflow_id, status_id, position_x, position_y, is_initial)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  id,
  CASE name 
    WHEN 'Open' THEN 100
    WHEN 'In Progress' THEN 300
    WHEN 'In Review' THEN 500
    WHEN 'Done' THEN 700
    ELSE 100
  END,
  200,
  CASE WHEN category = 'todo' AND name = 'Open' THEN true ELSE false END
FROM status_ids;

-- Insert workflow transitions
WITH steps AS (
  SELECT ws.id, ist.name as status_name
  FROM workflow_steps ws
  JOIN issue_statuses ist ON ist.id = ws.status_id
  WHERE ws.workflow_id = '00000000-0000-0000-0000-000000000001'
)
INSERT INTO public.workflow_transitions (workflow_id, from_step_id, to_step_id, name)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  f.id,
  t.id,
  'Move to ' || t.status_name
FROM steps f, steps t
WHERE f.status_name = 'Open' AND t.status_name = 'In Progress'
   OR f.status_name = 'In Progress' AND t.status_name = 'In Review'
   OR f.status_name = 'In Review' AND t.status_name = 'Done'
   OR f.status_name = 'In Progress' AND t.status_name = 'Open'
   OR f.status_name = 'In Review' AND t.status_name = 'In Progress';