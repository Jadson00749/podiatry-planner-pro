-- Atualizar export_limit do plano Professional de 5 para 10
-- Esta migration atualiza usuários que já estão no plano Professional

UPDATE public.profiles
SET export_limit = 10
WHERE subscription_plan = 'professional' AND export_limit = 5;





