-- Add DELETE policy for attachment authors
CREATE POLICY "Authors can delete own attachments"
ON public.attachments
FOR DELETE
USING (author_id = auth.uid());

-- Add DELETE policy for project leads and admins
CREATE POLICY "Project leads can delete attachments"
ON public.attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM issues i
    JOIN projects p ON p.id = i.project_id
    WHERE i.id = attachments.issue_id
    AND (p.lead_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);