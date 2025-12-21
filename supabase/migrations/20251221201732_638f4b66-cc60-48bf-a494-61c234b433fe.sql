-- Create plugins table for marketplace and installed plugins
CREATE TABLE IF NOT EXISTS public.plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- e.g., 'com.example.myplugin'
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  vendor TEXT,
  vendor_url TEXT,
  documentation_url TEXT,
  icon_url TEXT,
  category TEXT NOT NULL DEFAULT 'other', -- workflow, automation, reports, integration, admin, other
  is_system BOOLEAN NOT NULL DEFAULT false, -- Built-in vs marketplace
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '[]', -- Required permissions
  hooks JSONB DEFAULT '[]', -- Event hooks this plugin subscribes to
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plugin installations per project
CREATE TABLE IF NOT EXISTS public.plugin_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- NULL = global installation
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}', -- Project-specific config overrides
  installed_by UUID NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create automation rules table (for Automation plugin)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- NULL = global rule
  trigger_type TEXT NOT NULL, -- issue_created, issue_updated, status_changed, scheduled, manual
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]', -- Array of condition objects
  actions JSONB NOT NULL DEFAULT '[]', -- Array of action objects
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  run_as_user UUID, -- User context for execution
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create automation execution logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_event JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Plugins are readable by all authenticated users
CREATE POLICY "Anyone can view plugins" ON public.plugins
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plugins" ON public.plugins
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Plugin installations
CREATE POLICY "Users can view plugin installations" ON public.plugin_installations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plugin installations" ON public.plugin_installations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Automation rules
CREATE POLICY "Users can view automation rules" ON public.automation_rules
  FOR SELECT USING (
    project_id IS NULL OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (lead_id = auth.uid() OR is_project_member(auth.uid(), id)))
  );

CREATE POLICY "Project leads can manage automation rules" ON public.automation_rules
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND lead_id = auth.uid()))
  );

-- Automation logs
CREATE POLICY "Users can view automation logs" ON public.automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automation_rules ar
      WHERE ar.id = rule_id
      AND (ar.project_id IS NULL OR EXISTS (SELECT 1 FROM projects WHERE id = ar.project_id AND (lead_id = auth.uid() OR is_project_member(auth.uid(), id))))
    )
  );

-- Insert built-in system plugins
INSERT INTO public.plugins (key, name, description, category, is_system, version, vendor) VALUES
  ('com.jira.core', 'Jira Core', 'Core issue tracking and project management', 'core', true, '1.0.0', 'System'),
  ('com.jira.agile', 'Jira Agile', 'Scrum and Kanban boards for agile teams', 'agile', true, '1.0.0', 'System'),
  ('com.jira.workflow', 'Workflow Engine', 'Custom workflow states and transitions', 'workflow', true, '1.0.0', 'System'),
  ('com.jira.automation', 'Automation for Jira', 'No-code automation rules', 'automation', true, '1.0.0', 'System'),
  ('com.jira.customfields', 'Custom Fields', 'Define custom fields for issues', 'admin', true, '1.0.0', 'System'),
  ('com.jira.permissions', 'Permission Schemes', 'Role-based access control', 'admin', true, '1.0.0', 'System'),
  ('com.jira.notifications', 'Notification Schemes', 'Email and in-app notifications', 'integration', true, '1.0.0', 'System'),
  ('com.jira.reports', 'Reports & Dashboards', 'Burndown, velocity, and custom reports', 'reports', true, '1.0.0', 'System'),
  ('com.jira.audit', 'Audit Log', 'Activity and security audit logging', 'admin', true, '1.0.0', 'System'),
  ('com.jira.compliance', 'Compliance Manager', 'Data classification and export controls', 'admin', true, '1.0.0', 'System')
ON CONFLICT (key) DO NOTHING;

-- Add realtime for automation logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;