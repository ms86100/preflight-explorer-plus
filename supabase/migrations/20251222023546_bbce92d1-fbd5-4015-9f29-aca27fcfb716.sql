-- =============================================
-- PHASE A: SCALABILITY QUICK WINS
-- Indexes + RLS Optimization for 4000+ users
-- =============================================

-- ===================
-- 1. PERFORMANCE INDEXES
-- ===================

-- Issues table - most queried table
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status_id ON issues(status_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority_id ON issues(priority_id);
CREATE INDEX IF NOT EXISTS idx_issues_issue_type_id ON issues(issue_type_id);
CREATE INDEX IF NOT EXISTS idx_issues_epic_id ON issues(epic_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_project_status ON issues(project_id, status_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_created ON issues(project_id, created_at DESC);

-- Sprint issues - frequently joined
CREATE INDEX IF NOT EXISTS idx_sprint_issues_sprint_id ON sprint_issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_issues_issue_id ON sprint_issues(issue_id);

-- Comments - frequently queried by issue
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_issue_id ON attachments(issue_id);

-- Project role actors - used in RLS checks
CREATE INDEX IF NOT EXISTS idx_project_role_actors_project_user ON project_role_actors(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_role_actors_project_group ON project_role_actors(project_id, group_id);

-- Group memberships - used in RLS checks
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);

-- Notifications - user's inbox
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Issue history
CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON issue_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_history_changed_at ON issue_history(changed_at DESC);

-- Boards and sprints
CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_board_id ON sprints(board_id);
CREATE INDEX IF NOT EXISTS idx_sprints_state ON sprints(state);

-- Workflow tables
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status_id ON workflow_steps(status_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from_step ON workflow_transitions(from_step_id);

-- ===================
-- 2. RLS SECURITY FIXES
-- ===================

-- Fix #1: Profiles table - restrict to own profile + admins + project teammates
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id  -- Own profile
  OR has_role(auth.uid(), 'admin')  -- Admins
  OR EXISTS (  -- Project teammates (same project membership)
    SELECT 1 FROM project_role_actors pra1
    JOIN project_role_actors pra2 ON pra1.project_id = pra2.project_id
    WHERE pra1.user_id = auth.uid() 
    AND (pra2.user_id = profiles.id OR EXISTS (
      SELECT 1 FROM group_memberships gm 
      WHERE gm.group_id = pra2.group_id AND gm.user_id = profiles.id
    ))
  )
);

-- Fix #2: Audit logs - only service role can insert (via function)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
-- Create a security definer function for audit log insertion
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_classification_context classification_level DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    classification_context,
    user_id,
    ip_address
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_classification_context,
    auth.uid(),
    NULL
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Fix #3: Issue history - remove overly permissive fallback
DROP POLICY IF EXISTS "Users can view issue history" ON issue_history;
CREATE POLICY "Users can view issue history"
ON issue_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM issues i
    JOIN projects p ON p.id = i.project_id
    WHERE i.id = issue_history.issue_id
    AND (
      p.lead_id = auth.uid()
      OR has_role(auth.uid(), 'admin')
      OR is_project_member(auth.uid(), p.id)
    )
  )
);

-- ===================
-- 3. OPTIMIZED RLS HELPER FUNCTION
-- ===================

-- Create a materialized security function for faster RLS checks
CREATE OR REPLACE FUNCTION is_project_member_fast(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_role_actors pra
    WHERE pra.project_id = _project_id
    AND (
      pra.user_id = _user_id 
      OR pra.group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = _user_id
      )
    )
  )
$$;