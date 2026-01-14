-- Script para RESTAURAR o trial (usar depois dos testes)
-- Este script restaura o trial para mais 15 dias a partir de agora

-- Opção 1: Restaurar pelo email do usuário
UPDATE public.profiles
SET 
  trial_ends_at = now() + INTERVAL '15 days'  -- Trial renovado por mais 15 dias
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL AQUI
);

-- Opção 2: Se você souber o user_id diretamente
-- UPDATE public.profiles
-- SET 
--   trial_ends_at = now() + INTERVAL '15 days'
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ SUBSTITUA PELO SEU USER_ID AQUI



