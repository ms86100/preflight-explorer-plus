
-- Drop and recreate search_public_profiles to use user_directory
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer);

CREATE FUNCTION public.search_public_profiles(_search_term text, _limit integer DEFAULT 100)
RETURNS TABLE(id uuid, display_name text, avatar_url text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ud.id, ud.display_name, ud.avatar_url, ud.email
  FROM public.user_directory ud
  WHERE ud.is_active = true
    AND (_search_term IS NULL 
         OR ud.display_name ILIKE '%' || _search_term || '%' 
         OR ud.email ILIKE '%' || _search_term || '%')
  ORDER BY ud.display_name
  LIMIT _limit;
$$;
