DO $$ 
BEGIN
  -- Add new columns for clinical features
  ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS confirmacao_paciente TEXT;
  ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS risco_cancelamento TEXT DEFAULT 'baixo';
  
  -- Add type to notifications if missing
  ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'sistema';
END $$;

CREATE TABLE IF NOT EXISTS public.log_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL,
  tentativas INT DEFAULT 1,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.log_whatsapp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "log_whatsapp_policy" ON public.log_whatsapp;
CREATE POLICY "log_whatsapp_policy" ON public.log_whatsapp 
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
