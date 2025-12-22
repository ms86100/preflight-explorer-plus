-- Create table for OAuth state tokens (temporary, used during OAuth flow)
CREATE TABLE public.git_oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.git_organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  host_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for state lookups
CREATE INDEX idx_git_oauth_states_state ON public.git_oauth_states(state);
CREATE INDEX idx_git_oauth_states_expires_at ON public.git_oauth_states(expires_at);

-- Enable RLS
ALTER TABLE public.git_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge function)
CREATE POLICY "Service role only" ON public.git_oauth_states
  FOR ALL USING (false);

-- Add cleanup function for expired states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM git_oauth_states
    WHERE expires_at < now()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  
  RETURN COALESCE(v_deleted, 0);
END;
$$;