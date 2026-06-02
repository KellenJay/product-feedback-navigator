
-- 1. company_documents
CREATE TABLE public.company_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_documents_company ON public.company_documents(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_documents TO authenticated;
GRANT ALL ON public.company_documents TO service_role;

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_documents_all_own" ON public.company_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enforce max 10 docs per company
CREATE OR REPLACE FUNCTION public.enforce_company_documents_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.company_documents WHERE company_id = NEW.company_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 documents per company';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER company_documents_limit
BEFORE INSERT ON public.company_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_company_documents_limit();

-- 2. feature_idea_documents
CREATE TABLE public.feature_idea_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  request_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_feature_idea_documents_request ON public.feature_idea_documents(request_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_idea_documents TO authenticated;
GRANT ALL ON public.feature_idea_documents TO service_role;

ALTER TABLE public.feature_idea_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_idea_documents_all_own" ON public.feature_idea_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. storage policies for company-docs bucket
-- Files are stored at {user_id}/...; first folder segment must equal auth.uid().
CREATE POLICY "company_docs_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "company_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "company_docs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "company_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
