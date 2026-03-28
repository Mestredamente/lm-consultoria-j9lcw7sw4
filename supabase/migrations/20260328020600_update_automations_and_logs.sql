CREATE TABLE IF NOT EXISTS public.logs_execucao_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fluxo_id UUID NOT NULL REFERENCES public.fluxos_automacao(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_execucao_automacao_fluxo_id ON public.logs_execucao_automacao(fluxo_id);
CREATE INDEX IF NOT EXISTS idx_logs_execucao_automacao_usuario_id ON public.logs_execucao_automacao(usuario_id);

ALTER TABLE public.logs_execucao_automacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_execucao_automacao_policy" ON public.logs_execucao_automacao;
CREATE POLICY "logs_execucao_automacao_policy" ON public.logs_execucao_automacao
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

ALTER TABLE public.fluxos_automacao DROP CONSTRAINT IF EXISTS fluxos_automacao_acao_check;
ALTER TABLE public.fluxos_automacao ADD CONSTRAINT fluxos_automacao_acao_check CHECK (acao IN ('Enviar Email', 'Criar Tarefa', 'Atualizar Campo', 'Enviar Webhook'));
