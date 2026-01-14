-- ========================================
-- SCRIPTS DE TESTE DE PLANOS
-- Email: santosjadson797@hotmail.com
-- ========================================

-- ========================================
-- 1️⃣ RESTAURAR TRIAL (15 dias)
-- ========================================
-- Use quando quiser resetar o trial
/*
UPDATE public.profiles
SET 
  trial_ends_at = now() + INTERVAL '15 days'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'santosjadson797@hotmail.com'
);
*/

-- ========================================
-- 2️⃣ REMOVER TRIAL E MANTER PLANO BÁSICO
-- ========================================
-- Remove o trial mas mantém o plano básico ativo
/*
UPDATE public.profiles
SET 
  trial_ends_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'santosjadson797@hotmail.com'
);
*/

-- ========================================
-- 3️⃣ ALTERAR PARA PLANO BÁSICO (SEM TRIAL)
-- ========================================
-- 1 template de anamnese
-- 50 clientes
-- 10 procedimentos
-- 0 exportações
-- SEM expiração (plano ativo para sempre)
/*
UPDATE public.profiles
SET 
  subscription_plan = 'basic',
  trial_ends_at = NULL,
  subscription_expires_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'santosjadson797@hotmail.com'
);
*/

-- ========================================
-- 4️⃣ ALTERAR PARA PLANO PROFISSIONAL (SEM TRIAL)
-- ========================================
-- 3 templates de anamnese
-- 200 clientes
-- 20 procedimentos
-- 10 exportações/mês
-- SEM expiração (plano ativo para sempre)
/*
UPDATE public.profiles
SET 
  subscription_plan = 'professional',
  trial_ends_at = NULL,
  subscription_expires_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'santosjadson797@hotmail.com'
);
*/

-- ========================================
-- 5️⃣ ALTERAR PARA PLANO PREMIUM (SEM TRIAL)
-- ========================================
-- Templates ilimitados
-- Clientes ilimitados
-- Procedimentos ilimitados
-- Exportações ilimitadas
-- SEM expiração (plano ativo para sempre)
/*
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  trial_ends_at = NULL,
  subscription_expires_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'santosjadson797@hotmail.com'
);
*/

-- ========================================
-- 6️⃣ VERIFICAR SEU PLANO ATUAL
-- ========================================
-- Cole esse no SQL Editor para ver seu status
/*
SELECT 
  p.subscription_plan as "Plano Atual",
  p.trial_ends_at as "Trial Termina Em",
  p.subscription_expires_at as "Plano Expira Em",
  CASE 
    WHEN p.trial_ends_at > now() THEN '✅ Trial Ativo'
    WHEN p.subscription_expires_at IS NULL THEN '✅ Plano Ativo (Sem Expiração)'
    WHEN p.subscription_expires_at > now() THEN '✅ Plano Pago Ativo'
    ELSE '⚠️ Expirado'
  END as "Status",
  u.email
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'santosjadson797@hotmail.com';
*/





