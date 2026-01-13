-- Atualizar limite de procedimentos do plano básico de 5 para 10
-- Esta migration atualiza os perfis que já têm max_procedures = 5 no plano básico

UPDATE public.profiles
SET max_procedures = 10
WHERE subscription_plan = 'basic' 
  AND max_procedures = 5;

