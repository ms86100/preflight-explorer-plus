-- Import Jobs table to track import progress
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('issues', 'projects', 'users', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'importing', 'completed', 'failed', 'cancelled')),
  source_format TEXT NOT NULL DEFAULT 'csv' CHECK (source_format IN ('csv', 'json', 'xml')),
  file_name TEXT,
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  field_mappings JSONB DEFAULT '{}',
  validation_errors JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Import error details for individual record failures
CREATE TABLE public.import_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name TEXT,
  error_type TEXT NOT NULL CHECK (error_type IN ('validation', 'mapping', 'duplicate', 'reference', 'system')),
  error_message TEXT NOT NULL,
  original_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saved field mappings for reuse
CREATE TABLE public.import_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('issues', 'projects', 'users')),
  source_format TEXT NOT NULL DEFAULT 'csv',
  mappings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_import_errors_job_id ON public.import_errors(job_id);
CREATE INDEX idx_import_mappings_user_id ON public.import_mappings(user_id);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_jobs
CREATE POLICY "Users can view their own import jobs"
  ON public.import_jobs FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import jobs"
  ON public.import_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import jobs"
  ON public.import_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for import_errors
CREATE POLICY "Users can view errors for their jobs"
  ON public.import_errors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.import_jobs j 
    WHERE j.id = job_id AND (j.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "System can insert import errors"
  ON public.import_errors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.import_jobs j 
    WHERE j.id = job_id AND j.user_id = auth.uid()
  ));

-- RLS policies for import_mappings
CREATE POLICY "Users can view their own mappings"
  ON public.import_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings"
  ON public.import_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings"
  ON public.import_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings"
  ON public.import_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_mappings_updated_at
  BEFORE UPDATE ON public.import_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();