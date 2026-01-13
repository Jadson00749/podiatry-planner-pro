-- Adicionar campos de subscription/plano na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic' 
  CHECK (subscription_plan IN ('basic', 'professional', 'premium'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS export_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS export_limit INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 50;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_procedures INTEGER DEFAULT 10;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Plano de assinatura: basic, professional ou premium';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Data de término do período de trial (15 dias grátis)';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'Data de expiração da assinatura (null = sem limite)';
COMMENT ON COLUMN public.profiles.export_count IS 'Contador de exportações realizadas no mês';
COMMENT ON COLUMN public.profiles.export_limit IS 'Limite de exportações permitidas no plano atual';
COMMENT ON COLUMN public.profiles.max_clients IS 'Limite máximo de clientes permitidos no plano';
COMMENT ON COLUMN public.profiles.max_procedures IS 'Limite máximo de procedimentos permitidos no plano';

-- Função para inicializar trial ao criar perfil (se não tiver trial_ends_at)
CREATE OR REPLACE FUNCTION public.initialize_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não tem trial_ends_at e subscription_plan é basic, inicializa trial de 15 dias
  IF NEW.trial_ends_at IS NULL AND NEW.subscription_plan = 'basic' THEN
    NEW.trial_ends_at := now() + INTERVAL '15 days';
  END IF;
  
  -- Define limites baseados no plano
  IF NEW.subscription_plan = 'basic' THEN
    NEW.max_clients := COALESCE(NEW.max_clients, 50);
    NEW.max_procedures := COALESCE(NEW.max_procedures, 10);
    NEW.export_limit := 0;
  ELSIF NEW.subscription_plan = 'professional' THEN
    NEW.max_clients := COALESCE(NEW.max_clients, 200);
    NEW.max_procedures := COALESCE(NEW.max_procedures, 20);
    NEW.export_limit := COALESCE(NEW.export_limit, 10);
  ELSIF NEW.subscription_plan = 'premium' THEN
    NEW.max_clients := -1; -- ilimitado
    NEW.max_procedures := -1; -- ilimitado
    NEW.export_limit := -1; -- ilimitado
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para inicializar trial e limites ao criar/atualizar perfil
CREATE TRIGGER initialize_subscription_limits
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_trial();

