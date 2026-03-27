-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.consultores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT,
    taxa_horaria_junior NUMERIC DEFAULT 0,
    taxa_horaria_pleno NUMERIC DEFAULT 0,
    taxa_horaria_senior NUMERIC DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rotas_aereas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    valor_passagem NUMERIC DEFAULT 0,
    tempo_voo TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hoteis_regioes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    regiao TEXT NOT NULL,
    valor_diaria_economica NUMERIC DEFAULT 0,
    valor_diaria_media NUMERIC DEFAULT 0,
    valor_diaria_premium NUMERIC DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.per_diem_regioes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    regiao TEXT NOT NULL,
    valor_diario NUMERIC DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testes_psicologicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_unitario NUMERIC DEFAULT 0,
    tempo_aplicacao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_unitario NUMERIC DEFAULT 0,
    categoria TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parametros_financeiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(usuario_id, chave)
);

-- 2. Enable RLS
ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotas_aereas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoteis_regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.per_diem_regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testes_psicologicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_financeiros ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- consultores
DROP POLICY IF EXISTS "consultores_policy" ON public.consultores;
CREATE POLICY "consultores_policy" ON public.consultores FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_consultores" ON public.consultores;
CREATE POLICY "team_select_consultores" ON public.consultores FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- rotas_aereas
DROP POLICY IF EXISTS "rotas_aereas_policy" ON public.rotas_aereas;
CREATE POLICY "rotas_aereas_policy" ON public.rotas_aereas FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_rotas_aereas" ON public.rotas_aereas;
CREATE POLICY "team_select_rotas_aereas" ON public.rotas_aereas FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- hoteis_regioes
DROP POLICY IF EXISTS "hoteis_regioes_policy" ON public.hoteis_regioes;
CREATE POLICY "hoteis_regioes_policy" ON public.hoteis_regioes FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_hoteis_regioes" ON public.hoteis_regioes;
CREATE POLICY "team_select_hoteis_regioes" ON public.hoteis_regioes FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- per_diem_regioes
DROP POLICY IF EXISTS "per_diem_regioes_policy" ON public.per_diem_regioes;
CREATE POLICY "per_diem_regioes_policy" ON public.per_diem_regioes FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_per_diem_regioes" ON public.per_diem_regioes;
CREATE POLICY "team_select_per_diem_regioes" ON public.per_diem_regioes FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- testes_psicologicos
DROP POLICY IF EXISTS "testes_psicologicos_policy" ON public.testes_psicologicos;
CREATE POLICY "testes_psicologicos_policy" ON public.testes_psicologicos FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_testes_psicologicos" ON public.testes_psicologicos;
CREATE POLICY "team_select_testes_psicologicos" ON public.testes_psicologicos FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- materiais
DROP POLICY IF EXISTS "materiais_policy" ON public.materiais;
CREATE POLICY "materiais_policy" ON public.materiais FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_materiais" ON public.materiais;
CREATE POLICY "team_select_materiais" ON public.materiais FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- parametros_financeiros
DROP POLICY IF EXISTS "parametros_financeiros_policy" ON public.parametros_financeiros;
CREATE POLICY "parametros_financeiros_policy" ON public.parametros_financeiros FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "team_select_parametros_financeiros" ON public.parametros_financeiros;
CREATE POLICY "team_select_parametros_financeiros" ON public.parametros_financeiros FOR SELECT TO authenticated USING ((usuario_id IN ( SELECT usuarios.id FROM usuarios WHERE (COALESCE(usuarios.parent_id, usuarios.id) = get_tenant_id()))) AND (get_user_role() = ANY (ARRAY['admin'::text, 'gerente'::text])));

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_consultores_ativo ON public.consultores(ativo);
CREATE INDEX IF NOT EXISTS idx_rotas_aereas_ativo ON public.rotas_aereas(ativo);

CREATE INDEX IF NOT EXISTS idx_hoteis_regioes_ativo ON public.hoteis_regioes(ativo);
CREATE INDEX IF NOT EXISTS idx_hoteis_regioes_regiao ON public.hoteis_regioes(regiao);

CREATE INDEX IF NOT EXISTS idx_per_diem_regioes_ativo ON public.per_diem_regioes(ativo);
CREATE INDEX IF NOT EXISTS idx_per_diem_regioes_regiao ON public.per_diem_regioes(regiao);

CREATE INDEX IF NOT EXISTS idx_testes_psicologicos_ativo ON public.testes_psicologicos(ativo);
CREATE INDEX IF NOT EXISTS idx_materiais_ativo ON public.materiais(ativo);

CREATE INDEX IF NOT EXISTS idx_parametros_financeiros_ativo ON public.parametros_financeiros(ativo);
CREATE INDEX IF NOT EXISTS idx_parametros_financeiros_chave ON public.parametros_financeiros(chave);

-- 5. Triggers for updated_at
DROP TRIGGER IF EXISTS set_consultores_updated_at ON public.consultores;
CREATE TRIGGER set_consultores_updated_at BEFORE UPDATE ON public.consultores FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_rotas_aereas_updated_at ON public.rotas_aereas;
CREATE TRIGGER set_rotas_aereas_updated_at BEFORE UPDATE ON public.rotas_aereas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_hoteis_regioes_updated_at ON public.hoteis_regioes;
CREATE TRIGGER set_hoteis_regioes_updated_at BEFORE UPDATE ON public.hoteis_regioes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_per_diem_regioes_updated_at ON public.per_diem_regioes;
CREATE TRIGGER set_per_diem_regioes_updated_at BEFORE UPDATE ON public.per_diem_regioes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_testes_psicologicos_updated_at ON public.testes_psicologicos;
CREATE TRIGGER set_testes_psicologicos_updated_at BEFORE UPDATE ON public.testes_psicologicos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_materiais_updated_at ON public.materiais;
CREATE TRIGGER set_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_parametros_financeiros_updated_at ON public.parametros_financeiros;
CREATE TRIGGER set_parametros_financeiros_updated_at BEFORE UPDATE ON public.parametros_financeiros FOR EACH ROW EXECUTE FUNCTION set_updated_at();
