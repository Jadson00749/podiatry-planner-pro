-- Create anamnesis_templates table
CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL para templates do sistema
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_system_template BOOLEAN DEFAULT false, -- Templates prontos do sistema
  area TEXT, -- 'salon', 'health', 'fitness', 'pet', 'beauty', 'other'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create template_questions table
CREATE TABLE IF NOT EXISTS public.template_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.anamnesis_templates(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL, -- 'yes_no', 'yes_no_details', 'multiple_choice', 'text_short', 'text_long', 'number', 'date', 'section'
  question_text TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  has_observations BOOLEAN DEFAULT false,
  options JSONB, -- Para múltipla escolha: ["Opção 1", "Opção 2"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_profile_id ON public.anamnesis_templates(profile_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_is_system ON public.anamnesis_templates(is_system_template);
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON public.template_questions(template_id);

-- RLS Policies
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_questions ENABLE ROW LEVEL SECURITY;

-- Políticas para anamnesis_templates
CREATE POLICY "Users can view their own templates and system templates"
  ON public.anamnesis_templates FOR SELECT
  USING (
    (profile_id IS NOT NULL AND auth.uid() = profile_id) OR is_system_template = true
  );

CREATE POLICY "Users can insert their own templates"
  ON public.anamnesis_templates FOR INSERT
  WITH CHECK (profile_id IS NOT NULL AND auth.uid() = profile_id AND is_system_template = false);

CREATE POLICY "Users can update their own templates"
  ON public.anamnesis_templates FOR UPDATE
  USING (profile_id IS NOT NULL AND auth.uid() = profile_id AND is_system_template = false);

CREATE POLICY "Users can delete their own templates"
  ON public.anamnesis_templates FOR DELETE
  USING (profile_id IS NOT NULL AND auth.uid() = profile_id AND is_system_template = false);

-- Políticas para template_questions
CREATE POLICY "Users can view questions from their templates or system templates"
  ON public.template_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND ((anamnesis_templates.profile_id IS NOT NULL AND anamnesis_templates.profile_id = auth.uid()) 
           OR anamnesis_templates.is_system_template = true)
    )
  );

CREATE POLICY "Users can insert questions to their templates"
  ON public.template_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id = auth.uid()
      AND anamnesis_templates.is_system_template = false
    )
  );

CREATE POLICY "Users can update questions from their templates"
  ON public.template_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id = auth.uid()
      AND anamnesis_templates.is_system_template = false
    )
  );

CREATE POLICY "Users can delete questions from their templates"
  ON public.template_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.anamnesis_templates
      WHERE anamnesis_templates.id = template_questions.template_id
      AND anamnesis_templates.profile_id IS NOT NULL
      AND anamnesis_templates.profile_id = auth.uid()
      AND anamnesis_templates.is_system_template = false
    )
  );

-- Comments
COMMENT ON TABLE public.anamnesis_templates IS 'Templates de anamnese personalizáveis por área de atuação';
COMMENT ON TABLE public.template_questions IS 'Perguntas dos templates de anamnese';
COMMENT ON COLUMN public.anamnesis_templates.is_system_template IS 'Templates prontos do sistema (não editáveis)';
COMMENT ON COLUMN public.template_questions.question_type IS 'Tipo da pergunta: yes_no, yes_no_details, multiple_choice, text_short, text_long, number, date, section';

