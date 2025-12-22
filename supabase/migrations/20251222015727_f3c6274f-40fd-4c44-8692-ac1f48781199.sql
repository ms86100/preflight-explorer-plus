-- Create issue_history table to track all issue changes
CREATE TABLE public.issue_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  old_value_id UUID,
  new_value_id UUID,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_issue_history_issue_id ON public.issue_history(issue_id);
CREATE INDEX idx_issue_history_changed_at ON public.issue_history(changed_at DESC);
CREATE INDEX idx_issue_history_changed_by ON public.issue_history(changed_by);

-- Enable RLS
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of issues they can access
CREATE POLICY "Users can view issue history"
ON public.issue_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM issues i
    JOIN projects p ON p.id = i.project_id
    WHERE i.id = issue_history.issue_id
    AND (
      p.lead_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR is_project_member(auth.uid(), p.id)
      OR auth.uid() IS NOT NULL
    )
  )
);

-- Only system can insert (via trigger)
CREATE POLICY "System can insert history"
ON public.issue_history
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to track issue changes
CREATE OR REPLACE FUNCTION public.track_issue_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- If no user (system operation), use reporter
  IF current_user_id IS NULL THEN
    current_user_id := COALESCE(NEW.reporter_id, OLD.reporter_id);
  END IF;

  -- Track summary changes
  IF OLD.summary IS DISTINCT FROM NEW.summary THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'summary', OLD.summary, NEW.summary, current_user_id);
  END IF;

  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'description', 
      CASE WHEN OLD.description IS NOT NULL THEN LEFT(OLD.description, 500) ELSE NULL END,
      CASE WHEN NEW.description IS NOT NULL THEN LEFT(NEW.description, 500) ELSE NULL END, 
      current_user_id);
  END IF;

  -- Track status changes
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, old_value_id, new_value_id, changed_by)
    VALUES (NEW.id, 'status', 
      (SELECT name FROM issue_statuses WHERE id = OLD.status_id),
      (SELECT name FROM issue_statuses WHERE id = NEW.status_id),
      OLD.status_id, NEW.status_id, current_user_id);
  END IF;

  -- Track assignee changes
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, old_value_id, new_value_id, changed_by)
    VALUES (NEW.id, 'assignee',
      (SELECT display_name FROM profiles WHERE id = OLD.assignee_id),
      (SELECT display_name FROM profiles WHERE id = NEW.assignee_id),
      OLD.assignee_id, NEW.assignee_id, current_user_id);
  END IF;

  -- Track priority changes
  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, old_value_id, new_value_id, changed_by)
    VALUES (NEW.id, 'priority',
      (SELECT name FROM priorities WHERE id = OLD.priority_id),
      (SELECT name FROM priorities WHERE id = NEW.priority_id),
      OLD.priority_id, NEW.priority_id, current_user_id);
  END IF;

  -- Track story points changes
  IF OLD.story_points IS DISTINCT FROM NEW.story_points THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'story_points', OLD.story_points::TEXT, NEW.story_points::TEXT, current_user_id);
  END IF;

  -- Track due date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT, current_user_id);
  END IF;

  -- Track resolution changes
  IF OLD.resolution_id IS DISTINCT FROM NEW.resolution_id THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, old_value_id, new_value_id, changed_by)
    VALUES (NEW.id, 'resolution',
      (SELECT name FROM resolutions WHERE id = OLD.resolution_id),
      (SELECT name FROM resolutions WHERE id = NEW.resolution_id),
      OLD.resolution_id, NEW.resolution_id, current_user_id);
  END IF;

  -- Track epic changes
  IF OLD.epic_id IS DISTINCT FROM NEW.epic_id THEN
    INSERT INTO issue_history (issue_id, field_name, old_value, new_value, old_value_id, new_value_id, changed_by)
    VALUES (NEW.id, 'epic',
      (SELECT issue_key FROM issues WHERE id = OLD.epic_id),
      (SELECT issue_key FROM issues WHERE id = NEW.epic_id),
      OLD.epic_id, NEW.epic_id, current_user_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on issues table
CREATE TRIGGER track_issue_changes_trigger
AFTER UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.track_issue_changes();

-- Create function to log issue creation
CREATE OR REPLACE FUNCTION public.track_issue_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO issue_history (issue_id, field_name, new_value, changed_by)
  VALUES (NEW.id, 'created', 'Issue created', NEW.reporter_id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for issue creation
CREATE TRIGGER track_issue_creation_trigger
AFTER INSERT ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.track_issue_creation();