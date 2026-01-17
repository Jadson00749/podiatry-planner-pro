-- =====================================================
-- SCRIPTS PARA UPGRADE MANUAL DE PLANOS
-- =====================================================
-- Use estes scripts no Supabase SQL Editor para fazer upgrade de planos
-- ⚠️ SUBSTITUA 'email@usuario.com' PELO EMAIL DO USUÁRIO

-- =====================================================
-- 1. UPGRADE PARA PLANO PROFESSIONAL
-- =====================================================
-- Copie e cole no SQL Editor, substituindo o email:

/*
UPDATE public.profiles
SET 
  subscription_plan = 'professional',
  max_clients = 200,
  max_procedures = 20,
  export_limit = 10,  -- 10 exportações por mês
  export_count = 0,    -- Resetar contador
  -- Opcional: definir data de expiração (ex: 1 mês)
  subscription_expires_at = now() + INTERVAL '1 month',
  -- Opcional: remover trial se ainda estiver ativo
  trial_ends_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA AQUI
);
*/

-- =====================================================
-- 2. UPGRADE PARA PLANO PREMIUM
-- =====================================================
-- Copie e cole no SQL Editor, substituindo o email:

/*
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  max_clients = -1,      -- Ilimitado
  max_procedures = -1,   -- Ilimitado
  export_limit = -1,     -- Ilimitado
  export_count = 0,      -- Resetar contador
  -- Opcional: definir data de expiração (ex: 1 mês)
  subscription_expires_at = now() + INTERVAL '1 month',
  -- Opcional: remover trial se ainda estiver ativo
  trial_ends_at = NULL
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA AQUI
);
*/

-- =====================================================
-- 3. DOWNGRADE PARA PLANO BASIC
-- =====================================================
-- Copie e cole no SQL Editor, substituindo o email:

/*
UPDATE public.profiles
SET 
  subscription_plan = 'basic',
  max_clients = 50,
  max_procedures = 10,
  export_limit = 0,
  export_count = 0,    -- Resetar contador
  subscription_expires_at = NULL,
  -- Opcional: renovar trial (15 dias)
  trial_ends_at = now() + INTERVAL '15 days'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA AQUI
);
*/

-- =====================================================
-- 4. RENOVAR ASSINATURA (adicionar mais tempo)
-- =====================================================
-- Adiciona mais 1 mês à data de expiração atual:

/*
UPDATE public.profiles
SET 
  subscription_expires_at = COALESCE(subscription_expires_at, now()) + INTERVAL '1 month'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'email@usuario.com'  -- ⚠️ SUBSTITUA AQUI
);
*/

-- =====================================================
-- 5. RESETAR CONTADOR DE EXPORTAÇÕES (mensal)
-- =====================================================
-- Útil para resetar o contador no início do mês:

/*
UPDATE public.profiles
SET export_count = 0
WHERE subscription_plan IN ('professional', 'premium');
*/

-- =====================================================
-- 6. VERIFICAR PLANO ATUAL DE UM USUÁRIO
-- =====================================================
-- Use para consultar o plano e limites de um usuário:

/*
SELECT 
  p.full_name,
  u.email,
  p.subscription_plan,
  p.trial_ends_at,
  p.subscription_expires_at,
  p.max_clients,
  p.max_procedures,
  p.export_limit,
  p.export_count,
  CASE 
    WHEN p.trial_ends_at > now() THEN 'Trial Ativo'
    WHEN p.subscription_expires_at IS NULL THEN 'Sem Expiração'
    WHEN p.subscription_expires_at > now() THEN 'Ativo'
    ELSE 'Expirado'
  END as status
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'email@usuario.com';  -- ⚠️ SUBSTITUA AQUI
*/

-- =====================================================
-- 7. LISTAR TODOS OS USUÁRIOS E SEUS PLANOS
-- =====================================================
-- Use para ver todos os usuários e seus planos:

/*
SELECT 
  u.email,
  p.full_name,
  p.subscription_plan,
  CASE 
    WHEN p.trial_ends_at > now() THEN 'Trial Ativo'
    WHEN p.subscription_expires_at IS NULL THEN 'Sem Expiração'
    WHEN p.subscription_expires_at > now() THEN 'Ativo'
    ELSE 'Expirado'
  END as status,
  p.trial_ends_at,
  p.subscription_expires_at,
  p.max_clients,
  p.max_procedures,
  p.export_count,
  p.export_limit
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.subscription_plan, u.email;
*/











