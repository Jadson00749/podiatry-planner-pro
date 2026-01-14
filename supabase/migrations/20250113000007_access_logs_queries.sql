-- =====================================================
-- QUERIES ÚTEIS PARA CONSULTAR LOGS DE ACESSO
-- =====================================================
-- Use estes scripts no Supabase SQL Editor para consultar os acessos

-- =====================================================
-- 1. VER TODOS OS ACESSOS (últimos primeiro)
-- =====================================================
/*
SELECT 
  al.id,
  al.email,
  p.full_name,
  al.login_at,
  al.ip_address,
  al.user_agent,
  al.created_at
FROM public.app_access_logs al
LEFT JOIN public.profiles p ON p.user_id = al.user_id
ORDER BY al.login_at DESC
LIMIT 100;
*/

-- =====================================================
-- 2. ACESSOS DE UM USUÁRIO ESPECÍFICO
-- =====================================================
-- Substitua 'email@usuario.com' pelo email do usuário

/*
SELECT 
  al.id,
  al.email,
  p.full_name,
  al.login_at,
  al.ip_address,
  al.user_agent
FROM public.app_access_logs al
LEFT JOIN public.profiles p ON p.user_id = al.user_id
WHERE al.email = 'email@usuario.com'  -- ⚠️ SUBSTITUA AQUI
ORDER BY al.login_at DESC;
*/

-- =====================================================
-- 3. ÚLTIMO ACESSO DE CADA USUÁRIO
-- =====================================================
/*
SELECT 
  al.email,
  p.full_name,
  MAX(al.login_at) as ultimo_acesso,
  COUNT(*) as total_acessos
FROM public.app_access_logs al
LEFT JOIN public.profiles p ON p.user_id = al.user_id
GROUP BY al.email, p.full_name
ORDER BY ultimo_acesso DESC;
*/

-- =====================================================
-- 4. ACESSOS HOJE
-- =====================================================
/*
SELECT 
  al.email,
  p.full_name,
  al.login_at,
  COUNT(*) OVER (PARTITION BY al.email) as acessos_hoje
FROM public.app_access_logs al
LEFT JOIN public.profiles p ON p.user_id = al.user_id
WHERE DATE(al.login_at) = CURRENT_DATE
ORDER BY al.login_at DESC;
*/

-- =====================================================
-- 5. ACESSOS POR DIA (últimos 30 dias)
-- =====================================================
/*
SELECT 
  DATE(al.login_at) as data,
  COUNT(*) as total_acessos,
  COUNT(DISTINCT al.user_id) as usuarios_unicos
FROM public.app_access_logs al
WHERE al.login_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(al.login_at)
ORDER BY data DESC;
*/

-- =====================================================
-- 6. TOP 10 USUÁRIOS QUE MAIS ACESSARAM
-- =====================================================
/*
SELECT 
  al.email,
  p.full_name,
  COUNT(*) as total_acessos,
  MAX(al.login_at) as ultimo_acesso
FROM public.app_access_logs al
LEFT JOIN public.profiles p ON p.user_id = al.user_id
GROUP BY al.email, p.full_name
ORDER BY total_acessos DESC
LIMIT 10;
*/

-- =====================================================
-- 7. ACESSOS POR HORA DO DIA (últimos 7 dias)
-- =====================================================
/*
SELECT 
  EXTRACT(HOUR FROM al.login_at) as hora,
  COUNT(*) as total_acessos
FROM public.app_access_logs al
WHERE al.login_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM al.login_at)
ORDER BY hora;
*/

-- =====================================================
-- 8. USUÁRIOS QUE NUNCA ACESSARAM (têm perfil mas nunca fizeram login)
-- =====================================================
/*
SELECT 
  u.email,
  p.full_name,
  p.created_at as perfil_criado_em
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.app_access_logs al ON al.user_id = u.id
WHERE al.id IS NULL
ORDER BY p.created_at DESC;
*/

-- =====================================================
-- 9. ESTATÍSTICAS GERAIS
-- =====================================================
/*
SELECT 
  COUNT(*) as total_acessos,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  MIN(login_at) as primeiro_acesso,
  MAX(login_at) as ultimo_acesso,
  COUNT(*) FILTER (WHERE DATE(login_at) = CURRENT_DATE) as acessos_hoje,
  COUNT(*) FILTER (WHERE login_at >= CURRENT_DATE - INTERVAL '7 days') as acessos_7_dias,
  COUNT(*) FILTER (WHERE login_at >= CURRENT_DATE - INTERVAL '30 days') as acessos_30_dias
FROM public.app_access_logs;
*/

-- =====================================================
-- 10. LIMPAR LOGS ANTIGOS (manter apenas últimos 90 dias)
-- =====================================================
-- ⚠️ CUIDADO: Esta query DELETA dados permanentemente!
-- Use apenas se quiser limpar logs muito antigos

/*
DELETE FROM public.app_access_logs
WHERE login_at < CURRENT_DATE - INTERVAL '90 days';
*/





