CREATE TABLE IF NOT EXISTS public.emails_propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  email_destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  data_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Enviado',
  email_id_resend TEXT
);

-- RLS
ALTER TABLE public.emails_propostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emails_propostas_policy" ON public.emails_propostas;
CREATE POLICY "emails_propostas_policy" ON public.emails_propostas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = emails_propostas.proposta_id
      AND (
        p.responsavel_id = auth.uid() OR
        (p.responsavel_id IN (SELECT id FROM public.usuarios WHERE COALESCE(parent_id, id) = public.get_tenant_id()) AND public.get_user_role() IN ('admin', 'gerente'))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = emails_propostas.proposta_id AND p.responsavel_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_emails_propostas_proposta_id ON public.emails_propostas(proposta_id);
