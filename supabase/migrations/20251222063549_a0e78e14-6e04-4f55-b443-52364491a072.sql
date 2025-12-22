-- LDAP/AD Integration Tables for Group Sync

-- LDAP Directory Configuration
CREATE TABLE public.ldap_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  server_url TEXT NOT NULL,
  base_dn TEXT NOT NULL,
  bind_dn TEXT,
  port INTEGER DEFAULT 389,
  use_ssl BOOLEAN DEFAULT false,
  search_filter TEXT DEFAULT '(objectClass=user)',
  group_search_filter TEXT DEFAULT '(objectClass=group)',
  group_base_dn TEXT,
  user_id_attribute TEXT DEFAULT 'sAMAccountName',
  email_attribute TEXT DEFAULT 'mail',
  display_name_attribute TEXT DEFAULT 'displayName',
  department_attribute TEXT DEFAULT 'department',
  group_name_attribute TEXT DEFAULT 'cn',
  group_member_attribute TEXT DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  last_sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- LDAP Group to Application Role Mappings
CREATE TABLE public.ldap_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldap_config_id UUID NOT NULL REFERENCES public.ldap_configurations(id) ON DELETE CASCADE,
  ldap_group_dn TEXT NOT NULL,
  ldap_group_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('app_role', 'project_role', 'group')),
  target_role app_role,
  target_project_role_id UUID REFERENCES public.project_roles(id) ON DELETE CASCADE,
  target_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_target CHECK (
    (target_type = 'app_role' AND target_role IS NOT NULL) OR
    (target_type = 'project_role' AND target_project_role_id IS NOT NULL) OR
    (target_type = 'group' AND target_group_id IS NOT NULL)
  )
);

-- LDAP Sync History/Logs
CREATE TABLE public.ldap_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldap_config_id UUID NOT NULL REFERENCES public.ldap_configurations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'webhook')),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  users_synced INTEGER DEFAULT 0,
  groups_synced INTEGER DEFAULT 0,
  roles_assigned INTEGER DEFAULT 0,
  roles_revoked INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  triggered_by UUID REFERENCES auth.users(id)
);

-- LDAP User Cache (stores last known LDAP attributes for users)
CREATE TABLE public.ldap_user_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldap_config_id UUID NOT NULL REFERENCES public.ldap_configurations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ldap_dn TEXT NOT NULL,
  ldap_username TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  department TEXT,
  ldap_groups JSONB DEFAULT '[]'::JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ldap_config_id, ldap_dn)
);

-- Enable RLS
ALTER TABLE public.ldap_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldap_group_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldap_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldap_user_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage LDAP configuration
CREATE POLICY "Admins can view LDAP configurations"
ON public.ldap_configurations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage LDAP configurations"
ON public.ldap_configurations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view LDAP group mappings"
ON public.ldap_group_mappings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage LDAP group mappings"
ON public.ldap_group_mappings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view LDAP sync logs"
ON public.ldap_sync_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage LDAP sync logs"
ON public.ldap_sync_logs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view LDAP user cache"
ON public.ldap_user_cache FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage LDAP user cache"
ON public.ldap_user_cache FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_ldap_group_mappings_config ON public.ldap_group_mappings(ldap_config_id);
CREATE INDEX idx_ldap_sync_logs_config ON public.ldap_sync_logs(ldap_config_id);
CREATE INDEX idx_ldap_sync_logs_status ON public.ldap_sync_logs(status);
CREATE INDEX idx_ldap_user_cache_user ON public.ldap_user_cache(user_id);
CREATE INDEX idx_ldap_user_cache_email ON public.ldap_user_cache(email);

-- Update timestamp triggers
CREATE TRIGGER update_ldap_configurations_updated_at
  BEFORE UPDATE ON public.ldap_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ldap_group_mappings_updated_at
  BEFORE UPDATE ON public.ldap_group_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ldap_user_cache_updated_at
  BEFORE UPDATE ON public.ldap_user_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();