-- =============================================
-- DOCUMENT COMPOSER PLUGIN TABLES
-- =============================================

-- Document export templates
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'pdf', -- pdf, docx, xlsx, html
  header_config JSONB DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  footer_config JSONB DEFAULT '{}',
  watermark_config JSONB DEFAULT '{}',
  styling JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document export jobs/history
CREATE TABLE public.document_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  issue_ids JSONB DEFAULT '[]',
  options JSONB DEFAULT '{}',
  file_path TEXT,
  file_size INTEGER,
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- STRUCTURED DATA BLOCKS PLUGIN TABLES
-- =============================================

-- Data block schemas
CREATE TABLE public.data_block_schemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]', -- array of column definitions
  validation_rules JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data block instances (actual data rows)
CREATE TABLE public.data_block_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL REFERENCES public.data_block_schemas(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT,
  rows JSONB NOT NULL DEFAULT '[]', -- array of row data
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- GUIDED OPERATIONS PLUGIN TABLES
-- =============================================

-- Guided operation definitions
CREATE TABLE public.guided_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  steps JSONB NOT NULL DEFAULT '[]', -- array of step definitions
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Guided operation executions (history)
CREATE TABLE public.guided_operation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES public.guided_operations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled, failed
  current_step INTEGER DEFAULT 0,
  step_data JSONB DEFAULT '{}', -- data collected from each step
  started_by UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  result JSONB DEFAULT '{}'
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_block_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_block_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_operation_executions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Document Composer
-- =============================================

CREATE POLICY "Authenticated users can view document templates"
ON public.document_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create document templates"
ON public.document_templates FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
ON public.document_templates FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own templates"
ON public.document_templates FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own exports"
ON public.document_exports FOR SELECT
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create exports"
ON public.document_exports FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own exports"
ON public.document_exports FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own exports"
ON public.document_exports FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- RLS POLICIES - Structured Data Blocks
-- =============================================

CREATE POLICY "Authenticated users can view schemas"
ON public.data_block_schemas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create schemas"
ON public.data_block_schemas FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own schemas"
ON public.data_block_schemas FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own schemas"
ON public.data_block_schemas FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view data instances"
ON public.data_block_instances FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create data instances"
ON public.data_block_instances FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own data instances"
ON public.data_block_instances FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own data instances"
ON public.data_block_instances FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- RLS POLICIES - Guided Operations
-- =============================================

CREATE POLICY "Authenticated users can view operations"
ON public.guided_operations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create operations"
ON public.guided_operations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own operations"
ON public.guided_operations FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own operations"
ON public.guided_operations FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own executions"
ON public.guided_operation_executions FOR SELECT
USING (auth.uid() = started_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create executions"
ON public.guided_operation_executions FOR INSERT
WITH CHECK (auth.uid() = started_by);

CREATE POLICY "Users can update own executions"
ON public.guided_operation_executions FOR UPDATE
USING (auth.uid() = started_by);

CREATE POLICY "Users can delete own executions"
ON public.guided_operation_executions FOR DELETE
USING (auth.uid() = started_by OR has_role(auth.uid(), 'admin'::app_role));