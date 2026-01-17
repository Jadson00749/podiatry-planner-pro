-- Corrigir a função initialize_trial para NÃO forçar trial em UPDATES
-- Isso permite que você remova o trial manualmente

CREATE OR REPLACE FUNCTION public.initialize_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- APENAS em INSERT (novos usuários), inicializa trial de 15 dias se for plano basic
  IF TG_OP = 'INSERT' AND NEW.trial_ends_at IS NULL AND NEW.subscription_plan = 'basic' THEN
    NEW.trial_ends_at := now() + INTERVAL '15 days';
  END IF;
  
  -- Define limites baseados no plano (sempre)
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

-- Comentário
COMMENT ON FUNCTION public.initialize_trial() IS 
'Inicializa trial de 15 dias APENAS para novos usuários (INSERT).
Em UPDATEs, respeita o valor de trial_ends_at definido manualmente.';







