-- Phase 1: Fix Default Workflow and Assign Schemes to Projects

-- 1. Ensure the Default Software Workflow has proper steps
-- First, get the workflow ID and status IDs
DO $$
DECLARE
  v_workflow_id UUID;
  v_todo_status_id UUID;
  v_in_progress_status_id UUID;
  v_done_status_id UUID;
  v_todo_step_id UUID;
  v_in_progress_step_id UUID;
  v_done_step_id UUID;
  v_default_scheme_id UUID;
  v_project RECORD;
BEGIN
  -- Get the Default Software Workflow
  SELECT id INTO v_workflow_id 
  FROM workflows 
  WHERE name = 'Default Software Workflow' 
  LIMIT 1;

  -- If no default workflow exists, create one
  IF v_workflow_id IS NULL THEN
    INSERT INTO workflows (name, description, is_active)
    VALUES ('Default Software Workflow', 'Standard software development workflow with To Do, In Progress, and Done statuses', true)
    RETURNING id INTO v_workflow_id;
  END IF;

  -- Get the standard status IDs
  SELECT id INTO v_todo_status_id FROM issue_statuses WHERE name = 'To Do' LIMIT 1;
  SELECT id INTO v_in_progress_status_id FROM issue_statuses WHERE name = 'In Progress' LIMIT 1;
  SELECT id INTO v_done_status_id FROM issue_statuses WHERE name = 'Done' LIMIT 1;

  -- Create missing statuses if they don't exist
  IF v_todo_status_id IS NULL THEN
    INSERT INTO issue_statuses (name, category, color, position)
    VALUES ('To Do', 'todo', '#6B7280', 0)
    RETURNING id INTO v_todo_status_id;
  END IF;

  IF v_in_progress_status_id IS NULL THEN
    INSERT INTO issue_statuses (name, category, color, position)
    VALUES ('In Progress', 'in_progress', '#3B82F6', 1)
    RETURNING id INTO v_in_progress_status_id;
  END IF;

  IF v_done_status_id IS NULL THEN
    INSERT INTO issue_statuses (name, category, color, position)
    VALUES ('Done', 'done', '#22C55E', 2)
    RETURNING id INTO v_done_status_id;
  END IF;

  -- Delete existing steps for this workflow (to recreate cleanly)
  DELETE FROM workflow_transitions WHERE workflow_id = v_workflow_id;
  DELETE FROM workflow_steps WHERE workflow_id = v_workflow_id;

  -- Create workflow steps
  INSERT INTO workflow_steps (workflow_id, status_id, position_x, position_y, is_initial)
  VALUES (v_workflow_id, v_todo_status_id, 100, 200, true)
  RETURNING id INTO v_todo_step_id;

  INSERT INTO workflow_steps (workflow_id, status_id, position_x, position_y, is_initial)
  VALUES (v_workflow_id, v_in_progress_status_id, 300, 200, false)
  RETURNING id INTO v_in_progress_step_id;

  INSERT INTO workflow_steps (workflow_id, status_id, position_x, position_y, is_initial)
  VALUES (v_workflow_id, v_done_status_id, 500, 200, false)
  RETURNING id INTO v_done_step_id;

  -- Create transitions (bidirectional for flexibility)
  -- To Do -> In Progress
  INSERT INTO workflow_transitions (workflow_id, from_step_id, to_step_id, name)
  VALUES (v_workflow_id, v_todo_step_id, v_in_progress_step_id, 'To Do → In Progress');

  -- In Progress -> To Do
  INSERT INTO workflow_transitions (workflow_id, from_step_id, to_step_id, name)
  VALUES (v_workflow_id, v_in_progress_step_id, v_todo_step_id, 'In Progress → To Do');

  -- In Progress -> Done
  INSERT INTO workflow_transitions (workflow_id, from_step_id, to_step_id, name)
  VALUES (v_workflow_id, v_in_progress_step_id, v_done_step_id, 'In Progress → Done');

  -- Done -> In Progress (reopen)
  INSERT INTO workflow_transitions (workflow_id, from_step_id, to_step_id, name)
  VALUES (v_workflow_id, v_done_step_id, v_in_progress_step_id, 'Done → In Progress');

  -- 2. Get or create the default workflow scheme
  SELECT id INTO v_default_scheme_id 
  FROM workflow_schemes 
  WHERE is_default = true 
  LIMIT 1;

  IF v_default_scheme_id IS NULL THEN
    INSERT INTO workflow_schemes (name, description, is_default)
    VALUES ('Default Workflow Scheme', 'Default scheme using the standard software development workflow', true)
    RETURNING id INTO v_default_scheme_id;
  END IF;

  -- Ensure the default scheme has a mapping to the default workflow
  INSERT INTO workflow_scheme_mappings (scheme_id, workflow_id, issue_type_id)
  VALUES (v_default_scheme_id, v_workflow_id, NULL)
  ON CONFLICT DO NOTHING;

  -- 3. Assign the default workflow scheme to all projects that don't have one
  FOR v_project IN 
    SELECT p.id 
    FROM projects p
    WHERE NOT EXISTS (
      SELECT 1 FROM project_workflow_schemes pws WHERE pws.project_id = p.id
    )
  LOOP
    INSERT INTO project_workflow_schemes (project_id, scheme_id)
    VALUES (v_project.id, v_default_scheme_id)
    ON CONFLICT (project_id) DO NOTHING;
  END LOOP;

END $$;