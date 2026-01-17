-- Corrigir as políticas RLS para anamnesis_templates
-- O problema é que profile_id é diferente de auth.uid() em alguns casos

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view their own templates and system templates" ON public.anamnesis_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.anamnesis_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.anamnesis_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.anamnesis_templates;

-- Recriar com lógica corrigida
CREATE POLICY "Users can view their own templates and system templates"
  ON public.anamnesis_templates FOR SELECT
  USING (
    is_system_template = true 
    OR 
    (profile_id IS NOT NULL AND profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert their own templates"
  ON public.anamnesis_templates FOR INSERT
  WITH CHECK (
    is_system_template = false
    AND profile_id IS NOT NULL 
    AND profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own templates"
  ON public.anamnesis_templates FOR UPDATE
  USING (
    is_system_template = false
    AND profile_id IS NOT NULL 
    AND profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own templates"
  ON public.anamnesis_templates FOR DELETE
  USING (
    is_system_template = false
    AND profile_id IS NOT NULL 
    AND profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.anamnesis_templates IS 'Templates de anamnese com RLS corrigido para usar profiles.user_id';









