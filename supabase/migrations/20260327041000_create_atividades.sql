CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Ligação', 'Email', 'Reunião', 'Tarefa Interna', 'Acompanhamento')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_agendada TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Concluída', 'Cancelada')),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_atividades_empresa_id ON public.atividades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atividades_contato_id ON public.atividades(contato_id);
CREATE INDEX IF NOT EXISTS idx_atividades_oportunidade_id ON public.atividades(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_atividades_responsavel_id ON public.atividades(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data_agendada ON public.atividades(data_agendada);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_atividades_updated_at ON public.atividades;
CREATE TRIGGER set_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "atividades_policy" ON public.atividades;
CREATE POLICY "atividades_policy" ON public.atividades
  FOR ALL TO authenticated USING (responsavel_id = auth.uid()) WITH CHECK (responsavel_id = auth.uid());
