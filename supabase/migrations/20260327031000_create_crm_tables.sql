DO $$ 
BEGIN
  -- We alter the existing usuarios table
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nome TEXT;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
  WHEN undefined_table THEN
    -- If it didn't exist for some reason, we create it
    CREATE TABLE public.usuarios (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      nome TEXT,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
END $$;

CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  setor TEXT,
  endereco TEXT,
  website TEXT,
  num_funcionarios INTEGER DEFAULT 0,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  email TEXT,
  telefone TEXT,
  linkedin TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresas_policy" ON public.empresas;
CREATE POLICY "empresas_policy" ON public.empresas
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "contatos_policy" ON public.contatos;
CREATE POLICY "contatos_policy" ON public.contatos
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_empresas_updated_at ON public.empresas;
CREATE TRIGGER set_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_contatos_updated_at ON public.contatos;
CREATE TRIGGER set_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mestredamente1@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'mestredamente1@gmail.com',
      crypt('securepassword123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    
    INSERT INTO public.usuarios (id, email, nome)
    VALUES (new_user_id, 'mestredamente1@gmail.com', 'Admin')
    ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;
  END IF;
END $$;
