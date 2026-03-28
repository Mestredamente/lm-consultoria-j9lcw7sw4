DO $$
BEGIN
    ALTER TABLE public.propostas DROP CONSTRAINT IF EXISTS propostas_status_check;
    ALTER TABLE public.propostas ADD CONSTRAINT propostas_status_check CHECK (status = ANY (ARRAY['Rascunho'::text, 'Enviada'::text, 'Visualizada'::text, 'Aceita'::text, 'Rejeitada'::text, 'Enviada via WhatsApp'::text]));
END $$;
