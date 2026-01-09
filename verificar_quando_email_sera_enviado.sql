-- 📅 VERIFICAR QUANDO O EMAIL SERÁ ENVIADO AUTOMATICAMENTE
-- Execute este script para ver agendamentos que receberão email automaticamente

SELECT 
  'AGENDAMENTOS QUE RECEBERÃO EMAIL' as info,
  a.id,
  a.appointment_date,
  a.appointment_time,
  c.name as cliente,
  c.email as email_cliente,
  p.reminder_hours_before,
  ROUND(EXTRACT(EPOCH FROM (
    (a.appointment_date::timestamp + a.appointment_time::time) - NOW()
  )) / 3600, 2) as horas_ate_consulta,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM appointment_email_reminders aer
      WHERE aer.appointment_id = a.id
      AND aer.hours_before = ANY(p.reminder_hours_before)
    ) THEN '✅ Já enviado'
    WHEN EXTRACT(EPOCH FROM (
      (a.appointment_date::timestamp + a.appointment_time::time) - NOW()
    )) / 3600 <= ANY(p.reminder_hours_before) 
    AND EXTRACT(EPOCH FROM (
      (a.appointment_date::timestamp + a.appointment_time::time) - NOW()
    )) / 3600 > (ANY(p.reminder_hours_before) - 1)
    THEN '⏳ SERÁ ENVIADO NA PRÓXIMA EXECUÇÃO DO CRON (a cada 15 min)'
    ELSE '⏳ Ainda não está na janela de tempo'
  END as status_envio,
  -- Calcula quando será enviado
  CASE 
    WHEN EXTRACT(EPOCH FROM (
      (a.appointment_date::timestamp + a.appointment_time::time) - NOW()
    )) / 3600 <= ANY(p.reminder_hours_before) THEN
      'Será enviado quando faltar ' || 
      (SELECT MIN(h) FROM unnest(p.reminder_hours_before) h 
       WHERE EXTRACT(EPOCH FROM (
         (a.appointment_date::timestamp + a.appointment_time::time) - NOW()
       )) / 3600 <= h) || 'h'
    ELSE
      'Será enviado quando faltar ' || 
      (SELECT MAX(h) FROM unnest(p.reminder_hours_before) h) || 'h antes'
  END as quando_sera_enviado
FROM appointments a
INNER JOIN clients c ON c.id = a.client_id
INNER JOIN profiles p ON p.id = a.profile_id
WHERE 
  a.status = 'scheduled'
  AND p.email_notifications_enabled = true
  AND c.email IS NOT NULL
  AND c.email != ''
  AND a.appointment_date >= CURRENT_DATE
  AND (a.appointment_date > CURRENT_DATE OR a.appointment_time > CURRENT_TIME)
ORDER BY a.appointment_date, a.appointment_time
LIMIT 10;

