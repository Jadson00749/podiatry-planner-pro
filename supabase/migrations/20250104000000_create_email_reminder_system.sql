-- Migration: Sistema de lembretes automáticos via Email
-- Executa a cada 15 minutos e envia lembretes baseado em reminder_hours_before

-- Habilita a extensão http (necessária para chamar Edge Functions)
CREATE EXTENSION IF NOT EXISTS http;

-- Tabela para controlar emails já enviados
CREATE TABLE IF NOT EXISTS public.appointment_email_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, hours_before)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_reminders_appointment ON public.appointment_email_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_sent_at ON public.appointment_email_reminders(sent_at);

-- Comentários
COMMENT ON TABLE public.appointment_email_reminders IS 'Registra emails de lembrete já enviados para evitar duplicatas';
COMMENT ON COLUMN public.appointment_email_reminders.hours_before IS 'Quantas horas antes do agendamento o email foi enviado';

-- Função que busca e processa agendamentos para enviar lembretes por email
CREATE OR REPLACE FUNCTION public.send_email_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  reminder_hour INTEGER;
  edge_function_url TEXT;
  api_key TEXT;
  response http_response;
  payload JSONB;
  hours_until_appointment NUMERIC;
  reminder_hours_array INTEGER[];
BEGIN
  -- URL da Edge Function - construída diretamente
  -- IMPORTANTE: Substitua 'vztevzgvpymiviiboopp' pelo ID do seu projeto se diferente
  edge_function_url := 'https://vztevzgvpymiviiboopp.supabase.co/functions/v1/send-email-reminder';
  
  -- API Key - IMPORTANTE: Substitua pela sua anon key
  -- Você pode encontrar em: Project Settings → API → anon public key
  api_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGV2emd2cHltaXZpaWJvb3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjY2NDcsImV4cCI6MjA4MjcwMjY0N30.hG2vHaWjh_8moNrvMPhXzZ3ZqUxvsyB1R7DICZQBYlQ';

  -- Busca agendamentos que precisam de lembrete por email
  -- Critérios:
  -- 1. Status = 'scheduled' (agendado)
  -- 2. Profile tem email_notifications_enabled = true
  -- 3. Cliente tem email cadastrado
  -- 4. Agendamento é futuro
  FOR appointment_record IN
    SELECT 
      a.id,
      a.appointment_date,
      a.appointment_time,
      c.name as client_name,
      c.email as client_email,
      p.id as profile_id,
      p.clinic_name,
      p.clinic_email,
      p.clinic_address,
      p.phone as clinic_phone,
      p.reminder_hours_before,
      p.email_template
    FROM public.appointments a
    INNER JOIN public.clients c ON c.id = a.client_id
    INNER JOIN public.profiles p ON p.id = a.profile_id
    WHERE 
      a.status = 'scheduled'
      AND p.email_notifications_enabled = true
      AND c.email IS NOT NULL
      AND c.email != ''
      AND a.appointment_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
      AND (
        a.appointment_date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date 
        OR a.appointment_time > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::time
      )
  LOOP
    -- Pega o array de horas de lembrete
    reminder_hours_array := appointment_record.reminder_hours_before;
    IF reminder_hours_array IS NULL OR array_length(reminder_hours_array, 1) IS NULL THEN
      CONTINUE; -- Pula se não tem horas configuradas
    END IF;

    -- Calcula horas até o agendamento (usando timezone do Brasil)
    hours_until_appointment := EXTRACT(EPOCH FROM (
      (appointment_record.appointment_date::timestamp + appointment_record.appointment_time::time) 
      - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
    )) / 3600;

    -- Para cada hora de lembrete configurada
    FOREACH reminder_hour IN ARRAY reminder_hours_array
    LOOP
      -- Verifica se está na janela de tempo para enviar (ex: entre 24h e 23h antes)
      -- Envia se está dentro de 1 hora antes do horário de lembrete
      IF hours_until_appointment <= reminder_hour 
         AND hours_until_appointment > (reminder_hour - 1)
         AND hours_until_appointment > 0 THEN
        
        -- Verifica se já foi enviado
        IF NOT EXISTS (
          SELECT 1 FROM public.appointment_email_reminders
          WHERE appointment_id = appointment_record.id
          AND hours_before = reminder_hour
        ) THEN
          BEGIN
            -- Monta o payload JSON
            payload := jsonb_build_object(
              'reminder', jsonb_build_object(
                'appointment_id', appointment_record.id,
                'client_name', appointment_record.client_name,
                'client_email', appointment_record.client_email,
                'appointment_date', appointment_record.appointment_date,
                'appointment_time', appointment_record.appointment_time,
                'clinic_name', appointment_record.clinic_name,
                'clinic_email', appointment_record.clinic_email,
                'clinic_address', appointment_record.clinic_address,
                'clinic_phone', appointment_record.clinic_phone,
                'hours_before', reminder_hour,
                'email_template', appointment_record.email_template
              )
            );

            -- Chama a Edge Function
            SELECT * INTO response
            FROM http((
              'POST',
              edge_function_url,
              ARRAY[
                http_header('Content-Type', 'application/json'),
                http_header('Authorization', 'Bearer ' || api_key)
              ],
              'application/json',
              payload::text
            )::http_request);

            -- Log do resultado e registra o envio
            IF response.status = 200 THEN
              -- Insere o registro na tabela para evitar duplicatas
              INSERT INTO public.appointment_email_reminders (appointment_id, hours_before, sent_at)
              VALUES (appointment_record.id, reminder_hour, NOW())
              ON CONFLICT (appointment_id, hours_before) DO NOTHING;
              
              RAISE NOTICE 'Email de lembrete enviado com sucesso para: % (ID: %, %h antes)', 
                appointment_record.client_name, appointment_record.id, reminder_hour;
            ELSE
              RAISE WARNING 'Falha ao enviar email para: % (Status: %)', 
                appointment_record.client_name, response.status;
            END IF;

          EXCEPTION WHEN OTHERS THEN
            -- Log de erro mas continua processando outros
            RAISE WARNING 'Erro ao processar agendamento ID % para lembrete de %h: %', 
              appointment_record.id, reminder_hour, SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.send_email_reminders() IS 
'Função que verifica agendamentos e envia lembretes automáticos por email baseado em reminder_hours_before';

-- Grant para execução
GRANT EXECUTE ON FUNCTION public.send_email_reminders() TO postgres;

-- Cria cron job para executar a cada 15 minutos
-- IMPORTANTE: Descomente e ajuste após configurar as variáveis de ambiente
/*
SELECT cron.schedule(
  'send-email-reminders',
  '*/15 * * * *', -- A cada 15 minutos
  $$SELECT public.send_email_reminders()$$
);
*/

-- Comentário sobre configuração
COMMENT ON FUNCTION public.send_email_reminders() IS 
'IMPORTANTE: Antes de usar, atualize na função acima:
1. A URL da Edge Function (linha ~42) com o ID do seu projeto Supabase
2. A API Key anon (linha ~45) - encontre em Project Settings → API → anon public key
3. Descomente o cron job acima para ativar execução automática.';

