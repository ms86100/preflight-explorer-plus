-- Enable RLS on issue_statuses if not already enabled
ALTER TABLE public.issue_statuses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read statuses (reference data)
CREATE POLICY "Authenticated users can view statuses" ON public.issue_statuses
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow admins to manage statuses
CREATE POLICY "Admins can insert statuses" ON public.issue_statuses
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update statuses" ON public.issue_statuses
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete statuses" ON public.issue_statuses
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- For development/flexibility: allow any authenticated user to create statuses
-- Remove this in production if you want only admins to manage statuses
CREATE POLICY "Authenticated users can insert statuses" ON public.issue_statuses
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);