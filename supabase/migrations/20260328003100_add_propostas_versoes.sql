-- Create propostas_versoes table
CREATE TABLE IF NOT EXISTS public.propostas_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID REFERENCES public.propostas(id) ON DELETE CASCADE NOT NULL,
    versao INTEGER NOT NULL,
    dados JSONB NOT NULL,
    resumo_mudancas TEXT,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.propostas_versoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "propostas_versoes_policy" ON public.propostas_versoes;
CREATE POLICY "propostas_versoes_policy" ON public.propostas_versoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create RPC function to snapshot a proposal into a new version
CREATE OR REPLACE FUNCTION public.snapshot_proposta(p_proposta_id uuid, p_usuario_id uuid, p_resumo text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_versao int;
  v_dados jsonb;
  v_version_id uuid;
BEGIN
  -- Determine next version number
  SELECT COALESCE(MAX(versao), 0) + 1 INTO v_versao
  FROM public.propostas_versoes
  WHERE proposta_id = p_proposta_id;

  -- Build JSON snapshot of proposal, items, and costs
  SELECT jsonb_build_object(
    'proposta', row_to_json(p),
    'itens', (SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb) FROM public.itens_proposta i WHERE i.proposta_id = p_proposta_id),
    'custos', (SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb) FROM public.custos_operacionais c WHERE c.proposta_id = p_proposta_id)
  ) INTO v_dados
  FROM public.propostas p
  WHERE p.id = p_proposta_id;

  -- Only snapshot if proposal exists
  IF v_dados->>'proposta' IS NULL THEN
    RETURN NULL;
  END IF;

  -- Insert the version
  INSERT INTO public.propostas_versoes (proposta_id, versao, dados, resumo_mudancas, usuario_id)
  VALUES (p_proposta_id, v_versao, v_dados, p_resumo, p_usuario_id)
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$;
