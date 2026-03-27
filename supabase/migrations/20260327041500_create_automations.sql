CREATE TABLE IF NOT EXISTS public.fluxos_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  gatilho TEXT NOT NULL CHECK (gatilho IN ('Nova Empresa Criada', 'Contato Criado', 'Oportunidade Criada', 'Oportunidade Ganha')),
  acao TEXT NOT NULL CHECK (acao IN ('Enviar Email', 'Criar Tarefa', 'Atualizar Campo')),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fluxos_automacao_usuario_id ON public.fluxos_automacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fluxos_automacao_empresa_id ON public.fluxos_automacao(empresa_id);

ALTER TABLE public.fluxos_automacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fluxos_automacao_policy" ON public.fluxos_automacao;
CREATE POLICY "fluxos_automacao_policy" ON public.fluxos_automacao
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());


CREATE TABLE IF NOT EXISTS public.emails_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fluxo_id UUID NOT NULL REFERENCES public.fluxos_automacao(id) ON DELETE CASCADE,
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_automacao_usuario_id ON public.emails_automacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_emails_automacao_fluxo_id ON public.emails_automacao(fluxo_id);

ALTER TABLE public.emails_automacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emails_automacao_policy" ON public.emails_automacao;
CREATE POLICY "emails_automacao_policy" ON public.emails_automacao
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
