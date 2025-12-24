
-- Drop and recreate get_public_profiles to use user_directory
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);

CREATE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ud.id, ud.display_name, ud.avatar_url
  FROM public.user_directory ud
  WHERE ud.id = ANY(_user_ids) AND ud.is_active = true;
$$;
