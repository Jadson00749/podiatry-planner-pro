-- Limpar dados duplicados do campo booking_settings
-- Remove working_hours do booking_settings já que agora usamos os campos:
-- working_hours_start, working_hours_end e working_days da aba Horários

-- Atualizar todos os perfis para remover working_hours do booking_settings
UPDATE public.profiles
SET booking_settings = booking_settings - 'working_hours'
WHERE booking_settings IS NOT NULL 
  AND booking_settings ? 'working_hours';

-- Verificar resultado
SELECT 
  full_name,
  booking_code,
  booking_settings,
  working_hours_start,
  working_hours_end,
  working_days
FROM public.profiles
WHERE booking_enabled = true;

