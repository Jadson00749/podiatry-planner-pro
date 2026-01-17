-- ============================================
-- SISTEMA DE AGENDAMENTO PÚBLICO
-- Permite clientes agendarem online via link
-- ============================================

-- 1. Adicionar campos na tabela profiles para suportar agendamento público
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'professional' CHECK (role IN ('professional', 'client')),
ADD COLUMN IF NOT EXISTS booking_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{
  "min_advance_hours": 2,
  "max_advance_days": 30,
  "auto_confirm": true,
  "working_hours": {
    "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "13:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "13:00"}
  },
  "slot_duration_minutes": 30
}'::jsonb;

-- 2. Adicionar campo na tabela clients para vincular com usuário que faz login
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_booking_code ON public.profiles(booking_code) WHERE booking_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_clients_linked_user ON public.clients(linked_user_id) WHERE linked_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(profile_id, appointment_date, appointment_time) 
  WHERE status != 'cancelled';

-- 4. Função para gerar código único de agendamento
CREATE OR REPLACE FUNCTION generate_booking_code(professional_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INT := 0;
BEGIN
  -- Criar código base a partir do nome (remove acentos, espaços, caracteres especiais)
  base_code := LOWER(
    REGEXP_REPLACE(
      TRANSLATE(
        professional_name,
        'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      ),
      '[^a-z0-9]', '-', 'g'
    )
  );
  
  -- Limitar a 20 caracteres
  base_code := SUBSTRING(base_code, 1, 20);
  
  -- Tentar o código base primeiro
  final_code := base_code;
  
  -- Se já existe, adicionar número
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE booking_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar RLS policies para permitir acesso público ao perfil do profissional (apenas leitura)
CREATE POLICY "Anyone can view professional profiles with booking enabled" 
ON public.profiles
FOR SELECT
USING (role = 'professional' AND booking_enabled = true);

-- 6. Atualizar RLS policies para clientes poderem ver seus próprios dados
CREATE POLICY "Clients can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id AND role = 'client');

CREATE POLICY "Clients can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id AND role = 'client');

-- 7. Permitir que clientes vejam procedimentos do profissional que eles agendaram
CREATE POLICY "Clients can view procedures from their professionals"
ON public.procedures
FOR SELECT
USING (
  profile_id IN (
    SELECT DISTINCT a.profile_id 
    FROM public.appointments a
    JOIN public.clients c ON c.id = a.client_id
    WHERE c.linked_user_id = auth.uid()
  )
);

-- 8. Permitir acesso público aos procedimentos de profissionais com booking ativo
CREATE POLICY "Anyone can view procedures from professionals with booking enabled"
ON public.procedures
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE role = 'professional' AND booking_enabled = true
  )
);

-- 9. Permitir clientes criarem seus próprios agendamentos
CREATE POLICY "Clients can create their own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM public.clients WHERE linked_user_id = auth.uid()
  )
);

-- 10. Permitir clientes verem seus próprios agendamentos
CREATE POLICY "Clients can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE linked_user_id = auth.uid()
  )
);

-- 11. Permitir clientes atualizarem seus próprios agendamentos (para cancelar)
CREATE POLICY "Clients can cancel their own appointments"
ON public.appointments
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE linked_user_id = auth.uid()
  )
  AND status = 'scheduled' -- Só pode cancelar agendamentos futuros
)
WITH CHECK (
  status = 'cancelled' -- Só pode mudar para cancelado
);

-- 12. Adicionar constraint para evitar double booking
-- Primeiro, remover constraint se existir
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS unique_professional_datetime;

-- Limpar duplicados antes de criar constraint (mantém o mais antigo)
DELETE FROM public.appointments a
USING public.appointments b
WHERE a.id > b.id
  AND a.profile_id = b.profile_id
  AND a.appointment_date = b.appointment_date
  AND a.appointment_time = b.appointment_time;

-- Agora criar a constraint
ALTER TABLE public.appointments
ADD CONSTRAINT unique_professional_datetime 
UNIQUE (profile_id, appointment_date, appointment_time);

-- 13. Função para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION check_appointment_availability(
  p_profile_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.appointments
    WHERE profile_id = p_profile_id
      AND appointment_date = p_date
      AND appointment_time = p_time
      AND status != 'cancelled'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Comentários nas tabelas para documentação
COMMENT ON COLUMN public.profiles.role IS 'Tipo de usuário: professional (usa o sistema) ou client (apenas agenda)';
COMMENT ON COLUMN public.profiles.booking_code IS 'Código único para link de agendamento público (ex: dra-maria-silva)';
COMMENT ON COLUMN public.profiles.booking_enabled IS 'Se o profissional ativou agendamento online';
COMMENT ON COLUMN public.profiles.booking_settings IS 'Configurações de agendamento: horários, antecedência, etc';
COMMENT ON COLUMN public.clients.linked_user_id IS 'Vincula cliente ao usuário autenticado (se cliente criou conta)';

-- 15. Atualizar profiles existentes para role='professional'
UPDATE public.profiles 
SET role = 'professional' 
WHERE role IS NULL;

