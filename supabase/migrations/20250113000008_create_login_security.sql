-- =====================================================
-- Sistema de Segurança no Login
-- Rate Limiting: 5 tentativas falhas = bloqueio 15 min
-- =====================================================

-- Tabela para rastrear tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked_until ON public.login_attempts(blocked_until);
CREATE INDEX IF NOT EXISTS idx_login_attempts_last_attempt ON public.login_attempts(last_attempt DESC);

-- Comentários
COMMENT ON TABLE public.login_attempts IS 'Registra tentativas de login falhas para rate limiting';
COMMENT ON COLUMN public.login_attempts.email IS 'Email que está tentando fazer login';
COMMENT ON COLUMN public.login_attempts.failed_attempts IS 'Número de tentativas falhas consecutivas';
COMMENT ON COLUMN public.login_attempts.blocked_until IS 'Data/hora até quando o email está bloqueado (NULL = não bloqueado)';

-- Habilitar RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política: Sistema pode inserir/atualizar (via função)
CREATE POLICY "System can manage login attempts"
  ON public.login_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para verificar se email está bloqueado
CREATE OR REPLACE FUNCTION public.check_login_blocked(p_email TEXT)
RETURNS TABLE (
  is_blocked BOOLEAN,
  blocked_until TIMESTAMP WITH TIME ZONE,
  attempts_remaining INTEGER,
  failed_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_max_attempts INTEGER := 5;
  v_block_duration INTERVAL := '15 minutes';
BEGIN
  -- Buscar tentativas do email
  SELECT * INTO v_attempt
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
  ORDER BY last_attempt DESC
  LIMIT 1;

  -- Se não existe registro, não está bloqueado
  IF v_attempt IS NULL THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMP WITH TIME ZONE, v_max_attempts, 0;
    RETURN;
  END IF;

  -- Se está bloqueado e ainda não expirou
  IF v_attempt.blocked_until IS NOT NULL AND v_attempt.blocked_until > now() THEN
    RETURN QUERY SELECT 
      true, 
      v_attempt.blocked_until, 
      0, 
      v_attempt.failed_attempts;
    RETURN;
  END IF;

  -- Se bloqueio expirou, resetar
  IF v_attempt.blocked_until IS NOT NULL AND v_attempt.blocked_until <= now() THEN
    UPDATE public.login_attempts
    SET 
      failed_attempts = 0,
      blocked_until = NULL,
      updated_at = now()
    WHERE email = LOWER(p_email);
    
    RETURN QUERY SELECT false, NULL::TIMESTAMP WITH TIME ZONE, v_max_attempts, 0;
    RETURN;
  END IF;

  -- Calcular tentativas restantes
  DECLARE
    v_remaining INTEGER := GREATEST(0, v_max_attempts - v_attempt.failed_attempts);
  BEGIN
    RETURN QUERY SELECT 
      false, 
      NULL::TIMESTAMP WITH TIME ZONE, 
      v_remaining, 
      v_attempt.failed_attempts;
  END;
END;
$$;

-- Função para registrar tentativa falha
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_blocked BOOLEAN,
  blocked_until TIMESTAMP WITH TIME ZONE,
  attempts_remaining INTEGER,
  failed_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_max_attempts INTEGER := 5;
  v_block_duration INTERVAL := '15 minutes';
  v_new_attempts INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar tentativas existentes
  SELECT * INTO v_attempt
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
  ORDER BY last_attempt DESC
  LIMIT 1;

  -- Se não existe, criar novo registro
  IF v_attempt IS NULL THEN
    INSERT INTO public.login_attempts (email, failed_attempts, last_attempt, ip_address, user_agent)
    VALUES (LOWER(p_email), 1, now(), p_ip_address, p_user_agent)
    RETURNING * INTO v_attempt;
  ELSE
    -- Incrementar tentativas
    v_new_attempts := v_attempt.failed_attempts + 1;
    
    -- Se atingiu o limite, bloquear
    IF v_new_attempts >= v_max_attempts THEN
      v_blocked_until := now() + v_block_duration;
    ELSE
      v_blocked_until := NULL;
    END IF;

    -- Atualizar registro
    UPDATE public.login_attempts
    SET 
      failed_attempts = v_new_attempts,
      last_attempt = now(),
      blocked_until = v_blocked_until,
      ip_address = COALESCE(p_ip_address, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent),
      updated_at = now()
    WHERE email = LOWER(p_email)
    RETURNING * INTO v_attempt;
  END IF;

  -- Retornar status
  RETURN QUERY SELECT 
    (v_attempt.blocked_until IS NOT NULL AND v_attempt.blocked_until > now()),
    v_attempt.blocked_until,
    GREATEST(0, v_max_attempts - v_attempt.failed_attempts),
    v_attempt.failed_attempts;
END;
$$;

-- Função para resetar tentativas (quando login é bem-sucedido)
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.login_attempts
  SET 
    failed_attempts = 0,
    blocked_until = NULL,
    updated_at = now()
  WHERE email = LOWER(p_email);
END;
$$;

-- Comentários nas funções
COMMENT ON FUNCTION public.check_login_blocked IS 'Verifica se um email está bloqueado e retorna informações sobre tentativas';
COMMENT ON FUNCTION public.record_failed_login IS 'Registra uma tentativa de login falha e retorna status atualizado';
COMMENT ON FUNCTION public.reset_login_attempts IS 'Reseta as tentativas de login quando login é bem-sucedido';

-- Permitir que usuários autenticados chamem as funções
GRANT EXECUTE ON FUNCTION public.check_login_blocked TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts TO anon, authenticated;





