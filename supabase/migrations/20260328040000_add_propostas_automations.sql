DO $$ 
BEGIN
  ALTER TABLE public.fluxos_automacao DROP CONSTRAINT IF EXISTS fluxos_automacao_gatilho_check;
  
  ALTER TABLE public.fluxos_automacao ADD CONSTRAINT fluxos_automacao_gatilho_check CHECK (gatilho IN (
    'Nova Empresa Criada', 
    'Contato Criado', 
    'Oportunidade Criada', 
    'Oportunidade Ganha',
    'Proposta Aceita',
    'Proposta Rejeitada',
    'Proposta Aguardando NF'
  ));
END $$;

DROP TRIGGER IF EXISTS trg_automacao_propostas_ins ON public.propostas;
CREATE TRIGGER trg_automacao_propostas_ins
  AFTER INSERT ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();

DROP TRIGGER IF EXISTS trg_automacao_propostas_upd ON public.propostas;
CREATE TRIGGER trg_automacao_propostas_upd
  AFTER UPDATE OF status, status_nf ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.invoke_executar_automacao();
