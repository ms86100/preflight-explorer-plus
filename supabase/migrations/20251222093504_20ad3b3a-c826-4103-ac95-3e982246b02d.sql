-- Create project_teams table for per-project teams
CREATE TABLE IF NOT EXISTS public.project_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Create project_team_members table
CREATE TABLE IF NOT EXISTS public.project_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.project_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'lead', 'member'
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create comment_mentions table for tracking @mentions
CREATE TABLE IF NOT EXISTS public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is project admin
CREATE OR REPLACE FUNCTION public.is_project_admin(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = _project_id AND lead_id = _user_id
  ) OR public.has_role(_user_id, 'admin'::app_role)
$$;

-- RLS Policies for project_teams
CREATE POLICY "Users can view teams in projects they can access" ON public.project_teams
  FOR SELECT USING (
    public.is_project_member(auth.uid(), project_id) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Project admins can manage teams" ON public.project_teams
  FOR ALL USING (
    public.is_project_admin(auth.uid(), project_id)
  );

-- RLS Policies for project_team_members
CREATE POLICY "Users can view team members in accessible projects" ON public.project_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_teams pt
      WHERE pt.id = team_id AND (
        public.is_project_member(auth.uid(), pt.project_id) OR 
        public.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "Project admins can manage team members" ON public.project_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_teams pt
      WHERE pt.id = team_id AND public.is_project_admin(auth.uid(), pt.project_id)
    )
  );

-- RLS Policies for comment_mentions
CREATE POLICY "Users can view their own mentions" ON public.comment_mentions
  FOR SELECT USING (
    mentioned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.issues i ON c.issue_id = i.id
      WHERE c.id = comment_id AND public.is_project_member(auth.uid(), i.project_id)
    )
  );

CREATE POLICY "Authenticated users can create mentions" ON public.comment_mentions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_mentions;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON public.project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_id ON public.project_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON public.project_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_mentioned_user_id ON public.comment_mentions(mentioned_user_id);