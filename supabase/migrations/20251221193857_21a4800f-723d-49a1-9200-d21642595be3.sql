-- Fix function search path security warnings
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.generate_issue_key() SET search_path = public;