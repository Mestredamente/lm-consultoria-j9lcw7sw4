CREATE TABLE IF NOT EXISTS public.historico_oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estagio_anterior TEXT,
  estagio_novo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.oportunidades ADD COLUMN IF NOT EXISTS notas_internas TEXT;

ALTER TABLE public.historico_oportunidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_oportunidades_policy" ON public.historico_oportunidades;
CREATE POLICY "historico_oportunidades_policy" ON public.historico_oportunidades
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_oportunidade_estagio()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico_oportunidades (oportunidade_id, usuario_id, estagio_novo)
    VALUES (NEW.id, NEW.responsavel_id, NEW.estagio);
  ELSIF TG_OP = 'UPDATE' AND NEW.estagio IS DISTINCT FROM OLD.estagio THEN
    INSERT INTO public.historico_oportunidades (oportunidade_id, usuario_id, estagio_anterior, estagio_novo)
    VALUES (NEW.id, NEW.responsavel_id, OLD.estagio, NEW.estagio);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_oportunidade_estagio_trigger ON public.oportunidades;
CREATE TRIGGER log_oportunidade_estagio_trigger
  AFTER INSERT OR UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.log_oportunidade_estagio();

DO $$
BEGIN
  INSERT INTO public.historico_oportunidades (oportunidade_id, usuario_id, estagio_novo, created_at)
  SELECT id, responsavel_id, estagio, created_at
  FROM public.oportunidades
  WHERE NOT EXISTS (
    SELECT 1 FROM public.historico_oportunidades ho WHERE ho.oportunidade_id = oportunidades.id
  );
END $$;
