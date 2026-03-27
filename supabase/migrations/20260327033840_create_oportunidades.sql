CREATE TABLE IF NOT EXISTS public.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  valor_estimado NUMERIC DEFAULT 0,
  data_fechamento_prevista DATE,
  probabilidade_percentual INTEGER DEFAULT 0 CHECK (probabilidade_percentual >= 0 AND probabilidade_percentual <= 100),
  estagio TEXT NOT NULL DEFAULT 'Prospecção' CHECK (estagio IN ('Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Ganho', 'Perdido')),
  responsavel_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oportunidades_empresa_id ON public.oportunidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_responsavel_id ON public.oportunidades(responsavel_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_oportunidades_updated_at ON public.oportunidades;
CREATE TRIGGER set_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "oportunidades_policy" ON public.oportunidades;
CREATE POLICY "oportunidades_policy" ON public.oportunidades
  FOR ALL TO authenticated USING (responsavel_id = auth.uid()) WITH CHECK (responsavel_id = auth.uid());
