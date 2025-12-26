-- =============================================
-- JIRA DATA CENTER CLONE - COMPLETE DATABASE SCHEMA
-- Part 2: Workflows, Boards, Sprints
-- =============================================

-- ===================
-- WORKFLOWS
-- ===================
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflows" ON public.workflows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workflows" ON public.workflows
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- WORKFLOW STEPS
-- ===================
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    status_id UUID REFERENCES public.issue_statuses(id),
    name TEXT NOT NULL,
    step_order INTEGER DEFAULT 0,
    is_initial BOOLEAN DEFAULT false,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow steps" ON public.workflow_steps
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workflow steps" ON public.workflow_steps
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- WORKFLOW TRANSITIONS
-- ===================
CREATE TABLE IF NOT EXISTS public.workflow_transitions (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    from_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    to_step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    condition_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow transitions" ON public.workflow_transitions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workflow transitions" ON public.workflow_transitions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- WORKFLOW SCHEMES
-- ===================
CREATE TABLE IF NOT EXISTS public.workflow_schemes (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow schemes" ON public.workflow_schemes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workflow schemes" ON public.workflow_schemes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- WORKFLOW SCHEME MAPPINGS (issue type to workflow)
-- ===================
CREATE TABLE IF NOT EXISTS public.workflow_scheme_mappings (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES public.workflow_schemes(id) ON DELETE CASCADE,
    issue_type_id UUID REFERENCES public.issue_types(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(scheme_id, issue_type_id)
);

ALTER TABLE public.workflow_scheme_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflow scheme mappings" ON public.workflow_scheme_mappings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workflow scheme mappings" ON public.workflow_scheme_mappings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- PROJECT WORKFLOW SCHEMES
-- ===================
CREATE TABLE IF NOT EXISTS public.project_workflow_schemes (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.workflow_schemes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id)
);

ALTER TABLE public.project_workflow_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project workflow schemes" ON public.project_workflow_schemes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage project workflow schemes" ON public.project_workflow_schemes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- BOARDS
-- ===================
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    board_type TEXT NOT NULL DEFAULT 'kanban', -- kanban, scrum
    filter_jql TEXT,
    owner_id UUID REFERENCES public.profiles(id),
    is_private BOOLEAN DEFAULT false,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public boards" ON public.boards
    FOR SELECT USING (is_private = false OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create boards" ON public.boards
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their boards" ON public.boards
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their boards" ON public.boards
    FOR DELETE USING (auth.uid() = owner_id);

-- ===================
-- BOARD COLUMNS
-- ===================
CREATE TABLE IF NOT EXISTS public.board_columns (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    min_issues INTEGER,
    max_issues INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view board columns" ON public.board_columns
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage board columns" ON public.board_columns
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- BOARD COLUMN STATUS MAPPINGS
-- ===================
CREATE TABLE IF NOT EXISTS public.board_column_statuses (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
    status_id UUID NOT NULL REFERENCES public.issue_statuses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(column_id, status_id)
);

ALTER TABLE public.board_column_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view board column statuses" ON public.board_column_statuses
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage board column statuses" ON public.board_column_statuses
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- BOARD SWIMLANES
-- ===================
CREATE TABLE IF NOT EXISTS public.board_swimlanes (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT, -- JQL query
    position INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.board_swimlanes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view board swimlanes" ON public.board_swimlanes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage board swimlanes" ON public.board_swimlanes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- SPRINTS
-- ===================
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    complete_date TIMESTAMP WITH TIME ZONE,
    state TEXT DEFAULT 'future', -- future, active, closed
    sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sprints" ON public.sprints
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage sprints" ON public.sprints
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- SPRINT ISSUES (Many-to-Many)
-- ===================
CREATE TABLE IF NOT EXISTS public.sprint_issues (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    rank TEXT, -- LexoRank value
    UNIQUE(sprint_id, issue_id)
);

ALTER TABLE public.sprint_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sprint issues" ON public.sprint_issues
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage sprint issues" ON public.sprint_issues
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- QUICK FILTERS
-- ===================
CREATE TABLE IF NOT EXISTS public.board_quick_filters (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT NOT NULL, -- JQL query
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.board_quick_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view board quick filters" ON public.board_quick_filters
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage board quick filters" ON public.board_quick_filters
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- CUSTOM FIELD DEFINITIONS
-- ===================
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    field_type TEXT NOT NULL, -- text, number, date, select, multiselect, user, etc.
    default_value TEXT,
    options JSONB, -- For select fields
    validation_rules JSONB,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom field definitions" ON public.custom_field_definitions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage custom field definitions" ON public.custom_field_definitions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- CUSTOM FIELD VALUES
-- ===================
CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    string_value TEXT,
    number_value NUMERIC,
    date_value TIMESTAMP WITH TIME ZONE,
    json_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(issue_id, field_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom field values" ON public.custom_field_values
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage custom field values" ON public.custom_field_values
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ===================
-- SAVED FILTERS
-- ===================
CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    jql TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id),
    is_favorite BOOLEAN DEFAULT false,
    share_permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own and shared filters" ON public.saved_filters
    FOR SELECT USING (auth.uid() = owner_id OR share_permissions IS NOT NULL);

CREATE POLICY "Users can create filters" ON public.saved_filters
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their filters" ON public.saved_filters
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their filters" ON public.saved_filters
    FOR DELETE USING (auth.uid() = owner_id);