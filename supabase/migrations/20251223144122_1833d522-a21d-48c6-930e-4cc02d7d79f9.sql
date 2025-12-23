-- Create sprint_history table for full audit trail
CREATE TABLE public.sprint_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'started', 'completed', 'edited', 'issue_added', 'issue_removed'
  actor_id UUID, -- User who performed the action
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL, -- For issue add/remove events
  issue_key TEXT, -- Cached issue key for display even if issue deleted
  old_values JSONB, -- Previous state (for edits)
  new_values JSONB, -- New state (for edits)
  metadata JSONB, -- Additional context (issue count, spillover count, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_sprint_history_sprint_id ON public.sprint_history(sprint_id);
CREATE INDEX idx_sprint_history_created_at ON public.sprint_history(created_at DESC);
CREATE INDEX idx_sprint_history_action ON public.sprint_history(action);

-- Enable RLS
ALTER TABLE public.sprint_history ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can view history for sprints in projects they're members of
CREATE POLICY "Users can view sprint history for their projects"
ON public.sprint_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sprints s
    JOIN public.boards b ON b.id = s.board_id
    JOIN public.projects p ON p.id = b.project_id
    WHERE s.id = sprint_history.sprint_id
    AND public.is_project_member_fast(auth.uid(), p.id)
  )
);

-- Only system/triggers should insert history
CREATE POLICY "System can insert sprint history"
ON public.sprint_history
FOR INSERT
WITH CHECK (true);

-- Create function to log sprint creation
CREATE OR REPLACE FUNCTION public.log_sprint_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO sprint_history (sprint_id, action, actor_id, new_values, metadata)
  VALUES (
    NEW.id,
    'created',
    auth.uid(),
    jsonb_build_object(
      'name', NEW.name,
      'goal', NEW.goal,
      'state', NEW.state
    ),
    jsonb_build_object('board_id', NEW.board_id)
  );
  RETURN NEW;
END;
$$;

-- Create function to log sprint updates (start, complete, edit)
CREATE OR REPLACE FUNCTION public.log_sprint_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB := '{}';
  v_issue_count INTEGER;
  v_completed_count INTEGER;
BEGIN
  -- Determine the action type
  IF OLD.state = 'future' AND NEW.state = 'active' THEN
    v_action := 'started';
    -- Count issues in sprint
    SELECT COUNT(*) INTO v_issue_count FROM sprint_issues WHERE sprint_id = NEW.id;
    v_metadata := jsonb_build_object('issue_count', v_issue_count);
  ELSIF OLD.state = 'active' AND NEW.state = 'closed' THEN
    v_action := 'completed';
    -- Count completed vs total
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE i.status_id IN (SELECT id FROM issue_statuses WHERE category = 'done'))
    INTO v_issue_count, v_completed_count
    FROM sprint_issues si
    JOIN issues i ON i.id = si.issue_id
    WHERE si.sprint_id = NEW.id;
    v_metadata := jsonb_build_object(
      'total_issues', v_issue_count,
      'completed_issues', v_completed_count,
      'spillover_issues', v_issue_count - v_completed_count
    );
  ELSE
    v_action := 'edited';
  END IF;

  INSERT INTO sprint_history (sprint_id, action, actor_id, old_values, new_values, metadata)
  VALUES (
    NEW.id,
    v_action,
    auth.uid(),
    jsonb_build_object(
      'name', OLD.name,
      'goal', OLD.goal,
      'state', OLD.state,
      'start_date', OLD.start_date,
      'end_date', OLD.end_date
    ),
    jsonb_build_object(
      'name', NEW.name,
      'goal', NEW.goal,
      'state', NEW.state,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    ),
    v_metadata
  );
  RETURN NEW;
END;
$$;

-- Create function to log issue added to sprint
CREATE OR REPLACE FUNCTION public.log_sprint_issue_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_issue_key TEXT;
BEGIN
  SELECT issue_key INTO v_issue_key FROM issues WHERE id = NEW.issue_id;
  
  INSERT INTO sprint_history (sprint_id, action, actor_id, issue_id, issue_key, metadata)
  VALUES (
    NEW.sprint_id,
    'issue_added',
    auth.uid(),
    NEW.issue_id,
    v_issue_key,
    jsonb_build_object('sprint_issue_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Create function to log issue removed from sprint
CREATE OR REPLACE FUNCTION public.log_sprint_issue_removed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_issue_key TEXT;
BEGIN
  SELECT issue_key INTO v_issue_key FROM issues WHERE id = OLD.issue_id;
  
  INSERT INTO sprint_history (sprint_id, action, actor_id, issue_id, issue_key, metadata)
  VALUES (
    OLD.sprint_id,
    'issue_removed',
    auth.uid(),
    OLD.issue_id,
    v_issue_key,
    NULL
  );
  RETURN OLD;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_log_sprint_created
AFTER INSERT ON public.sprints
FOR EACH ROW
EXECUTE FUNCTION public.log_sprint_created();

CREATE TRIGGER trigger_log_sprint_updated
AFTER UPDATE ON public.sprints
FOR EACH ROW
EXECUTE FUNCTION public.log_sprint_updated();

CREATE TRIGGER trigger_log_sprint_issue_added
AFTER INSERT ON public.sprint_issues
FOR EACH ROW
EXECUTE FUNCTION public.log_sprint_issue_added();

CREATE TRIGGER trigger_log_sprint_issue_removed
AFTER DELETE ON public.sprint_issues
FOR EACH ROW
EXECUTE FUNCTION public.log_sprint_issue_removed();

-- Enable realtime for sprint history
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprint_history;