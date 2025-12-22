-- Add columns for transition conditions, validators, and post-functions
-- These are stored as JSONB arrays to allow multiple conditions/validators/post-functions per transition

-- Conditions: Rules that determine if a user can execute the transition
-- Example: [{"type": "only_assignee"}, {"type": "user_in_group", "group": "developers"}]
ALTER TABLE public.workflow_transitions 
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;

-- Validators: Checks that must pass before the transition can complete
-- Example: [{"type": "field_required", "field": "resolution"}, {"type": "subtasks_closed"}]
ALTER TABLE public.workflow_transitions 
ADD COLUMN IF NOT EXISTS validators JSONB DEFAULT '[]'::jsonb;

-- Post-functions: Actions executed after the transition completes
-- Example: [{"type": "set_field", "field": "assignee", "value": "lead"}, {"type": "add_comment", "comment": "Status changed"}]
ALTER TABLE public.workflow_transitions 
ADD COLUMN IF NOT EXISTS post_functions JSONB DEFAULT '[]'::jsonb;

-- Screen: Optional screen to show during transition (for collecting additional data)
-- References a screen configuration ID or null if no screen
ALTER TABLE public.workflow_transitions 
ADD COLUMN IF NOT EXISTS screen_id UUID DEFAULT NULL;

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow_id 
ON public.workflow_transitions(workflow_id);

COMMENT ON COLUMN public.workflow_transitions.conditions IS 'JSON array of conditions that must be met for the transition to be available';
COMMENT ON COLUMN public.workflow_transitions.validators IS 'JSON array of validators that check data before transition completes';
COMMENT ON COLUMN public.workflow_transitions.post_functions IS 'JSON array of post-functions executed after transition completes';
COMMENT ON COLUMN public.workflow_transitions.screen_id IS 'Optional screen to display during transition';