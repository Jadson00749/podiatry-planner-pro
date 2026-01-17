-- Script para testar expiração do trial
-- ATENÇÃO: Este script expira o trial do seu usuário para testar bloqueios
-- Execute apenas para testar, depois pode reverter se necessário

-- Opção 1: Atualizar pelo email do usuário (substitua 'seu-email@exemplo.com' pelo seu email)
UPDATE public.profiles
SET 
  trial_ends_at = now() - INTERVAL '1 day',  -- Trial expirado há 1 dia
  subscription_plan = 'basic'  -- Garantir que está no plano básico
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL AQUI
);

-- Opção 2: Se você souber o user_id diretamente (mais rápido)
-- Descomente e use esta opção se souber o UUID do seu user_id
-- UPDATE public.profiles
-- SET 
--   trial_ends_at = now() - INTERVAL '1 day',
--   subscription_plan = 'basic'
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ SUBSTITUA PELO SEU USER_ID AQUI

-- Verificar se atualizou corretamente
-- SELECT 
--   p.id,
--   p.full_name,
--   p.subscription_plan,
--   p.trial_ends_at,
--   CASE 
--     WHEN p.trial_ends_at < now() THEN 'Trial Expirado'
--     ELSE 'Trial Ativo'
--   END as status_trial,
--   u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.user_id
-- WHERE u.email = 'seu-email@exemplo.com';  -- ⚠️ SUBSTITUA PELO SEU EMAIL AQUI











