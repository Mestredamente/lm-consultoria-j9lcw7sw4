-- Enable pg_net if possible to make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invoke_executar_automacao()
RETURNS trigger AS $$
DECLARE
  req_id bigint;
  base_url text;
BEGIN
  -- Known production edge function URL
  base_url := 'https://qkxjdsdvxxgtdmlivxue.supabase.co/functions/v1'; 

  SELECT net.http_post(
      url:=(base_url || '/executar_automacao'),
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:=json_build_object(
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
      )::jsonb
  ) INTO req_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'invoke_executar_automacao failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for companies
DROP TRIGGER IF EXISTS trg_automacao_empresas ON public.empresas;
CREATE TRIGGER trg_automacao_empresas
  AFTER INSERT ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();

-- Trigger for contacts
DROP TRIGGER IF EXISTS trg_automacao_contatos ON public.contatos;
CREATE TRIGGER trg_automacao_contatos
  AFTER INSERT ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();

-- Triggers for opportunities
DROP TRIGGER IF EXISTS trg_automacao_oportunidades_ins ON public.oportunidades;
CREATE TRIGGER trg_automacao_oportunidades_ins
  AFTER INSERT ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();

DROP TRIGGER IF EXISTS trg_automacao_oportunidades_upd ON public.oportunidades;
CREATE TRIGGER trg_automacao_oportunidades_upd
  AFTER UPDATE OF estagio ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();
