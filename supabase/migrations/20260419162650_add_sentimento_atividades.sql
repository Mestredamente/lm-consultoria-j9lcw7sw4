DO $$
BEGIN
  ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS sentimento text;
  ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS sentimento_score integer;
  ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS sentimento_analise text;
END $$;
