-- Tabela de Anamnese
CREATE TABLE public.anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Queixa Principal
  main_complaint TEXT,
  -- Histórico do Problema
  problem_history TEXT,
  -- Condições de Saúde (checkboxes)
  has_diabetes BOOLEAN DEFAULT false,
  has_circulatory_problems BOOLEAN DEFAULT false,
  has_hypertension BOOLEAN DEFAULT false,
  uses_continuous_medication BOOLEAN DEFAULT false,
  has_allergies BOOLEAN DEFAULT false,
  is_pregnant BOOLEAN DEFAULT false,
  -- Avaliação Podológica
  skin_type TEXT, -- seca / normal / úmida
  sensitivity TEXT, -- normal / reduzida / aumentada
  nail_condition TEXT,
  calluses_fissures TEXT,
  -- Observações Clínicas
  clinical_observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;

-- RLS Policies para anamnesis (via profile)
CREATE POLICY "Users can view their own anamnesis" ON public.anamnesis
  FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own anamnesis" ON public.anamnesis
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own anamnesis" ON public.anamnesis
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own anamnesis" ON public.anamnesis
  FOR DELETE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_anamnesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION update_anamnesis_updated_at();




















