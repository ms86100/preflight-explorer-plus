
-- Fix: profiles_table_public_exposure
-- Restrict profiles visibility to owner + admins only
-- Create a public view for non-sensitive fields needed by app features

-- 1. Create a public view for non-sensitive profile fields
-- Only exposes: id, display_name, avatar_url, is_active
-- Sensitive fields NOT exposed: email, job_title, department, location, nationality, clearance_level, phone, timezone
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  display_name,
  avatar_url,
  is_active
FROM public.profiles;

-- 2. Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- 3. Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- 4. Create new restrictive SELECT policy - only owner or admin can see full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
);

-- 5. Add comment for documentation
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles with only non-sensitive fields (id, display_name, avatar_url, is_active). Use this for displaying user info in UI components instead of querying profiles directly.';
