-- Create trigger function to auto-generate issue_key and issue_number
CREATE OR REPLACE FUNCTION public.generate_issue_key()
RETURNS TRIGGER AS $$
DECLARE
  project_key TEXT;
  next_number INTEGER;
BEGIN
  -- Get project key
  SELECT pkey INTO project_key FROM public.projects WHERE id = NEW.project_id;
  
  -- Get next issue number for this project
  SELECT COALESCE(MAX(issue_number), 0) + 1 INTO next_number 
  FROM public.issues 
  WHERE project_id = NEW.project_id;
  
  -- Set issue_number and issue_key
  NEW.issue_number := next_number;
  NEW.issue_key := project_key || '-' || next_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for issues table
DROP TRIGGER IF EXISTS generate_issue_key_trigger ON public.issues;
CREATE TRIGGER generate_issue_key_trigger
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_issue_key();

-- Create trigger function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'create', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit triggers for main tables
DROP TRIGGER IF EXISTS audit_issues_trigger ON public.issues;
CREATE TRIGGER audit_issues_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_projects_trigger ON public.projects;
CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_sprints_trigger ON public.sprints;
CREATE TRIGGER audit_sprints_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_comments_trigger ON public.comments;
CREATE TRIGGER audit_comments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();