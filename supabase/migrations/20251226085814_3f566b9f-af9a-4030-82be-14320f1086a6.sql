-- =============================================
-- JIRA DATA CENTER CLONE - COMPLETE DATABASE SCHEMA
-- Part 1: Core Tables - Users, Projects, Issues
-- =============================================

-- ===================
-- USER PROFILES TABLE
-- ===================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data ->> 'display_name', new.email),
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
    );
    RETURN new;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================
-- USER DIRECTORY (for search/mentions)
-- ===================
CREATE TABLE IF NOT EXISTS public.user_directory (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user directory" ON public.user_directory
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own entry" ON public.user_directory
    FOR UPDATE USING (auth.uid() = user_id);

-- ===================
-- PROJECTS
-- ===================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    lead_id UUID REFERENCES public.profiles(id),
    project_type TEXT DEFAULT 'software',
    avatar_url TEXT,
    url TEXT,
    category TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Project leads can update" ON public.projects
    FOR UPDATE USING (auth.uid() = lead_id OR auth.uid() = created_by);

CREATE POLICY "Project leads can delete" ON public.projects
    FOR DELETE USING (auth.uid() = lead_id OR auth.uid() = created_by);

-- ===================
-- ISSUE TYPES
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_types (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#0052CC',
    is_subtask BOOLEAN DEFAULT false,
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue types" ON public.issue_types
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue types" ON public.issue_types
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- PRIORITIES
-- ===================
CREATE TABLE IF NOT EXISTS public.priorities (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#FF5630',
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view priorities" ON public.priorities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage priorities" ON public.priorities
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- ISSUE STATUSES
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_statuses (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#0052CC',
    category TEXT DEFAULT 'todo', -- todo, in_progress, done
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue statuses" ON public.issue_statuses
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue statuses" ON public.issue_statuses
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- RESOLUTIONS
-- ===================
CREATE TABLE IF NOT EXISTS public.resolutions (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resolutions" ON public.resolutions
    FOR SELECT USING (true);

-- ===================
-- COMPONENTS
-- ===================
CREATE TABLE IF NOT EXISTS public.components (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    lead_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view components" ON public.components
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage components" ON public.components
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- VERSIONS (Releases)
-- ===================
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    release_date TIMESTAMP WITH TIME ZONE,
    is_released BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view versions" ON public.versions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage versions" ON public.versions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- ISSUES
-- ===================
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_key TEXT NOT NULL UNIQUE,
    issue_number INTEGER NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    issue_type_id UUID REFERENCES public.issue_types(id),
    status_id UUID REFERENCES public.issue_statuses(id),
    priority_id UUID REFERENCES public.priorities(id),
    resolution_id UUID REFERENCES public.resolutions(id),
    reporter_id UUID REFERENCES public.profiles(id),
    assignee_id UUID REFERENCES public.profiles(id),
    parent_id UUID REFERENCES public.issues(id), -- For subtasks
    epic_id UUID REFERENCES public.issues(id), -- For stories in epics
    environment TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    resolution_date TIMESTAMP WITH TIME ZONE,
    original_estimate INTEGER, -- seconds
    remaining_estimate INTEGER, -- seconds
    time_spent INTEGER, -- seconds
    story_points NUMERIC(5,2),
    labels TEXT[],
    votes INTEGER DEFAULT 0,
    watchers INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issues" ON public.issues
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create issues" ON public.issues
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update issues" ON public.issues
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Issue creators can delete" ON public.issues
    FOR DELETE USING (auth.uid() = created_by OR auth.uid() = reporter_id);

-- Create index for issue key lookups
CREATE INDEX IF NOT EXISTS idx_issues_project ON public.issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_key ON public.issues(issue_key);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON public.issues(assignee_id);

-- ===================
-- ISSUE COMPONENTS (Many-to-Many)
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_components (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(issue_id, component_id)
);

ALTER TABLE public.issue_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue components" ON public.issue_components
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue components" ON public.issue_components
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- ISSUE VERSIONS (Many-to-Many for fix versions and affected versions)
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_versions (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
    version_type TEXT NOT NULL DEFAULT 'fix', -- 'fix' or 'affects'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(issue_id, version_id, version_type)
);

ALTER TABLE public.issue_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue versions" ON public.issue_versions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue versions" ON public.issue_versions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- COMMENTS
-- ===================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- ===================
-- ATTACHMENTS
-- ===================
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    author_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attachments" ON public.attachments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create attachments" ON public.attachments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can delete their attachments" ON public.attachments
    FOR DELETE USING (auth.uid() = author_id);

-- ===================
-- ISSUE LINKS
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_link_types (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    inward_description TEXT NOT NULL,
    outward_description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_link_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue link types" ON public.issue_link_types
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.issue_links (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    link_type_id UUID NOT NULL REFERENCES public.issue_link_types(id) ON DELETE CASCADE,
    source_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    target_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(link_type_id, source_issue_id, target_issue_id)
);

ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue links" ON public.issue_links
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage issue links" ON public.issue_links
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- WORKLOGS
-- ===================
CREATE TABLE IF NOT EXISTS public.worklogs (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    time_spent INTEGER NOT NULL, -- seconds
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view worklogs" ON public.worklogs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create worklogs" ON public.worklogs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their worklogs" ON public.worklogs
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their worklogs" ON public.worklogs
    FOR DELETE USING (auth.uid() = author_id);

-- ===================
-- ISSUE HISTORY (Change Log)
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_history (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    field_name TEXT NOT NULL,
    field_type TEXT,
    old_value TEXT,
    old_string TEXT,
    new_value TEXT,
    new_string TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issue history" ON public.issue_history
    FOR SELECT USING (true);

CREATE POLICY "System can create history" ON public.issue_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===================
-- WATCHERS
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_watchers (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(issue_id, user_id)
);

ALTER TABLE public.issue_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view watchers" ON public.issue_watchers
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their watch status" ON public.issue_watchers
    FOR ALL USING (auth.uid() = user_id);

-- ===================
-- VOTES
-- ===================
CREATE TABLE IF NOT EXISTS public.issue_votes (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(issue_id, user_id)
);

ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.issue_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their votes" ON public.issue_votes
    FOR ALL USING (auth.uid() = user_id);