-- Atualizar perfis existentes com trial e limites corretos
-- Esta migration atualiza os registros que já existiam antes da adição dos campos de subscription

UPDATE public.profiles
SET 
  -- Inicializar trial de 15 dias para usuários básicos que não têm trial definido
  trial_ends_at = CASE 
    WHEN trial_ends_at IS NULL AND (subscription_plan = 'basic' OR subscription_plan IS NULL) 
    THEN now() + INTERVAL '15 days'
    ELSE trial_ends_at
  END,
  
  -- Garantir que subscription_plan seja 'basic' se for NULL
  subscription_plan = COALESCE(subscription_plan, 'basic'),
  
  -- Definir limites baseados no plano atual
  max_clients = CASE 
    WHEN subscription_plan = 'premium' THEN -1
    WHEN subscription_plan = 'professional' THEN COALESCE(max_clients, 200)
    ELSE COALESCE(max_clients, 50)
  END,
  
  max_procedures = CASE 
    WHEN subscription_plan = 'premium' THEN -1
    WHEN subscription_plan = 'professional' THEN COALESCE(max_procedures, 20)
    ELSE COALESCE(max_procedures, 10)
  END,
  
  export_limit = CASE 
    WHEN subscription_plan = 'premium' THEN -1
    WHEN subscription_plan = 'professional' THEN COALESCE(export_limit, 10)
    ELSE 0
  END,
  
  -- Garantir que export_count seja 0 se for NULL
  export_count = COALESCE(export_count, 0)
WHERE 
  -- Apenas atualizar registros que precisam de ajuste
  (
    trial_ends_at IS NULL 
    OR subscription_plan IS NULL 
    OR max_clients IS NULL 
    OR max_procedures IS NULL 
    OR export_limit IS NULL
    OR export_count IS NULL
  );

