-- ============================================
-- JIRA DATA CENTER CLONE - MRTT+ COMPLIANT
-- Full Database Schema Migration
-- ============================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'project_admin', 'developer', 'viewer');
CREATE TYPE public.classification_level AS ENUM ('public', 'restricted', 'confidential', 'export_controlled');
CREATE TYPE public.project_type AS ENUM ('software', 'business');
CREATE TYPE public.project_template AS ENUM ('scrum', 'kanban', 'basic', 'project_management', 'task_management', 'process_management');
CREATE TYPE public.issue_type_category AS ENUM ('standard', 'subtask', 'epic');
CREATE TYPE public.sprint_state AS ENUM ('future', 'active', 'closed');
CREATE TYPE public.board_type AS ENUM ('scrum', 'kanban');
CREATE TYPE public.status_category AS ENUM ('todo', 'in_progress', 'done');

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  department TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  clearance_level classification_level DEFAULT 'restricted',
  nationality TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group memberships
CREATE TABLE public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- PROJECT MANAGEMENT
-- ============================================

-- Project categories
CREATE TABLE public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pkey TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  project_type project_type DEFAULT 'software',
  template project_template DEFAULT 'scrum',
  category_id UUID REFERENCES public.project_categories(id),
  lead_id UUID REFERENCES auth.users(id),
  default_assignee_id UUID REFERENCES auth.users(id),
  avatar_url TEXT,
  url TEXT,
  issue_counter INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  classification classification_level DEFAULT 'restricted',
  program_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project roles
CREATE TABLE public.project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;

-- Project role actors (who has what role in which project)
CREATE TABLE public.project_role_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.project_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_or_group CHECK (
    (user_id IS NOT NULL AND group_id IS NULL) OR
    (user_id IS NULL AND group_id IS NOT NULL)
  )
);

ALTER TABLE public.project_role_actors ENABLE ROW LEVEL SECURITY;

-- Function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_role_actors pra
    LEFT JOIN public.group_memberships gm ON gm.group_id = pra.group_id
    WHERE pra.project_id = _project_id
      AND (pra.user_id = _user_id OR gm.user_id = _user_id)
  )
$$;

-- ============================================
-- ISSUE MANAGEMENT
-- ============================================

-- Issue types
CREATE TABLE public.issue_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT DEFAULT '#0052CC',
  category issue_type_category DEFAULT 'standard',
  is_subtask BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;

-- Priorities
CREATE TABLE public.priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT DEFAULT '#0052CC',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;

-- Resolutions
CREATE TABLE public.resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;

-- Issue statuses
CREATE TABLE public.issue_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#42526E',
  category status_category DEFAULT 'todo',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.issue_statuses ENABLE ROW LEVEL SECURITY;

-- Issues
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL UNIQUE,
  issue_number INTEGER NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  issue_type_id UUID NOT NULL REFERENCES public.issue_types(id),
  status_id UUID NOT NULL REFERENCES public.issue_statuses(id),
  priority_id UUID REFERENCES public.priorities(id),
  resolution_id UUID REFERENCES public.resolutions(id),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES public.issues(id),
  epic_id UUID REFERENCES public.issues(id),
  due_date DATE,
  original_estimate INTEGER,
  remaining_estimate INTEGER,
  time_spent INTEGER,
  story_points INTEGER,
  environment TEXT,
  lexorank TEXT,
  classification classification_level DEFAULT 'restricted',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_issues_project ON public.issues(project_id);
CREATE INDEX idx_issues_assignee ON public.issues(assignee_id);
CREATE INDEX idx_issues_status ON public.issues(status_id);
CREATE INDEX idx_issues_lexorank ON public.issues(lexorank);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Attachments
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  classification classification_level DEFAULT 'restricted',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Labels
CREATE TABLE public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- Issue labels junction
CREATE TABLE public.issue_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  UNIQUE(issue_id, label_id)
);

ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;

-- Components
CREATE TABLE public.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Versions
CREATE TABLE public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  release_date DATE,
  is_released BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

-- Worklogs
CREATE TABLE public.worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  time_spent INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BOARDS & SPRINTS
-- ============================================

-- Boards
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  board_type board_type DEFAULT 'scrum',
  filter_jql TEXT,
  is_private BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Board columns
CREATE TABLE public.board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  min_issues INTEGER,
  max_issues INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

-- Board column statuses
CREATE TABLE public.board_column_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
  UNIQUE(column_id, status_id)
);

ALTER TABLE public.board_column_statuses ENABLE ROW LEVEL SECURITY;

-- Sprints
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  state sprint_state DEFAULT 'future',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Sprint issues junction
CREATE TABLE public.sprint_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sprint_id, issue_id)
);

ALTER TABLE public.sprint_issues ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDIT LOG (MRTT+ COMPLIANCE)
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  classification_context classification_level,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'developer' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'developer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate issue key
CREATE OR REPLACE FUNCTION public.generate_issue_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  project_key TEXT;
  next_number INTEGER;
BEGIN
  SELECT pkey, issue_counter + 1 INTO project_key, next_number
  FROM public.projects WHERE id = NEW.project_id
  FOR UPDATE;
  
  UPDATE public.projects SET issue_counter = next_number WHERE id = NEW.project_id;
  
  NEW.issue_number := next_number;
  NEW.issue_key := project_key || '-' || next_number;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_issue_insert
  BEFORE INSERT ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.generate_issue_key();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: Users can read all, update own
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles: Admins can manage, users can view own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Groups: Authenticated can read
CREATE POLICY "Authenticated users can view groups" ON public.groups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage groups" ON public.groups
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Group memberships
CREATE POLICY "Users can view group memberships" ON public.group_memberships
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage group memberships" ON public.group_memberships
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Project categories
CREATE POLICY "Authenticated can view project categories" ON public.project_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage project categories" ON public.project_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Projects: Members can view, admins can manage
CREATE POLICY "Users can view accessible projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_project_member(auth.uid(), id) OR
    lead_id = auth.uid()
  );

CREATE POLICY "Admins can insert projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_admin'));

CREATE POLICY "Project leads and admins can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR lead_id = auth.uid());

-- Project roles
CREATE POLICY "Authenticated can view project roles" ON public.project_roles
  FOR SELECT TO authenticated USING (true);

-- Project role actors
CREATE POLICY "Members can view project role actors" ON public.project_role_actors
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project leads can manage role actors" ON public.project_role_actors
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND lead_id = auth.uid())
  );

-- Issue types, priorities, resolutions, statuses: Read-only for authenticated
CREATE POLICY "Authenticated can view issue types" ON public.issue_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage issue types" ON public.issue_types
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view priorities" ON public.priorities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage priorities" ON public.priorities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view resolutions" ON public.resolutions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage resolutions" ON public.resolutions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view issue statuses" ON public.issue_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage issue statuses" ON public.issue_statuses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Issues: Project members can CRUD
CREATE POLICY "Project members can view issues" ON public.issues
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project members can create issues" ON public.issues
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project members can update issues" ON public.issues
  FOR UPDATE TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project admins can delete issues" ON public.issues
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR reporter_id = auth.uid());

-- Comments
CREATE POLICY "Project members can view comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Authors can update own comments" ON public.comments
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments" ON public.comments
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Attachments
CREATE POLICY "Project members can view attachments" ON public.attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can create attachments" ON public.attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Labels
CREATE POLICY "Project members can view labels" ON public.labels
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project members can manage labels" ON public.labels
  FOR ALL TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

-- Issue labels
CREATE POLICY "Project members can view issue labels" ON public.issue_labels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can manage issue labels" ON public.issue_labels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Components
CREATE POLICY "Project members can view components" ON public.components
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project leads can manage components" ON public.components
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND lead_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Versions
CREATE POLICY "Project members can view versions" ON public.versions
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project leads can manage versions" ON public.versions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND lead_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Worklogs
CREATE POLICY "Project members can view worklogs" ON public.worklogs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can create worklogs" ON public.worklogs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (public.is_project_member(auth.uid(), i.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Authors can update own worklogs" ON public.worklogs
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Boards
CREATE POLICY "Project members can view boards" ON public.boards
  FOR SELECT TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project members can manage boards" ON public.boards
  FOR ALL TO authenticated
  USING (public.is_project_member(auth.uid(), project_id) OR public.has_role(auth.uid(), 'admin'));

-- Board columns
CREATE POLICY "Project members can view board columns" ON public.board_columns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can manage board columns" ON public.board_columns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Board column statuses
CREATE POLICY "Project members can view board column statuses" ON public.board_column_statuses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.board_columns bc
      JOIN public.boards b ON b.id = bc.board_id
      WHERE bc.id = column_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can manage board column statuses" ON public.board_column_statuses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.board_columns bc
      JOIN public.boards b ON b.id = bc.board_id
      WHERE bc.id = column_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Sprints
CREATE POLICY "Project members can view sprints" ON public.sprints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can manage sprints" ON public.sprints
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Sprint issues
CREATE POLICY "Project members can view sprint issues" ON public.sprint_issues
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.boards b ON b.id = s.board_id
      WHERE s.id = sprint_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Project members can manage sprint issues" ON public.sprint_issues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      JOIN public.boards b ON b.id = s.board_id
      WHERE s.id = sprint_id
      AND (public.is_project_member(auth.uid(), b.project_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Audit logs: Admins can view, system can insert
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);