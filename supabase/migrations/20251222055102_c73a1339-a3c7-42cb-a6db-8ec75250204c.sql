-- Create rate_limits table for tracking API requests
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_key TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_key)
);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits (window_start);

-- Create index for lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (identifier, endpoint, window_key);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits (edge functions use service role)
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL USING (false);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_key TEXT;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window key (minute-based bucket)
  v_window_start := date_trunc('minute', now());
  v_window_key := to_char(v_window_start, 'YYYY-MM-DD-HH24-MI');
  v_reset_at := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Try to insert or update the rate limit record
  INSERT INTO rate_limits (identifier, endpoint, request_count, window_key, window_start)
  VALUES (p_identifier, p_endpoint, 1, v_window_key, v_window_start)
  ON CONFLICT (identifier, endpoint, window_key)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1
  RETURNING rate_limits.request_count INTO v_current_count;
  
  -- Return result
  RETURN QUERY SELECT 
    v_current_count <= p_max_requests,
    GREATEST(0, p_max_requests - v_current_count),
    v_reset_at;
END;
$$;

-- Create cleanup function to remove old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM rate_limits
    WHERE window_start < now() - INTERVAL '1 hour'
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  
  RETURN COALESCE(v_deleted, 0);
END;
$$;