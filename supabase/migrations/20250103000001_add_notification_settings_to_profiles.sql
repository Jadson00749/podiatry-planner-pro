-- Adicionar campos de configurações de notificações na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER[] DEFAULT ARRAY[24]::INTEGER[],
ADD COLUMN IF NOT EXISTS email_template TEXT;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Ativa/desativa notificações no sistema (avisos no dashboard)';
COMMENT ON COLUMN public.profiles.email_notifications_enabled IS 'Ativa/desativa envio automático de emails de lembrete';
COMMENT ON COLUMN public.profiles.reminder_hours_before IS 'Array de horas antes do agendamento para enviar lembretes (ex: [24, 12, 2])';
COMMENT ON COLUMN public.profiles.email_template IS 'Template personalizado para emails de lembrete (opcional)';








