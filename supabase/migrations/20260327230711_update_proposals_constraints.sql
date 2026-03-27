-- Drop restrictive constraints to allow custom service types and the 'Editada' history action
ALTER TABLE public.itens_proposta DROP CONSTRAINT IF EXISTS itens_proposta_tipo_servico_check;
ALTER TABLE public.historico_propostas DROP CONSTRAINT IF EXISTS historico_propostas_acao_check;
