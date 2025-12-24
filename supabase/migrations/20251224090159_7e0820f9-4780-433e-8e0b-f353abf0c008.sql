-- Create a user_directory table for dummy/simulated users
-- This allows assignment and @mentions without requiring auth.users entries
CREATE TABLE IF NOT EXISTS public.user_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_simulated BOOLEAN DEFAULT true,
  linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_directory ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read the directory
CREATE POLICY "User directory is viewable by authenticated users"
ON public.user_directory FOR SELECT TO authenticated USING (true);

-- Only admins can modify directory
CREATE POLICY "Admins can manage user directory"
ON public.user_directory FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert 10 sample users
INSERT INTO public.user_directory (email, display_name, job_title, department, is_active, is_simulated)
VALUES 
  ('john.smith@vertex.dev', 'John Smith', 'Senior Developer', 'Engineering', true, true),
  ('sarah.johnson@vertex.dev', 'Sarah Johnson', 'Product Manager', 'Product', true, true),
  ('mike.williams@vertex.dev', 'Mike Williams', 'QA Engineer', 'Quality Assurance', true, true),
  ('emily.brown@vertex.dev', 'Emily Brown', 'UX Designer', 'Design', true, true),
  ('david.jones@vertex.dev', 'David Jones', 'DevOps Engineer', 'Operations', true, true),
  ('lisa.miller@vertex.dev', 'Lisa Miller', 'Tech Lead', 'Engineering', true, true),
  ('james.wilson@vertex.dev', 'James Wilson', 'Business Analyst', 'Product', true, true),
  ('anna.taylor@vertex.dev', 'Anna Taylor', 'Scrum Master', 'Agile', true, true),
  ('robert.anderson@vertex.dev', 'Robert Anderson', 'Security Engineer', 'Security', true, true),
  ('jennifer.thomas@vertex.dev', 'Jennifer Thomas', 'Frontend Developer', 'Engineering', true, true)
ON CONFLICT (email) DO NOTHING;