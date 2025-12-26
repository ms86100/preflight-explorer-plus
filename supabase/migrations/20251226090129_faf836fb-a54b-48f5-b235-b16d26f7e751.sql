-- Part 3: Remaining tables - Git, Notifications, Automation, Audit
CREATE TABLE IF NOT EXISTS public.git_organizations (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    host_url TEXT NOT NULL,
    provider TEXT NOT NULL, -- github, gitlab, bitbucket
    access_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.git_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage git orgs" ON public.git_organizations FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.git_repositories (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.git_organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT,
    default_branch TEXT DEFAULT 'main',
    is_linked BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.git_repositories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage git repos" ON public.git_repositories FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.git_commits (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    commit_hash TEXT NOT NULL,
    message TEXT,
    author_name TEXT,
    author_email TEXT,
    committed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.git_commits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view git commits" ON public.git_commits FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.git_branches (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.git_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view git branches" ON public.git_branches FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.git_pull_requests (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    source_branch TEXT,
    target_branch TEXT,
    status TEXT DEFAULT 'open',
    url TEXT,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.git_pull_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view git PRs" ON public.git_pull_requests FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB,
    conditions JSONB,
    actions JSONB,
    is_enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage automation" ON public.automation_rules FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.export_audit_logs (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    export_type TEXT NOT NULL,
    entity_type TEXT,
    record_count INTEGER,
    file_size INTEGER,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.export_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their exports" ON public.export_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create exports" ON public.export_audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content JSONB,
    template_type TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON public.document_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage templates" ON public.document_templates FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.document_exports (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.document_templates(id),
    name TEXT NOT NULL,
    format TEXT,
    status TEXT DEFAULT 'pending',
    file_path TEXT,
    file_size INTEGER,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.document_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their exports" ON public.document_exports FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create exports" ON public.document_exports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.custom_field_contexts (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_type_id UUID REFERENCES public.issue_types(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_field_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view custom field contexts" ON public.custom_field_contexts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage contexts" ON public.custom_field_contexts FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert default seed data
INSERT INTO public.issue_types (name, description, icon_url, color, is_subtask, sequence) VALUES
('Bug', 'A problem or error', '/icons/bug.svg', '#FF5630', false, 1),
('Story', 'A user story', '/icons/story.svg', '#36B37E', false, 2),
('Task', 'A task to be done', '/icons/task.svg', '#0052CC', false, 3),
('Epic', 'A large feature', '/icons/epic.svg', '#6554C0', false, 4),
('Sub-task', 'A sub-task of an issue', '/icons/subtask.svg', '#0052CC', true, 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.priorities (name, description, color, sequence) VALUES
('Highest', 'This problem will block progress', '#FF5630', 1),
('High', 'Serious problem', '#FF8B00', 2),
('Medium', 'Has workaround', '#FFAB00', 3),
('Low', 'Minor problem', '#36B37E', 4),
('Lowest', 'Trivial problem', '#6554C0', 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.issue_statuses (name, description, color, category, sequence) VALUES
('To Do', 'Work not started', '#DFE1E6', 'todo', 1),
('In Progress', 'Work in progress', '#0052CC', 'in_progress', 2),
('In Review', 'Awaiting review', '#6554C0', 'in_progress', 3),
('Done', 'Work completed', '#36B37E', 'done', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.resolutions (name, description, sequence) VALUES
('Done', 'Work has been completed', 1),
('Won''t Do', 'Work will not be done', 2),
('Duplicate', 'The issue is a duplicate', 3),
('Cannot Reproduce', 'Cannot reproduce the issue', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.issue_link_types (name, inward_description, outward_description) VALUES
('Blocks', 'is blocked by', 'blocks'),
('Clones', 'is cloned by', 'clones'),
('Duplicate', 'is duplicated by', 'duplicates'),
('Relates', 'relates to', 'relates to')
ON CONFLICT DO NOTHING;

-- RPC function for searching profiles
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_term TEXT)
RETURNS TABLE (id UUID, email TEXT, display_name TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.display_name ILIKE '%' || search_term || '%'
     OR p.email ILIKE '%' || search_term || '%'
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT, display_name TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;