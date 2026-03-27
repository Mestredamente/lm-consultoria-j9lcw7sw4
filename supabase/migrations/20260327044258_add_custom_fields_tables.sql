-- Add missing columns to existing campos_personalizados table
ALTER TABLE public.campos_personalizados
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS obrigatorio BOOLEAN DEFAULT false;

-- Create valores_campos_personalizados table
CREATE TABLE IF NOT EXISTS public.valores_campos_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id UUID NOT NULL REFERENCES public.campos_personalizados(id) ON DELETE CASCADE,
  registro_id UUID NOT NULL,
  valor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.valores_campos_personalizados ENABLE ROW LEVEL SECURITY;

-- Policies for valores_campos_personalizados
-- Users can manage values if they own the custom field definition
DROP POLICY IF EXISTS "valores_campos_personalizados_policy" ON public.valores_campos_personalizados;
CREATE POLICY "valores_campos_personalizados_policy" ON public.valores_campos_personalizados
  FOR ALL TO authenticated
  USING (
    campo_id IN (SELECT id FROM public.campos_personalizados WHERE usuario_id = auth.uid())
  )
  WITH CHECK (
    campo_id IN (SELECT id FROM public.campos_personalizados WHERE usuario_id = auth.uid())
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_valores_campos_personalizados_updated_at ON public.valores_campos_personalizados;
CREATE TRIGGER set_valores_campos_personalizados_updated_at
  BEFORE UPDATE ON public.valores_campos_personalizados
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Force RLS on campos_personalizados if not already enabled (safety check)
ALTER TABLE public.campos_personalizados ENABLE ROW LEVEL SECURITY;
