
-- First, sync ALL existing auth users to user_directory BEFORE changing foreign keys
INSERT INTO public.user_directory (id, email, display_name, is_simulated, is_active)
SELECT 
  u.id, 
  u.email, 
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  false,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_directory ud WHERE ud.id = u.id);

-- Now drop existing foreign key constraints that reference auth.users
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_assignee_id_fkey;
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_reporter_id_fkey;

-- Add new foreign key constraints that reference user_directory instead
ALTER TABLE public.issues 
  ADD CONSTRAINT issues_assignee_id_fkey 
  FOREIGN KEY (assignee_id) REFERENCES public.user_directory(id) ON DELETE SET NULL;

ALTER TABLE public.issues 
  ADD CONSTRAINT issues_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES public.user_directory(id) ON DELETE SET NULL;

-- Create a trigger to auto-add new auth users to user_directory
CREATE OR REPLACE FUNCTION public.handle_new_user_to_directory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_directory (id, email, display_name, is_simulated, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    false,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, user_directory.display_name),
    is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_directory ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_directory
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_to_directory();
