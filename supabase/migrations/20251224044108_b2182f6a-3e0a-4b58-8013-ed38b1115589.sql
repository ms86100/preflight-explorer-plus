-- Drop and recreate get_available_transitions to show all statuses when no workflow is configured
CREATE OR REPLACE FUNCTION public.get_available_transitions(p_issue_id uuid)
 RETURNS TABLE(transition_id uuid, transition_name text, to_status_id uuid, to_status_name text, to_status_color text, to_status_category text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_workflow_id UUID;
  v_project_id UUID;
  v_issue_type_id UUID;
  v_current_status_id UUID;
  v_current_step_id UUID;
  v_has_workflow_steps BOOLEAN;
BEGIN
  -- Get issue details
  SELECT project_id, issue_type_id, status_id 
  INTO v_project_id, v_issue_type_id, v_current_status_id
  FROM issues WHERE id = p_issue_id;
  
  IF v_project_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get the workflow for this issue
  v_workflow_id := get_workflow_for_issue(v_project_id, v_issue_type_id);
  
  -- Check if workflow has any steps defined
  IF v_workflow_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM workflow_steps WHERE workflow_id = v_workflow_id)
    INTO v_has_workflow_steps;
  ELSE
    v_has_workflow_steps := false;
  END IF;
  
  -- If no workflow or no steps defined, allow free transitions to all statuses
  IF v_workflow_id IS NULL OR NOT v_has_workflow_steps THEN
    RETURN QUERY
    SELECT NULL::UUID, s.name, s.id, s.name, s.color, s.category::TEXT
    FROM issue_statuses s
    WHERE s.id != v_current_status_id
    ORDER BY s.position;
    RETURN;
  END IF;
  
  -- Get current step
  SELECT id INTO v_current_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = v_current_status_id;
  
  IF v_current_step_id IS NULL THEN
    -- Current status not in workflow, return all statuses in workflow
    RETURN QUERY
    SELECT NULL::UUID, s.name, s.id, s.name, s.color, s.category::TEXT
    FROM workflow_steps ws
    JOIN issue_statuses s ON s.id = ws.status_id
    WHERE ws.workflow_id = v_workflow_id AND ws.status_id != v_current_status_id
    ORDER BY s.position;
    RETURN;
  END IF;
  
  -- Return available transitions from current step
  RETURN QUERY
  SELECT 
    wt.id,
    wt.name,
    s.id,
    s.name,
    s.color,
    s.category::TEXT
  FROM workflow_transitions wt
  JOIN workflow_steps to_step ON to_step.id = wt.to_step_id
  JOIN issue_statuses s ON s.id = to_step.status_id
  WHERE wt.workflow_id = v_workflow_id
    AND wt.from_step_id = v_current_step_id
  ORDER BY s.position;
END;
$function$;

-- Also update validate_status_transition to allow any transition when no workflow steps exist
CREATE OR REPLACE FUNCTION public.validate_status_transition(p_issue_id uuid, p_from_status_id uuid, p_to_status_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_workflow_id UUID;
  v_project_id UUID;
  v_issue_type_id UUID;
  v_from_step_id UUID;
  v_to_step_id UUID;
  v_transition_exists BOOLEAN;
  v_has_workflow_steps BOOLEAN;
BEGIN
  -- Get issue details
  SELECT project_id, issue_type_id INTO v_project_id, v_issue_type_id
  FROM issues WHERE id = p_issue_id;
  
  IF v_project_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the workflow for this issue
  v_workflow_id := get_workflow_for_issue(v_project_id, v_issue_type_id);
  
  IF v_workflow_id IS NULL THEN
    -- No workflow defined, allow any transition
    RETURN true;
  END IF;
  
  -- Check if workflow has any steps defined
  SELECT EXISTS(SELECT 1 FROM workflow_steps WHERE workflow_id = v_workflow_id)
  INTO v_has_workflow_steps;
  
  IF NOT v_has_workflow_steps THEN
    -- No steps defined, allow any transition
    RETURN true;
  END IF;
  
  -- Get from step
  SELECT id INTO v_from_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = p_from_status_id;
  
  -- Get to step
  SELECT id INTO v_to_step_id
  FROM workflow_steps
  WHERE workflow_id = v_workflow_id AND status_id = p_to_status_id;
  
  -- If statuses aren't in the workflow, allow transition (for flexibility)
  IF v_from_step_id IS NULL OR v_to_step_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if transition exists
  SELECT EXISTS(
    SELECT 1 FROM workflow_transitions
    WHERE workflow_id = v_workflow_id
      AND from_step_id = v_from_step_id
      AND to_step_id = v_to_step_id
  ) INTO v_transition_exists;
  
  RETURN v_transition_exists;
END;
$function$;