-- ============================================
-- FIX: Permitir acesso público aos perfis de profissionais
-- ============================================

-- Remover policy anterior
DROP POLICY IF EXISTS "Anyone can view professional profiles with booking enabled" ON public.profiles;

-- Criar nova policy que permite acesso PÚBLICO (sem autenticação)
CREATE POLICY "Public can view professional booking profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated  -- Permite tanto usuários anônimos quanto autenticados
USING (
  role = 'professional' 
  AND booking_enabled = true
);

-- Garantir que a tabela profiles permite acesso público
-- Isso é necessário para que usuários não autenticados possam ver
GRANT SELECT ON public.profiles TO anon;


