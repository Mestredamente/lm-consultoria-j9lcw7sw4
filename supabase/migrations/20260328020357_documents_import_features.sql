DO $$
BEGIN
  -- Create table if not exists
  CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID REFERENCES public.propostas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    caminho_storage TEXT NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    data_upload TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

  -- RLS Policies
  DROP POLICY IF EXISTS "documentos_policy" ON public.documentos;
  CREATE POLICY "documentos_policy" ON public.documentos
    FOR ALL TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());
END $$;

-- Setup Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-propostas', 'documentos-propostas', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for Storage
DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-propostas' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users can insert own documents" ON storage.objects;
CREATE POLICY "Users can insert own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-propostas' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-propostas' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-propostas' AND owner = auth.uid());
