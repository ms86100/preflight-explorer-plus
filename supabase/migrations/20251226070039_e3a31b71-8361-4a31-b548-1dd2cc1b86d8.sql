-- =============================================
-- Knowledge Hub (Confluence-like) Database Schema
-- Using IP-safe terminology and original design
-- =============================================

-- Create knowledge hub type enum (using original terminology)
CREATE TYPE public.knowledge_hub_type AS ENUM ('team', 'project', 'personal', 'documentation');
CREATE TYPE public.knowledge_hub_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.hub_permission_level AS ENUM ('view', 'edit', 'admin');
CREATE TYPE public.label_color AS ENUM ('blue', 'green', 'yellow', 'red', 'purple', 'gray');

-- =============================================
-- Knowledge Hubs (equivalent to Spaces)
-- =============================================
CREATE TABLE public.knowledge_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  type knowledge_hub_type NOT NULL DEFAULT 'team',
  status knowledge_hub_status NOT NULL DEFAULT 'active',
  icon VARCHAR(50),
  color VARCHAR(7),
  homepage_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_knowledge_hubs_key ON public.knowledge_hubs(key);
CREATE INDEX idx_knowledge_hubs_created_by ON public.knowledge_hubs(created_by);
CREATE INDEX idx_knowledge_hubs_status ON public.knowledge_hubs(status);

-- Enable RLS
ALTER TABLE public.knowledge_hubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_hubs
CREATE POLICY "Users can view active hubs they have access to"
  ON public.knowledge_hubs FOR SELECT
  USING (
    status = 'active' OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create hubs"
  ON public.knowledge_hubs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Hub creators can update their hubs"
  ON public.knowledge_hubs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Hub creators can delete their hubs"
  ON public.knowledge_hubs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =============================================
-- Hub Members (for permission management)
-- =============================================
CREATE TABLE public.hub_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES public.knowledge_hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level hub_permission_level NOT NULL DEFAULT 'view',
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hub_id, user_id)
);

CREATE INDEX idx_hub_members_hub ON public.hub_members(hub_id);
CREATE INDEX idx_hub_members_user ON public.hub_members(user_id);

ALTER TABLE public.hub_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check hub membership
CREATE OR REPLACE FUNCTION public.has_hub_access(hub_uuid UUID, required_level hub_permission_level DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hub_members
    WHERE hub_id = hub_uuid
      AND user_id = auth.uid()
      AND (
        permission_level = required_level 
        OR permission_level = 'admin' 
        OR (required_level = 'view' AND permission_level IN ('view', 'edit', 'admin'))
        OR (required_level = 'edit' AND permission_level IN ('edit', 'admin'))
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.knowledge_hubs
    WHERE id = hub_uuid AND created_by = auth.uid()
  )
$$;

CREATE POLICY "Members can view their memberships"
  ON public.hub_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_hub_access(hub_id, 'admin'));

CREATE POLICY "Admins can manage members"
  ON public.hub_members FOR ALL
  TO authenticated
  USING (public.has_hub_access(hub_id, 'admin'));

-- =============================================
-- Content Pages (equivalent to Pages)
-- =============================================
CREATE TABLE public.content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES public.knowledge_hubs(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  status content_status NOT NULL DEFAULT 'draft',
  parent_id UUID REFERENCES public.content_pages(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_content_pages_hub ON public.content_pages(hub_id);
CREATE INDEX idx_content_pages_parent ON public.content_pages(parent_id);
CREATE INDEX idx_content_pages_status ON public.content_pages(status);
CREATE INDEX idx_content_pages_slug ON public.content_pages(hub_id, slug);
CREATE INDEX idx_content_pages_position ON public.content_pages(hub_id, parent_id, position);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published pages or their own drafts"
  ON public.content_pages FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    OR created_by = auth.uid() 
    OR public.has_hub_access(hub_id, 'view')
  );

CREATE POLICY "Users with edit access can create pages"
  ON public.content_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_hub_access(hub_id, 'edit') OR 
    EXISTS (SELECT 1 FROM public.knowledge_hubs WHERE id = hub_id AND created_by = auth.uid())
  );

CREATE POLICY "Users can update pages they created or have edit access"
  ON public.content_pages FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    public.has_hub_access(hub_id, 'edit')
  );

CREATE POLICY "Users can delete pages they created or have admin access"
  ON public.content_pages FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    public.has_hub_access(hub_id, 'admin')
  );

-- =============================================
-- Page Versions (for history/versioning)
-- =============================================
CREATE TABLE public.page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content JSONB NOT NULL,
  change_message TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, version)
);

CREATE INDEX idx_page_versions_page ON public.page_versions(page_id);

ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of accessible pages"
  ON public.page_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_pages p
      WHERE p.id = page_id
      AND (p.status = 'published' OR p.created_by = auth.uid() OR public.has_hub_access(p.hub_id, 'view'))
    )
  );

CREATE POLICY "System can create versions"
  ON public.page_versions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- =============================================
-- Content Labels (for tagging/categorization)
-- =============================================
CREATE TABLE public.content_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES public.knowledge_hubs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color label_color NOT NULL DEFAULT 'blue',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hub_id, name)
);

CREATE INDEX idx_content_labels_hub ON public.content_labels(hub_id);

ALTER TABLE public.content_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labels"
  ON public.content_labels FOR SELECT
  TO authenticated
  USING (hub_id IS NULL OR public.has_hub_access(hub_id, 'view'));

CREATE POLICY "Users with edit access can manage labels"
  ON public.content_labels FOR ALL
  TO authenticated
  USING (hub_id IS NULL OR public.has_hub_access(hub_id, 'edit'));

-- =============================================
-- Page Labels (many-to-many)
-- =============================================
CREATE TABLE public.page_labels (
  page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.content_labels(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (page_id, label_id)
);

ALTER TABLE public.page_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view page labels"
  ON public.page_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_pages p
      WHERE p.id = page_id AND public.has_hub_access(p.hub_id, 'view')
    )
  );

CREATE POLICY "Users with edit access can manage page labels"
  ON public.page_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_pages p
      WHERE p.id = page_id AND public.has_hub_access(p.hub_id, 'edit')
    )
  );

-- =============================================
-- Page Comments
-- =============================================
CREATE TABLE public.page_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.page_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  inline_marker JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_page_comments_page ON public.page_comments(page_id);
CREATE INDEX idx_page_comments_parent ON public.page_comments(parent_id);

ALTER TABLE public.page_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible pages"
  ON public.page_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_pages p
      WHERE p.id = page_id AND public.has_hub_access(p.hub_id, 'view')
    )
  );

CREATE POLICY "Users with view access can create comments"
  ON public.page_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.content_pages p
      WHERE p.id = page_id AND public.has_hub_access(p.hub_id, 'view')
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.page_comments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.page_comments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =============================================
-- Content Templates
-- =============================================
CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES public.knowledge_hubs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  category VARCHAR(100),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_templates_hub ON public.content_templates(hub_id);
CREATE INDEX idx_content_templates_global ON public.content_templates(is_global);

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global templates and hub templates"
  ON public.content_templates FOR SELECT
  TO authenticated
  USING (is_global = TRUE OR hub_id IS NULL OR public.has_hub_access(hub_id, 'view'));

CREATE POLICY "Users with edit access can manage hub templates"
  ON public.content_templates FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    (hub_id IS NOT NULL AND public.has_hub_access(hub_id, 'admin'))
  );

-- =============================================
-- Recent Pages (for tracking user activity)
-- =============================================
CREATE TABLE public.recent_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_id)
);

CREATE INDEX idx_recent_pages_user ON public.recent_pages(user_id, visited_at DESC);

ALTER TABLE public.recent_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recent pages"
  ON public.recent_pages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own recent pages"
  ON public.recent_pages FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_hubs_updated_at
  BEFORE UPDATE ON public.knowledge_hubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at
  BEFORE UPDATE ON public.content_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_comments_updated_at
  BEFORE UPDATE ON public.page_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Auto-create version on page update
-- =============================================
CREATE OR REPLACE FUNCTION public.create_page_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.page_versions (page_id, version, title, content, created_by)
    VALUES (OLD.id, OLD.version, OLD.title, OLD.content, NEW.updated_by);
    
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_page_version_trigger
  BEFORE UPDATE ON public.content_pages
  FOR EACH ROW EXECUTE FUNCTION public.create_page_version();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_hubs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_comments;