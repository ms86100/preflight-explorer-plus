-- Fix RLS policies for custom_field_definitions to allow authenticated users to manage fields
DROP POLICY IF EXISTS "Admins can manage custom field definitions" ON public.custom_field_definitions;

-- Allow authenticated users to create custom field definitions
CREATE POLICY "Authenticated users can create custom field definitions"
ON public.custom_field_definitions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update custom field definitions
CREATE POLICY "Authenticated users can update custom field definitions"
ON public.custom_field_definitions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete (soft delete) custom field definitions
CREATE POLICY "Authenticated users can delete custom field definitions"
ON public.custom_field_definitions
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for plugins to allow authenticated users to toggle plugins
DROP POLICY IF EXISTS "Admins can manage plugins" ON public.plugins;

-- Allow authenticated users to update plugins (toggle enabled status)
CREATE POLICY "Authenticated users can update plugins"
ON public.plugins
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow admins to insert/delete plugins
CREATE POLICY "Admins can insert plugins"
ON public.plugins
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete plugins"
ON public.plugins
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));