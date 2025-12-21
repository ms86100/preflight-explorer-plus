-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, mention, assignment, status_change
  entity_type TEXT, -- issue, project, sprint, etc.
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create issue_links table for blocks/is-blocked-by relationships
CREATE TABLE IF NOT EXISTS public.issue_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  target_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- blocks, is_blocked_by, relates_to, duplicates, is_duplicated_by, clones, is_cloned_by
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  CONSTRAINT unique_issue_link UNIQUE (source_issue_id, target_issue_id, link_type)
);

-- Enable RLS
ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;

-- Issue links inherit visibility from the source issue
CREATE POLICY "Users can view issue links" ON public.issue_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM issues i
      JOIN projects p ON i.project_id = p.id
      WHERE i.id = source_issue_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR is_project_member(auth.uid(), p.id) OR p.lead_id = auth.uid())
    )
  );

CREATE POLICY "Users can create issue links" ON public.issue_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues i
      JOIN projects p ON i.project_id = p.id
      WHERE i.id = source_issue_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR is_project_member(auth.uid(), p.id) OR p.lead_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete issue links" ON public.issue_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM issues i
      JOIN projects p ON i.project_id = p.id
      WHERE i.id = source_issue_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR is_project_member(auth.uid(), p.id) OR p.lead_id = auth.uid())
    )
  );

-- Create storage bucket for attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments
CREATE POLICY "Users can view attachments from accessible issues" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments' AND
    auth.uid() IS NOT NULL
  );