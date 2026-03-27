ALTER TABLE public.fluxos_automacao ADD COLUMN IF NOT EXISTS detalhes_acao JSONB NOT NULL DEFAULT '{}'::jsonb;
