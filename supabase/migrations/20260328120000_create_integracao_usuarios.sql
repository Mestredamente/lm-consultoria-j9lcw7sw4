CREATE TABLE IF NOT EXISTS public.integracao_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provedor TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  data_expiracao TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, provedor)
);

ALTER TABLE public.integracao_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integracao_usuarios_policy" ON public.integracao_usuarios;
CREATE POLICY "integracao_usuarios_policy" ON public.integracao_usuarios
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE OR REPLACE TRIGGER set_integracao_usuarios_updated_at 
BEFORE UPDATE ON public.integracao_usuarios 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS google_event_id TEXT;
