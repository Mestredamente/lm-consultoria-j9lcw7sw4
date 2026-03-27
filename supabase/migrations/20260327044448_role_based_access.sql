-- Function to get the current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Function to get the tenant id (parent_id or own id)
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid AS $$
  SELECT COALESCE(parent_id, id) FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Update RLS for usuarios
DROP POLICY IF EXISTS "parent_select_usuarios" ON public.usuarios;
CREATE POLICY "parent_select_usuarios" ON public.usuarios
  FOR SELECT TO authenticated
  USING ( COALESCE(parent_id, id) = public.get_tenant_id() AND public.get_user_role() IN ('admin', 'gerente') );

DROP POLICY IF EXISTS "admin_update_usuarios" ON public.usuarios;
CREATE POLICY "admin_update_usuarios" ON public.usuarios
  FOR UPDATE TO authenticated
  USING ( public.get_user_role() = 'admin' AND COALESCE(parent_id, id) = public.get_tenant_id() )
  WITH CHECK ( public.get_user_role() = 'admin' AND COALESCE(parent_id, id) = public.get_tenant_id() );

-- Add team select policies
DROP POLICY IF EXISTS "team_select_empresas" ON public.empresas;
CREATE POLICY "team_select_empresas" ON public.empresas
  FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE COALESCE(parent_id, id) = public.get_tenant_id())
    AND public.get_user_role() IN ('admin', 'gerente')
  );

DROP POLICY IF EXISTS "team_select_contatos" ON public.contatos;
CREATE POLICY "team_select_contatos" ON public.contatos
  FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE COALESCE(parent_id, id) = public.get_tenant_id())
    AND public.get_user_role() IN ('admin', 'gerente')
  );

DROP POLICY IF EXISTS "team_select_oportunidades" ON public.oportunidades;
CREATE POLICY "team_select_oportunidades" ON public.oportunidades
  FOR SELECT TO authenticated
  USING (
    responsavel_id IN (SELECT id FROM public.usuarios WHERE COALESCE(parent_id, id) = public.get_tenant_id())
    AND public.get_user_role() IN ('admin', 'gerente')
  );

DROP POLICY IF EXISTS "team_select_atividades" ON public.atividades;
CREATE POLICY "team_select_atividades" ON public.atividades
  FOR SELECT TO authenticated
  USING (
    responsavel_id IN (SELECT id FROM public.usuarios WHERE COALESCE(parent_id, id) = public.get_tenant_id())
    AND public.get_user_role() IN ('admin', 'gerente')
  );
