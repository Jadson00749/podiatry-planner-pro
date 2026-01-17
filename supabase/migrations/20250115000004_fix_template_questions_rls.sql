-- Corrigir as políticas RLS para template_questions
-- O problema é que as policies antigas usam auth.uid() diretamente

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view questions from their templates or system templates" ON public.template_questions;
DROP POLICY IF EXISTS "Users can insert questions to their templates" ON public.template_questions;
DROP POLICY IF EXISTS "Users can update questions from their templates" ON public.template_questions;
DROP POLICY IF EXISTS "Users can delete questions from their templates" ON public.template_questions;

-- Recriar com lógica corrigida
CREATE POLICY "Users can view questions from their templates or system templates"
  ON public.template_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND (
        anamnesis_templates.is_system_template = true 
        OR 
        (anamnesis_templates.profile_id IS NOT NULL 
         AND anamnesis_templates.profile_id IN (
           SELECT id FROM public.profiles WHERE user_id = auth.uid()
         ))
      )
    )
  );

CREATE POLICY "Users can insert questions to their templates"
  ON public.template_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.is_system_template = false
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update questions from their templates"
  ON public.template_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.is_system_template = false
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete questions from their templates"
  ON public.template_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.is_system_template = false
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.template_questions IS 'Perguntas dos templates com RLS corrigido para usar profiles.user_id';









