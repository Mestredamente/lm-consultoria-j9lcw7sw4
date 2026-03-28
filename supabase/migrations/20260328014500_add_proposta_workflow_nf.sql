-- Adicionar colunas para NF e Workflow de aprovação
ALTER TABLE public.propostas 
ADD COLUMN IF NOT EXISTS status_nf TEXT DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS comentarios_cliente TEXT;

-- Garantir segurança ao atualizar policies
DROP POLICY IF EXISTS "propostas_public_select" ON public.propostas;
DROP POLICY IF EXISTS "propostas_public_update" ON public.propostas;

-- Gatilho para notificar a equipe comercial sobre o status da proposta
CREATE OR REPLACE FUNCTION public.trigger_notifica_status_proposta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_msg TEXT;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Aceita', 'Rejeitada', 'Visualizada') THEN
        v_msg := 'A proposta ' || COALESCE(NEW.numero_proposta, 'S/N') || ' foi marcada como ' || NEW.status || ' pelo cliente.';
        IF NEW.comentarios_cliente IS NOT NULL AND NEW.comentarios_cliente IS DISTINCT FROM OLD.comentarios_cliente THEN
            v_msg := v_msg || ' Comentário: ' || NEW.comentarios_cliente;
        END IF;

        INSERT INTO public.notificacoes (usuario_id, titulo, mensagem)
        VALUES (NEW.responsavel_id, 'Atualização de Proposta', v_msg);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifica_status_proposta ON public.propostas;
CREATE TRIGGER trg_notifica_status_proposta
AFTER UPDATE OF status ON public.propostas
FOR EACH ROW EXECUTE FUNCTION trigger_notifica_status_proposta();

-- RPC para obter a proposta publicamente (para o link enviado ao cliente)
CREATE OR REPLACE FUNCTION public.get_public_proposal(p_proposta_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposta jsonb;
    v_itens jsonb;
    v_empresa jsonb;
    v_consultorio jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'numero_proposta', p.numero_proposta,
        'status', p.status,
        'valor_total', p.valor_total,
        'data_emissao', p.data_emissao,
        'data_validade', p.data_validade,
        'condicoes_pagamento', p.condicoes_pagamento,
        'comentarios_cliente', p.comentarios_cliente
    ) INTO v_proposta
    FROM public.propostas p
    WHERE p.id = p_proposta_id;

    IF v_proposta IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'tipo_servico', i.tipo_servico,
        'descricao', i.descricao,
        'quantidade', i.quantidade,
        'valor_unitario', i.valor_unitario,
        'subtotal', i.subtotal
    )), '[]'::jsonb) INTO v_itens
    FROM public.itens_proposta i
    WHERE i.proposta_id = p_proposta_id;

    SELECT jsonb_build_object(
        'nome', e.nome
    ) INTO v_empresa
    FROM public.propostas p
    LEFT JOIN public.empresas e ON p.empresa_id = e.id
    WHERE p.id = p_proposta_id;

    SELECT jsonb_build_object(
        'nome', u.nome,
        'nome_consultorio', u.nome_consultorio,
        'email', u.email,
        'telefone_consultorio', u.telefone_consultorio,
        'logo_url', u.logo_url
    ) INTO v_consultorio
    FROM public.propostas p
    JOIN public.usuarios u ON p.responsavel_id = u.id
    WHERE p.id = p_proposta_id;

    RETURN jsonb_build_object(
        'proposta', v_proposta,
        'itens', v_itens,
        'empresa', v_empresa,
        'consultorio', v_consultorio
    );
END;
$$;

-- RPC para responder a proposta publicamente (Aceitar/Rejeitar)
CREATE OR REPLACE FUNCTION public.respond_public_proposal(p_proposta_id uuid, p_status text, p_comentario text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_status NOT IN ('Aceita', 'Rejeitada') THEN
        RAISE EXCEPTION 'Status inválido';
    END IF;

    UPDATE public.propostas
    SET status = p_status,
        comentarios_cliente = p_comentario
    WHERE id = p_proposta_id AND status NOT IN ('Aceita', 'Rejeitada');

    IF FOUND THEN
        -- O trigger log_proposta_status_change cuidará de inserir em historico_propostas
        -- e o trigger trg_notifica_status_proposta cuidará das notificações
        RETURN true;
    END IF;

    RETURN false;
END;
$$;
