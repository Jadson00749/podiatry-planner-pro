-- Insert system templates (templates prontos)
-- Estes templates são apenas exemplos e podem ser copiados pelos usuários

-- ID fixo para poder referenciar nas perguntas
-- Vamos criar templates para 6 áreas diferentes

-- 1. SALÃO/BARBEARIA
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 
   NULL, 
   'Salão de Beleza', 
   'Template para salões de beleza, barbearias e cabeleireiros', 
   false, 
   true, 
   'salon');

-- Perguntas para Salão
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 1, 'section', 'Histórico Capilar', false, false, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 2, 'yes_no_details', 'Já fez química no cabelo?', true, true, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 3, 'multiple_choice', 'Tipo de cabelo:', true, false, '["Liso", "Ondulado", "Cacheado", "Crespo"]'::jsonb),
  ('00000000-0000-0000-0000-000000000001'::uuid, 4, 'text_short', 'Cor atual do cabelo:', false, false, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 5, 'text_short', 'Cor desejada:', false, false, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 6, 'yes_no_details', 'Tem alergia a algum produto?', true, true, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 7, 'yes_no', 'Usa medicamentos para o cabelo?', false, false, null),
  ('00000000-0000-0000-0000-000000000001'::uuid, 8, 'text_long', 'Observações gerais:', false, false, null);

-- 2. PODOLOGIA/SAÚDE
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000002'::uuid, 
   NULL, 
   'Podologia e Saúde', 
   'Template para podólogos, fisioterapeutas e profissionais da saúde', 
   false, 
   true, 
   'health');

-- Perguntas para Podologia
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000002'::uuid, 1, 'section', 'Histórico de Saúde', false, false, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 2, 'yes_no_details', 'Tem diabetes?', true, true, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 3, 'yes_no_details', 'Tem problemas circulatórios?', true, true, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 4, 'yes_no_details', 'Tem ou já teve micose?', false, true, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 5, 'yes_no_details', 'Sente dores nos pés?', true, true, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 6, 'yes_no', 'Usa calçados adequados?', false, false, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 7, 'yes_no_details', 'Pratica atividade física?', false, true, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 8, 'multiple_choice', 'Tipo de pé:', false, false, '["Normal", "Chato", "Cavo"]'::jsonb),
  ('00000000-0000-0000-0000-000000000002'::uuid, 9, 'text_long', 'Medicamentos em uso:', false, false, null),
  ('00000000-0000-0000-0000-000000000002'::uuid, 10, 'text_long', 'Observações gerais:', false, false, null);

-- 3. ESTÉTICA/MANICURE
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000003'::uuid, 
   NULL, 
   'Estética e Manicure', 
   'Template para manicures, pedicures e estúdios de estética', 
   false, 
   true, 
   'beauty');

-- Perguntas para Estética
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000003'::uuid, 1, 'section', 'Informações de Beleza', false, false, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 2, 'multiple_choice', 'Tipo de unha:', false, false, '["Curta", "Média", "Longa", "Acrigel"]'::jsonb),
  ('00000000-0000-0000-0000-000000000003'::uuid, 3, 'yes_no', 'Remove cutícula?', false, false, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 4, 'yes_no_details', 'Tem alergia a esmalte ou produtos?', true, true, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 5, 'text_short', 'Cor de esmalte preferida:', false, false, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 6, 'yes_no', 'Roí unhas?', false, false, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 7, 'text_long', 'Tratamentos estéticos anteriores:', false, false, null),
  ('00000000-0000-0000-0000-000000000003'::uuid, 8, 'text_long', 'Observações gerais:', false, false, null);

-- 4. FITNESS/PERSONAL
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000004'::uuid, 
   NULL, 
   'Personal e Fitness', 
   'Template para personal trainers, academias e profissionais de fitness', 
   false, 
   true, 
   'fitness');

-- Perguntas para Fitness
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000004'::uuid, 1, 'section', 'Avaliação Física', false, false, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 2, 'number', 'Peso atual (kg):', true, false, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 3, 'number', 'Altura (cm):', true, false, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 4, 'multiple_choice', 'Objetivo principal:', true, false, '["Emagrecimento", "Ganho de massa", "Condicionamento", "Reabilitação", "Qualidade de vida"]'::jsonb),
  ('00000000-0000-0000-0000-000000000004'::uuid, 5, 'yes_no_details', 'Pratica atividade física atualmente?', true, true, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 6, 'yes_no_details', 'Tem alguma lesão ou limitação?', true, true, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 7, 'yes_no_details', 'Tem problema cardíaco?', true, true, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 8, 'yes_no', 'Faz acompanhamento nutricional?', false, false, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 9, 'text_long', 'Medicamentos em uso:', false, false, null),
  ('00000000-0000-0000-0000-000000000004'::uuid, 10, 'text_long', 'Observações gerais:', false, false, null);

-- 5. PET/VETERINÁRIO
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000005'::uuid, 
   NULL, 
   'Pet e Veterinário', 
   'Template para pet shops, veterinários e cuidadores de animais', 
   false, 
   true, 
   'pet');

-- Perguntas para Pet
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000005'::uuid, 1, 'section', 'Informações do Pet', false, false, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 2, 'text_short', 'Nome do pet:', true, false, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 3, 'multiple_choice', 'Espécie:', true, false, '["Cão", "Gato", "Ave", "Outro"]'::jsonb),
  ('00000000-0000-0000-0000-000000000005'::uuid, 4, 'text_short', 'Raça:', false, false, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 5, 'number', 'Idade (anos):', true, false, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 6, 'number', 'Peso (kg):', false, false, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 7, 'yes_no_details', 'Vacinação em dia?', true, true, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 8, 'yes_no_details', 'Tem alguma alergia?', true, true, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 9, 'yes_no_details', 'Está em tratamento?', false, true, null),
  ('00000000-0000-0000-0000-000000000005'::uuid, 10, 'text_long', 'Observações gerais:', false, false, null);

-- 6. MODELO EM BRANCO
INSERT INTO public.anamnesis_templates (id, profile_id, name, description, is_default, is_system_template, area)
VALUES 
  ('00000000-0000-0000-0000-000000000006'::uuid, 
   NULL, 
   'Modelo em Branco', 
   'Comece do zero e crie seu próprio modelo personalizado', 
   false, 
   true, 
   'other');

-- Perguntas básicas para Modelo em Branco
INSERT INTO public.template_questions (template_id, question_order, question_type, question_text, is_required, has_observations, options)
VALUES
  ('00000000-0000-0000-0000-000000000006'::uuid, 1, 'section', 'Informações Gerais', false, false, null),
  ('00000000-0000-0000-0000-000000000006'::uuid, 2, 'text_long', 'Observações:', false, false, null);

COMMENT ON TABLE public.anamnesis_templates IS 'Templates de anamnese - Incluindo templates do sistema (is_system_template = true)';

