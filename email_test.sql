-- 📧 TESTE E DIAGNÓSTICO DO SISTEMA DE EMAIL
-- Use este arquivo para testar e diagnosticar problemas

-- ============================================
-- 0. ATUALIZAR FUNÇÃO COM TIMEZONE BRASIL (Execute primeiro se as datas estiverem erradas)
-- ============================================
CREATE OR REPLACE FUNCTION public.send_email_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  reminder_hour INTEGER;
  edge_function_url TEXT := 'https://vztevzgvpymiviiboopp.supabase.co/functions/v1/send-email-reminder';
  api_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGV2emd2cHltaXZpaWJvb3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjY2NDcsImV4cCI6MjA4MjcwMjY0N30.hG2vHaWjh_8moNrvMPhXzZ3ZqUxvsyB1R7DICZQBYlQ';
  response http_response;
  payload JSONB;
  hours_until_appointment NUMERIC;
  reminder_hours_array INTEGER[];
BEGIN
  FOR appointment_record IN
    SELECT 
      a.id, a.appointment_date, a.appointment_time,
      c.name as client_name, c.email as client_email,
      p.id as profile_id, p.clinic_name, p.clinic_email, p.clinic_address, p.phone as clinic_phone,
      p.reminder_hours_before, p.email_template
    FROM public.appointments a
    INNER JOIN public.clients c ON c.id = a.client_id
    INNER JOIN public.profiles p ON p.id = a.profile_id
    WHERE 
      a.status = 'scheduled'
      AND p.email_notifications_enabled = true
      AND c.email IS NOT NULL AND c.email != ''
      AND a.appointment_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
      AND (a.appointment_date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date 
           OR a.appointment_time > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::time)
  LOOP
    reminder_hours_array := appointment_record.reminder_hours_before;
    IF reminder_hours_array IS NULL OR array_length(reminder_hours_array, 1) IS NULL THEN
      CONTINUE;
    END IF;

    hours_until_appointment := EXTRACT(EPOCH FROM (
      (appointment_record.appointment_date::timestamp + appointment_record.appointment_time::time) 
      - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
    )) / 3600;

    FOREACH reminder_hour IN ARRAY reminder_hours_array
    LOOP
      IF hours_until_appointment <= reminder_hour 
         AND hours_until_appointment > (reminder_hour - 1)
         AND hours_until_appointment > 0 THEN
        
        IF NOT EXISTS (
          SELECT 1 FROM public.appointment_email_reminders
          WHERE appointment_id = appointment_record.id AND hours_before = reminder_hour
        ) THEN
          BEGIN
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

            SELECT * INTO response FROM http((
              'POST', edge_function_url,
              ARRAY[
                http_header('Content-Type', 'application/json'),
                http_header('Authorization', 'Bearer ' || api_key)
              ],
              'application/json', payload::text
            )::http_request);

            IF response.status = 200 THEN
              INSERT INTO public.appointment_email_reminders (appointment_id, hours_before, sent_at)
              VALUES (appointment_record.id, reminder_hour, NOW())
              ON CONFLICT (appointment_id, hours_before) DO NOTHING;
              RAISE NOTICE 'Email enviado: % (ID: %, %h antes)', 
                appointment_record.client_name, appointment_record.id, reminder_hour;
            ELSE
              RAISE WARNING 'Falha ao enviar: % (Status: %)', 
                appointment_record.client_name, response.status;
            END IF;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro: %', SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================
-- 0.1. VERIFICAR TIMEZONE
-- ============================================
SELECT 
  'TIMEZONE' as verificação,
  CURRENT_TIMESTAMP as utc_agora,
  (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') as brasil_agora,
  CURRENT_DATE as data_utc,
  (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date as data_brasil,
  CURRENT_TIME as hora_utc,
  (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::time as hora_brasil;

-- ============================================
-- 1. VERIFICAR CRON JOB
-- ============================================
SELECT 
  'CRON JOB' as verificação,
  jobname,
  schedule,
  active,
  CASE WHEN active THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status
FROM cron.job
WHERE jobname = 'send-email-reminders';

-- ============================================
-- 1.1. ATIVAR O CRON JOB (Execute esta seção se estiver inativo)
-- ============================================
-- Remove o job antigo se existir
SELECT cron.unschedule('send-email-reminders');

-- Cria o novo job ativo (roda a cada 15 minutos)
SELECT cron.schedule(
  'send-email-reminders',
  '*/15 * * * *', -- A cada 15 minutos
  $$SELECT public.send_email_reminders()$$
);

-- Verifica se foi criado
SELECT 
  'CRON JOB ATIVADO' as resultado,
  jobname,
  schedule,
  active,
  CASE WHEN active THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status
FROM cron.job
WHERE jobname = 'send-email-reminders';

-- ============================================
-- 2. VERIFICAR CONFIGURAÇÕES
-- ============================================
SELECT 
  'CONFIGURAÇÕES' as etapa,
  p.email_notifications_enabled,
  p.reminder_hours_before,
  (SELECT COUNT(*) FROM clients WHERE email IS NOT NULL AND email != '') as clientes_com_email
FROM profiles p
LIMIT 1;

-- ============================================
-- 3. DEBUG: VER TODOS OS AGENDAMENTOS DE HOJE
-- ============================================
SELECT 
  'DEBUG AGENDAMENTOS' as info,
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  c.name as cliente,
  c.email as email_cliente,
  CASE 
    WHEN c.email IS NULL OR c.email = '' THEN '❌ SEM EMAIL'
    ELSE '✅ TEM EMAIL'
  END as tem_email,
  p.email_notifications_enabled as email_ativado,
  p.reminder_hours_before as horas_config,
  CASE 
    WHEN c.email IS NULL OR c.email = '' THEN '❌ SEM EMAIL'
    WHEN p.email_notifications_enabled != true THEN '❌ EMAIL DESATIVADO'
    WHEN a.status != 'scheduled' THEN '❌ STATUS NÃO É SCHEDULED'
    ELSE '✅ OK PARA ENVIAR'
  END as status_envio
FROM appointments a
INNER JOIN clients c ON c.id = a.client_id
INNER JOIN profiles p ON p.id = a.profile_id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.appointment_time;

-- ============================================
-- 4. VERIFICAR AGENDAMENTOS FUTUROS
-- ============================================
SELECT 
  'AGENDAMENTO' as etapa,
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  c.name as cliente,
  c.email as email_cliente,
  CASE 
    WHEN c.email IS NULL OR c.email = '' THEN 'Sem email'
    WHEN p.email_notifications_enabled != true THEN 'Email desativado'
    ELSE 'OK'
  END as status
FROM appointments a
INNER JOIN clients c ON c.id = a.client_id
INNER JOIN profiles p ON p.id = a.profile_id
WHERE a.appointment_date = CURRENT_DATE
  AND a.appointment_time >= '21:00:00'
ORDER BY a.appointment_time DESC
LIMIT 1;

-- ============================================
-- 5. VERIFICAR EMAILS JÁ ENVIADOS
-- ============================================
SELECT 
  'EMAILS ENVIADOS' as info,
  aer.sent_at,
  c.name as cliente,
  a.appointment_date,
  a.appointment_time,
  aer.hours_before
FROM appointment_email_reminders aer
INNER JOIN appointments a ON a.id = aer.appointment_id
INNER JOIN clients c ON c.id = a.client_id
WHERE a.appointment_date >= CURRENT_DATE
ORDER BY aer.sent_at DESC
LIMIT 10;

-- ============================================
-- 6. TESTAR ENVIO IMEDIATO
-- Execute esta função para enviar email agora
-- ============================================
CREATE OR REPLACE FUNCTION test_send_email_now()
RETURNS TABLE(
  status_code INTEGER,
  status_text TEXT,
  response_content TEXT,
  email_cliente TEXT,
  sucesso BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
  appointment_record RECORD;
  edge_function_url TEXT := 'https://vztevzgvpymiviiboopp.supabase.co/functions/v1/send-email-reminder';
  -- IMPORTANTE: Use a service_role_key para chamadas internas (não a anon key)
  -- Encontre em: Project Settings → API → service_role secret key
  api_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGV2emd2cHltaXZpaWJvb3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyNjY0NywiZXhwIjoyMDgyNzAyNjQ3fQ.sJ07wd4Q79dojQdx9PTUyqMu5sDQ_VjgW4nkei_AGTg';
  response http_response;
  payload JSONB;
  reminder_hour INTEGER := 24;
BEGIN
  -- Busca o próximo agendamento futuro de hoje ou amanhã
  -- Usa timezone do Brasil (America/Sao_Paulo)
  SELECT a.id, a.appointment_date, a.appointment_time, c.name as client_name, c.email as client_email,
         p.clinic_name, p.clinic_email, p.clinic_address, p.phone as clinic_phone,
         p.reminder_hours_before, p.email_template, p.email_notifications_enabled
  INTO appointment_record
  FROM appointments a
  INNER JOIN clients c ON c.id = a.client_id
  INNER JOIN profiles p ON p.id = a.profile_id
  WHERE a.status = 'scheduled'
    AND c.email IS NOT NULL
    AND c.email != ''
    AND p.email_notifications_enabled = true
    AND (
      (a.appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date 
       AND a.appointment_time > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::time)
      OR a.appointment_date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    )
  ORDER BY a.appointment_date ASC, a.appointment_time ASC
  LIMIT 1;

  IF appointment_record.id IS NULL THEN
    RETURN QUERY SELECT 
      404::INTEGER, 
      'Nenhum agendamento encontrado. Verifique: 1) Cliente tem email? 2) Email ativado nas config? 3) Status = scheduled?'::TEXT, 
      ''::TEXT, 
      ''::TEXT, 
      false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Verifica se email está ativado
  IF appointment_record.email_notifications_enabled != true THEN
    RETURN QUERY SELECT 
      400::INTEGER, 
      'Email desativado nas configurações'::TEXT, 
      ''::TEXT, 
      appointment_record.client_email::TEXT, 
      false::BOOLEAN;
    RETURN;
  END IF;

  IF appointment_record.reminder_hours_before IS NOT NULL 
     AND array_length(appointment_record.reminder_hours_before, 1) > 0 THEN
    reminder_hour := appointment_record.reminder_hours_before[1];
  END IF;

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

  -- Faz a chamada HTTP (pode dar timeout, mas o email já foi enviado)
  BEGIN
    SELECT * INTO response
    FROM http((
      'POST', edge_function_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || api_key)
      ],
      'application/json', payload::text
    )::http_request);
  EXCEPTION WHEN OTHERS THEN
    -- Se der timeout, verifica se o email foi registrado no banco
    IF EXISTS (
      SELECT 1 FROM appointment_email_reminders 
      WHERE appointment_id = appointment_record.id 
      AND hours_before = reminder_hour
    ) THEN
      -- Email foi enviado mesmo com timeout
      RETURN QUERY SELECT 
        200::INTEGER,
        'Email enviado (timeout na resposta, mas email foi enviado)'::TEXT,
        ''::TEXT,
        appointment_record.client_email::TEXT,
        true::BOOLEAN;
      RETURN;
    ELSE
      -- Timeout e email não foi registrado
      RETURN QUERY SELECT 
        408::INTEGER,
        'Timeout na requisição'::TEXT,
        SQLERRM::TEXT,
        appointment_record.client_email::TEXT,
        false::BOOLEAN;
      RETURN;
    END IF;
  END;
  
  IF response.status = 200 THEN
    INSERT INTO appointment_email_reminders (appointment_id, hours_before, sent_at)
    VALUES (appointment_record.id, reminder_hour, NOW())
    ON CONFLICT (appointment_id, hours_before) DO UPDATE SET sent_at = NOW();
    
    RETURN QUERY SELECT 
      response.status::INTEGER,
      'Email enviado com sucesso'::TEXT,
      COALESCE(response.content::TEXT, '')::TEXT,
      appointment_record.client_email::TEXT,
      true::BOOLEAN;
  ELSE
    RETURN QUERY SELECT 
      response.status::INTEGER,
      'ERRO ao enviar email'::TEXT,
      COALESCE(response.content::TEXT, '')::TEXT,
      appointment_record.client_email::TEXT,
      false::BOOLEAN;
  END IF;
END $$;

-- Execute a função para testar:
SELECT * FROM test_send_email_now();

-- ============================================
-- 4. VERIFICAR SE FOI ENVIADO
-- ============================================
SELECT 
  'RESULTADO' as etapa,
  aer.sent_at,
  c.name as cliente,
  c.email as email_cliente,
  CASE 
    WHEN aer.sent_at >= NOW() - INTERVAL '1 minute' THEN 'ENVIADO AGORA'
    WHEN aer.sent_at IS NOT NULL THEN 'Enviado anteriormente'
    ELSE 'Nao enviado'
  END as status
FROM appointment_email_reminders aer
INNER JOIN appointments a ON a.id = aer.appointment_id
INNER JOIN clients c ON c.id = a.client_id
WHERE a.appointment_date = CURRENT_DATE
  AND a.appointment_time >= '21:00:00'
ORDER BY aer.sent_at DESC
LIMIT 1;

-- ============================================
-- 5. VERIFICAR CRON JOB
-- ============================================
SELECT 
  'CRON JOB' as etapa,
  jobname,
  schedule,
  active,
  CASE WHEN active THEN 'Ativo' ELSE 'Inativo' END as status
FROM cron.job
WHERE jobname = 'send-email-reminders';

-- Para ativar o cron job (execute se estiver inativo):
-- SELECT cron.schedule('send-email-reminders', '*/15 * * * *', $$SELECT public.send_email_reminders()$$);

-- ============================================
-- EXECUTAR TESTE DE ENVIO (Execute esta linha para testar)
-- ============================================
SELECT * FROM test_send_email_now();

