DO $$ 
DECLARE
  rec RECORD;
BEGIN
  -- Check if publication exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Loop through the tables that need real-time enabled and add them to the publication
  FOR rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'empresas', 'contatos', 'oportunidades', 'atividades', 'propostas',
        'fluxos_automacao', 'logs_execucao_automacao', 'documentos',
        'usuarios', 'campos_personalizados', 'parametros_financeiros',
        'historico_propostas', 'itens_proposta', 'custos_operacionais'
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rec.tablename);
    EXCEPTION
      WHEN duplicate_object THEN
        -- The table is already in the publication, ignore the error
        NULL;
    END;
  END LOOP;
END $$;
