ALTER TABLE public.propostas 
ADD COLUMN IF NOT EXISTS notas_internas TEXT,
ADD COLUMN IF NOT EXISTS condicoes_pagamento TEXT;
