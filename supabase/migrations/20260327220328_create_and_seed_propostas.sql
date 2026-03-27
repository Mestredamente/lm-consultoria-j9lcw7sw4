-- 1. Ensure tables are created exactly as requested
CREATE TABLE IF NOT EXISTS public.propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_proposta TEXT UNIQUE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
    oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviada', 'Visualizada', 'Aceita', 'Rejeitada')),
    valor_total NUMERIC NOT NULL DEFAULT 0,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_validade DATE,
    responsavel_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itens_proposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
    tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('Consultoria', 'Treinamento', 'Coaching', 'Diagnóstico', 'Palestra')),
    descricao TEXT,
    quantidade NUMERIC NOT NULL DEFAULT 1,
    valor_unitario NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED
);

CREATE TABLE IF NOT EXISTS public.custos_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Deslocamento', 'Hospedagem', 'Alimentação', 'Testes', 'Materiais')),
    descricao TEXT,
    valor NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.historico_propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
    acao TEXT NOT NULL CHECK (acao IN ('Criada', 'Enviada', 'Visualizada', 'Aceita', 'Rejeitada', 'Atualizada')),
    data_acao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- 2. Create requested indexes
CREATE INDEX IF NOT EXISTS idx_propostas_empresa_id ON public.propostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON public.propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_responsavel_id ON public.propostas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_itens_proposta_proposta_id ON public.itens_proposta(proposta_id);
CREATE INDEX IF NOT EXISTS idx_custos_operacionais_proposta_id ON public.custos_operacionais(proposta_id);
CREATE INDEX IF NOT EXISTS idx_historico_propostas_proposta_id ON public.historico_propostas(proposta_id);

-- 3. Enable RLS and setup policies
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_proposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_operacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_propostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "propostas_own_policy" ON public.propostas;
CREATE POLICY "propostas_own_policy" ON public.propostas
    FOR ALL TO authenticated
    USING (responsavel_id = auth.uid())
    WITH CHECK (responsavel_id = auth.uid());

-- 4. Seed initial mock data for the UI
DO $BODY$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_contato_id UUID;
  v_proposta_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure an empresa exists
    SELECT id INTO v_empresa_id FROM public.empresas WHERE usuario_id = v_user_id LIMIT 1;
    IF v_empresa_id IS NULL THEN
      INSERT INTO public.empresas (usuario_id, nome, setor) 
      VALUES (v_user_id, 'Tech Solutions SA', 'Tecnologia')
      RETURNING id INTO v_empresa_id;
    END IF;

    -- Ensure a contato exists
    SELECT id INTO v_contato_id FROM public.contatos WHERE usuario_id = v_user_id AND empresa_id = v_empresa_id LIMIT 1;
    IF v_contato_id IS NULL THEN
      INSERT INTO public.contatos (usuario_id, empresa_id, nome, email) 
      VALUES (v_user_id, v_empresa_id, 'Carlos Diretor', 'carlos@techsolutions.exemplo.com')
      RETURNING id INTO v_contato_id;
    END IF;

    -- Insert mock proposta if none exists
    IF NOT EXISTS (SELECT 1 FROM public.propostas WHERE responsavel_id = v_user_id LIMIT 1) THEN
      INSERT INTO public.propostas (
        numero_proposta, empresa_id, contato_id, status, valor_total, data_emissao, responsavel_id
      ) VALUES (
        'PROP-2026-001', v_empresa_id, v_contato_id, 'Enviada', 15800.00, CURRENT_DATE, v_user_id
      ) RETURNING id INTO v_proposta_id;

      INSERT INTO public.itens_proposta (proposta_id, tipo_servico, descricao, quantidade, valor_unitario)
      VALUES 
        (v_proposta_id, 'Consultoria', 'Consultoria Estratégica Inicial', 40, 250.00),
        (v_proposta_id, 'Treinamento', 'Treinamento de Liderança', 20, 250.00);

      INSERT INTO public.custos_operacionais (proposta_id, tipo, descricao, valor)
      VALUES
        (v_proposta_id, 'Deslocamento', 'Passagem Aérea SP-RJ', 1200.00),
        (v_proposta_id, 'Hospedagem', 'Hotel 2 diárias', 800.00);
        
      INSERT INTO public.historico_propostas (proposta_id, acao, usuario_id)
      VALUES (v_proposta_id, 'Criada', v_user_id);
    END IF;
  END IF;
END;
$BODY$;
