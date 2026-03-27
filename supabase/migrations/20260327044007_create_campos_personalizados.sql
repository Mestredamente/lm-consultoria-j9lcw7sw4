CREATE TABLE IF NOT EXISTS public.campos_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  entidade TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  opcoes JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campos_personalizados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campos_personalizados_policy" ON public.campos_personalizados;
CREATE POLICY "campos_personalizados_policy" ON public.campos_personalizados
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
