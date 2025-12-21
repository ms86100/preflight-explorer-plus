-- Permission Schemes table
CREATE TABLE public.permission_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permission Scheme Grants (what permissions are granted to which roles)
CREATE TABLE public.permission_scheme_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_id UUID NOT NULL REFERENCES public.permission_schemes(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL, -- e.g., 'browse_project', 'create_issue', 'edit_issue', 'delete_issue', 'manage_sprints'
  role_id UUID REFERENCES public.project_roles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID,
  grant_type TEXT NOT NULL CHECK (grant_type IN ('role', 'group', 'user', 'anyone', 'logged_in')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(scheme_id, permission_key, role_id, group_id, user_id)
);

-- Project Permission Scheme assignment
CREATE TABLE public.project_permission_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.permission_schemes(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id)
);

-- Data Export Audit Log
CREATE TABLE public.export_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL, -- 'issues', 'projects', 'attachments', 'full_backup'
  classification_level TEXT NOT NULL,
  record_count INTEGER,
  file_format TEXT, -- 'csv', 'json', 'xlsx'
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  approver_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.permission_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_scheme_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permission_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permission_schemes
CREATE POLICY "Authenticated can view permission schemes" ON public.permission_schemes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage permission schemes" ON public.permission_schemes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for permission_scheme_grants
CREATE POLICY "Authenticated can view grants" ON public.permission_scheme_grants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage grants" ON public.permission_scheme_grants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for project_permission_schemes
CREATE POLICY "Project members can view project schemes" ON public.project_permission_schemes
  FOR SELECT USING (
    is_project_member(auth.uid(), project_id) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage project schemes" ON public.project_permission_schemes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for export_audit_logs
CREATE POLICY "Users can view own export logs" ON public.export_audit_logs
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create export requests" ON public.export_audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage export logs" ON public.export_audit_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_permission_schemes_updated_at
  BEFORE UPDATE ON public.permission_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permission scheme
INSERT INTO public.permission_schemes (id, name, description, is_default) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Default Permission Scheme', 'Standard permissions for software projects', true);

-- Insert default permission grants
INSERT INTO public.permission_scheme_grants (scheme_id, permission_key, grant_type) VALUES
  ('00000000-0000-0000-0000-000000000002', 'browse_project', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'create_issue', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'edit_issue', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'comment_issue', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'attach_files', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'log_work', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'manage_sprints', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'delete_issue', 'logged_in'),
  ('00000000-0000-0000-0000-000000000002', 'administer_project', 'logged_in');