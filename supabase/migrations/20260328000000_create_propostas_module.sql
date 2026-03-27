-- 1. Create tables
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

-- 2. Triggers for numero_proposta
CREATE OR REPLACE FUNCTION public.generate_numero_proposta()
RETURNS trigger AS $function$
DECLARE
    current_year text := to_char(CURRENT_DATE, 'YYYY');
    max_seq int;
BEGIN
    IF NEW.numero_proposta IS NULL THEN
        SELECT COALESCE(MAX(substring(numero_proposta from 'PROP-\d{4}-(\d+)')::int), 0)
        INTO max_seq
        FROM public.propostas
        WHERE numero_proposta LIKE 'PROP-' || current_year || '-%';
        
        NEW.numero_proposta := 'PROP-' || current_year || '-' || lpad((max_seq + 1)::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_numero_proposta ON public.propostas;
CREATE TRIGGER trg_generate_numero_proposta
    BEFORE INSERT ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.generate_numero_proposta();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_propostas_updated_at ON public.propostas;
CREATE TRIGGER set_propostas_updated_at
    BEFORE UPDATE ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Auto-log history on creation
CREATE OR REPLACE FUNCTION public.log_proposta_creation()
RETURNS trigger AS $function$
BEGIN
    INSERT INTO public.historico_propostas (proposta_id, acao, usuario_id)
    VALUES (NEW.id, 'Criada', NEW.responsavel_id);
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_proposta_creation ON public.propostas;
CREATE TRIGGER trg_log_proposta_creation
    AFTER INSERT ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.log_proposta_creation();

-- 4. Auto-log history on status change
CREATE OR REPLACE FUNCTION public.log_proposta_status_change()
RETURNS trigger AS $function$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Enviada', 'Visualizada', 'Aceita', 'Rejeitada') THEN
        INSERT INTO public.historico_propostas (proposta_id, acao, usuario_id)
        VALUES (NEW.id, NEW.status, COALESCE(auth.uid(), NEW.responsavel_id));
    END IF;
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_proposta_status_change ON public.propostas;
CREATE TRIGGER trg_log_proposta_status_change
    AFTER UPDATE OF status ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.log_proposta_status_change();

-- 5. RLS Policies
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_proposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_operacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_propostas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "propostas_own_policy" ON public.propostas;
DROP POLICY IF EXISTS "propostas_team_policy" ON public.propostas;
DROP POLICY IF EXISTS "itens_proposta_policy" ON public.itens_proposta;
DROP POLICY IF EXISTS "custos_operacionais_policy" ON public.custos_operacionais;
DROP POLICY IF EXISTS "historico_propostas_policy" ON public.historico_propostas;

-- Propostas Policies
CREATE POLICY "propostas_own_policy" ON public.propostas
    FOR ALL TO authenticated
    USING (responsavel_id = auth.uid())
    WITH CHECK (responsavel_id = auth.uid());

CREATE POLICY "propostas_team_policy" ON public.propostas
    FOR SELECT TO authenticated
    USING (
        (responsavel_id IN (SELECT usuarios.id FROM public.usuarios WHERE COALESCE(usuarios.parent_id, usuarios.id) = public.get_tenant_id()))
        AND public.get_user_role() IN ('admin', 'gerente')
    );

-- Itens Proposta Policies
CREATE POLICY "itens_proposta_policy" ON public.itens_proposta
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id
        AND (
            p.responsavel_id = auth.uid() OR
            (
                p.responsavel_id IN (SELECT usuarios.id FROM public.usuarios WHERE COALESCE(usuarios.parent_id, usuarios.id) = public.get_tenant_id())
                AND public.get_user_role() IN ('admin', 'gerente')
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id AND p.responsavel_id = auth.uid()
    ));

-- Custos Operacionais Policies
CREATE POLICY "custos_operacionais_policy" ON public.custos_operacionais
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id
        AND (
            p.responsavel_id = auth.uid() OR
            (
                p.responsavel_id IN (SELECT usuarios.id FROM public.usuarios WHERE COALESCE(usuarios.parent_id, usuarios.id) = public.get_tenant_id())
                AND public.get_user_role() IN ('admin', 'gerente')
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id AND p.responsavel_id = auth.uid()
    ));

-- Historico Propostas Policies
CREATE POLICY "historico_propostas_policy" ON public.historico_propostas
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id
        AND (
            p.responsavel_id = auth.uid() OR
            (
                p.responsavel_id IN (SELECT usuarios.id FROM public.usuarios WHERE COALESCE(usuarios.parent_id, usuarios.id) = public.get_tenant_id())
                AND public.get_user_role() IN ('admin', 'gerente')
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.propostas p
        WHERE p.id = proposta_id AND p.responsavel_id = auth.uid()
    ));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_propostas_empresa_id ON public.propostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON public.propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_responsavel_id ON public.propostas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_itens_proposta_proposta_id ON public.itens_proposta(proposta_id);
CREATE INDEX IF NOT EXISTS idx_custos_operacionais_proposta_id ON public.custos_operacionais(proposta_id);
CREATE INDEX IF NOT EXISTS idx_historico_propostas_proposta_id ON public.historico_propostas(proposta_id);
