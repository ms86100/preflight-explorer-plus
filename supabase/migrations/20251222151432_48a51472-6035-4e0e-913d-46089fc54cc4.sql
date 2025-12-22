
-- Create a security definer function to safely fetch public profile info
-- This bypasses RLS but only returns non-sensitive fields
-- This is the bank-grade approach: strict RLS + controlled accessor function

DROP VIEW IF EXISTS public.profiles_public;

-- Create a function to get public profile info for a single user
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.is_active
  FROM public.profiles p
  WHERE p.id = _user_id;
$$;

-- Create a function to get public profiles for multiple users (for bulk lookups)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.is_active
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$$;

-- Create a function to search profiles by display name (for mentions, assignee selection)
-- Only returns public fields
CREATE OR REPLACE FUNCTION public.search_public_profiles(_search_term text DEFAULT NULL, _limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.is_active
  FROM public.profiles p
  WHERE p.is_active = true
    AND (_search_term IS NULL OR p.display_name ILIKE '%' || _search_term || '%')
  ORDER BY p.display_name
  LIMIT _limit;
$$;

COMMENT ON FUNCTION public.get_public_profile IS 'Securely fetch non-sensitive profile info for a single user. Use instead of direct profiles table access.';
COMMENT ON FUNCTION public.get_public_profiles IS 'Securely fetch non-sensitive profile info for multiple users. Use instead of direct profiles table access.';
COMMENT ON FUNCTION public.search_public_profiles IS 'Search active profiles by display name. Returns only non-sensitive fields.';
