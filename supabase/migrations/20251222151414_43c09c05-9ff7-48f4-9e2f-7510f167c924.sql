
-- Fix Security Definer View warning on profiles_public
-- Change to SECURITY INVOKER so RLS of the querying user applies
-- This is safe because the underlying profiles table now has strict RLS
-- and the view only exposes non-sensitive fields

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  is_active
FROM public.profiles;

-- Re-grant access
GRANT SELECT ON public.profiles_public TO authenticated;

COMMENT ON VIEW public.profiles_public IS 'Public view of profiles with only non-sensitive fields (id, display_name, avatar_url, is_active). Uses SECURITY INVOKER so RLS applies.';
