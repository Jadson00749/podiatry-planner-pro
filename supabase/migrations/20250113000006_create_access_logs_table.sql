-- =====================================================
-- Tabela para rastrear acessos/login dos usuários
-- =====================================================

-- Criar tabela de logs de acesso
CREATE TABLE IF NOT EXISTS public.app_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.app_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_email ON public.app_access_logs(email);
CREATE INDEX IF NOT EXISTS idx_access_logs_login_at ON public.app_access_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.app_access_logs(created_at DESC);

-- Comentários explicativos
COMMENT ON TABLE public.app_access_logs IS 'Registra todos os acessos/login dos usuários ao sistema';
COMMENT ON COLUMN public.app_access_logs.user_id IS 'ID do usuário que fez login';
COMMENT ON COLUMN public.app_access_logs.email IS 'Email do usuário no momento do login';
COMMENT ON COLUMN public.app_access_logs.login_at IS 'Data e hora do login';
COMMENT ON COLUMN public.app_access_logs.ip_address IS 'Endereço IP do usuário (opcional)';
COMMENT ON COLUMN public.app_access_logs.user_agent IS 'Navegador/dispositivo do usuário (opcional)';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.app_access_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view their own access logs"
  ON public.app_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Sistema pode inserir logs (via função)
CREATE POLICY "System can insert access logs"
  ON public.app_access_logs
  FOR INSERT
  WITH CHECK (true);

-- Função para registrar acesso (chamada do frontend)
CREATE OR REPLACE FUNCTION public.log_user_access(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Inserir log de acesso
  INSERT INTO public.app_access_logs (
    user_id,
    email,
    login_at,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_email,
    now(),
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.log_user_access IS 'Registra um acesso/login do usuário. Retorna o ID do log criado.';

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION public.log_user_access TO authenticated;











