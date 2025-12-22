-- =============================================
-- GIT & CI/CD INTEGRATION SCHEMA
-- Phase 1: Complete database schema for Git integration
-- =============================================

-- 1. Git Provider Organizations (GitLab org, GitHub org, Bitbucket workspace)
CREATE TABLE public.git_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_url TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('gitlab', 'github', 'bitbucket')),
  oauth_client_id TEXT,
  oauth_client_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 2. Repositories linked to Jira projects
CREATE TABLE public.git_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.git_organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  remote_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  clone_url TEXT,
  web_url TEXT,
  default_branch TEXT DEFAULT 'main',
  smartcommits_enabled BOOLEAN DEFAULT true,
  last_commit_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, remote_id)
);

-- 3. Commits
CREATE TABLE public.git_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  message TEXT,
  committed_at TIMESTAMPTZ,
  files_changed INTEGER DEFAULT 0,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  web_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repository_id, commit_hash)
);

-- 4. Commit-Issue linking (many-to-many)
CREATE TABLE public.git_commit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id UUID REFERENCES public.git_commits(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  smartcommit_processed BOOLEAN DEFAULT false,
  smartcommit_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(commit_id, issue_id)
);

-- 5. Branches
CREATE TABLE public.git_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  web_url TEXT,
  is_default BOOLEAN DEFAULT false,
  last_commit_hash TEXT,
  last_commit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repository_id, name)
);

-- 6. Pull/Merge Requests
CREATE TABLE public.git_pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
  remote_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  author_name TEXT,
  author_email TEXT,
  source_branch TEXT,
  destination_branch TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'merged', 'declined', 'closed')),
  web_url TEXT,
  reviewers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  merged_at TIMESTAMPTZ,
  UNIQUE(repository_id, remote_id)
);

-- 7. PR-Issue linking
CREATE TABLE public.git_pull_request_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pull_request_id UUID REFERENCES public.git_pull_requests(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pull_request_id, issue_id)
);

-- 8. Builds (CI/CD status)
CREATE TABLE public.git_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
  commit_id UUID REFERENCES public.git_commits(id) ON DELETE SET NULL,
  remote_id TEXT,
  build_number TEXT,
  pipeline_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'canceled')),
  web_url TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Deployments
CREATE TABLE public.git_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES public.git_repositories(id) ON DELETE CASCADE,
  commit_id UUID REFERENCES public.git_commits(id) ON DELETE SET NULL,
  build_id UUID REFERENCES public.git_builds(id) ON DELETE SET NULL,
  remote_id TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production', 'testing', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
  web_url TEXT,
  deployed_at TIMESTAMPTZ DEFAULT now(),
  deployed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Deployment-Issue linking
CREATE TABLE public.git_deployment_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES public.git_deployments(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deployment_id, issue_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_git_repositories_org ON public.git_repositories(organization_id);
CREATE INDEX idx_git_repositories_project ON public.git_repositories(project_id);
CREATE INDEX idx_git_commits_repo ON public.git_commits(repository_id);
CREATE INDEX idx_git_commits_hash ON public.git_commits(commit_hash);
CREATE INDEX idx_git_commit_issues_commit ON public.git_commit_issues(commit_id);
CREATE INDEX idx_git_commit_issues_issue ON public.git_commit_issues(issue_id);
CREATE INDEX idx_git_branches_repo ON public.git_branches(repository_id);
CREATE INDEX idx_git_branches_issue ON public.git_branches(issue_id);
CREATE INDEX idx_git_pull_requests_repo ON public.git_pull_requests(repository_id);
CREATE INDEX idx_git_pull_request_issues_pr ON public.git_pull_request_issues(pull_request_id);
CREATE INDEX idx_git_pull_request_issues_issue ON public.git_pull_request_issues(issue_id);
CREATE INDEX idx_git_builds_repo ON public.git_builds(repository_id);
CREATE INDEX idx_git_builds_commit ON public.git_builds(commit_id);
CREATE INDEX idx_git_deployments_repo ON public.git_deployments(repository_id);
CREATE INDEX idx_git_deployments_commit ON public.git_deployments(commit_id);
CREATE INDEX idx_git_deployment_issues_deployment ON public.git_deployment_issues(deployment_id);
CREATE INDEX idx_git_deployment_issues_issue ON public.git_deployment_issues(issue_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.git_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_commit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_pull_request_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_deployment_issues ENABLE ROW LEVEL SECURITY;

-- Git Organizations: Admins can manage, authenticated users can view active ones
CREATE POLICY "Admins can manage git organizations"
  ON public.git_organizations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active git organizations"
  ON public.git_organizations FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Git Repositories: Project members can view repos linked to their projects
CREATE POLICY "Admins can manage git repositories"
  ON public.git_repositories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project members can view linked repositories"
  ON public.git_repositories FOR SELECT
  USING (
    is_active = true AND (
      project_id IS NULL OR
      is_project_member(auth.uid(), project_id) OR
      EXISTS (SELECT 1 FROM public.projects WHERE id = git_repositories.project_id AND lead_id = auth.uid())
    )
  );

-- Git Commits: Viewable by project members
CREATE POLICY "Project members can view commits"
  ON public.git_commits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.git_repositories r
      WHERE r.id = git_commits.repository_id
      AND (
        r.project_id IS NULL OR
        is_project_member(auth.uid(), r.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = r.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can insert commits"
  ON public.git_commits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Git Commit Issues: Viewable by project members
CREATE POLICY "Project members can view commit-issue links"
  ON public.git_commit_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = git_commit_issues.issue_id
      AND (
        is_project_member(auth.uid(), i.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = i.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can insert commit-issue links"
  ON public.git_commit_issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Git Branches: Viewable by project members
CREATE POLICY "Project members can view branches"
  ON public.git_branches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.git_repositories r
      WHERE r.id = git_branches.repository_id
      AND (
        r.project_id IS NULL OR
        is_project_member(auth.uid(), r.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = r.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "Authenticated users can manage branches"
  ON public.git_branches FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Git Pull Requests: Viewable by project members
CREATE POLICY "Project members can view pull requests"
  ON public.git_pull_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.git_repositories r
      WHERE r.id = git_pull_requests.repository_id
      AND (
        r.project_id IS NULL OR
        is_project_member(auth.uid(), r.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = r.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can insert pull requests"
  ON public.git_pull_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update pull requests"
  ON public.git_pull_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Git PR Issues: Viewable by project members
CREATE POLICY "Project members can view pr-issue links"
  ON public.git_pull_request_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = git_pull_request_issues.issue_id
      AND (
        is_project_member(auth.uid(), i.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = i.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can insert pr-issue links"
  ON public.git_pull_request_issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Git Builds: Viewable by project members
CREATE POLICY "Project members can view builds"
  ON public.git_builds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.git_repositories r
      WHERE r.id = git_builds.repository_id
      AND (
        r.project_id IS NULL OR
        is_project_member(auth.uid(), r.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = r.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can manage builds"
  ON public.git_builds FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Git Deployments: Viewable by project members
CREATE POLICY "Project members can view deployments"
  ON public.git_deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.git_repositories r
      WHERE r.id = git_deployments.repository_id
      AND (
        r.project_id IS NULL OR
        is_project_member(auth.uid(), r.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = r.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can manage deployments"
  ON public.git_deployments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Git Deployment Issues: Viewable by project members
CREATE POLICY "Project members can view deployment-issue links"
  ON public.git_deployment_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = git_deployment_issues.issue_id
      AND (
        is_project_member(auth.uid(), i.project_id) OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = i.project_id AND lead_id = auth.uid()) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "System can insert deployment-issue links"
  ON public.git_deployment_issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER update_git_organizations_updated_at
  BEFORE UPDATE ON public.git_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_git_repositories_updated_at
  BEFORE UPDATE ON public.git_repositories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_git_branches_updated_at
  BEFORE UPDATE ON public.git_branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_git_pull_requests_updated_at
  BEFORE UPDATE ON public.git_pull_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_git_builds_updated_at
  BEFORE UPDATE ON public.git_builds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_git_deployments_updated_at
  BEFORE UPDATE ON public.git_deployments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();