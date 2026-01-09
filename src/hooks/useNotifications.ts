import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { format, parseISO, isAfter, differenceInHours, differenceInDays, subDays } from 'date-fns';
import { isNotificationRead } from './useNotificationRead';

export interface Notification {
  id: string;
  type: 'appointment_reminder';
  appointment_id: string;
  title: string;
  message: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  hours_before: number;
  read: boolean;
  created_at: string;
  appointment_status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

export function useNotifications() {
  const { data: profile } = useProfile();

  // Serializa o array para usar como chave estável
  // Cria uma string estável baseada no conteúdo ordenado do array
  // Usa uma abordagem mais simples para evitar loops
  const reminderHoursKey = useMemo(() => {
    const hours = profile?.reminder_hours_before;
    if (!hours || !Array.isArray(hours) || hours.length === 0) {
      return 'default';
    }
    // Cria uma cópia ordenada e serializa para comparação estável
    const sorted = [...hours].sort((a, b) => a - b);
    return sorted.join(',');
  }, [
    // Usa apenas o profile.id e uma string serializada do array
    profile?.id,
    profile?.reminder_hours_before ? profile.reminder_hours_before.slice().sort().join(',') : 'default'
  ]);

  const queryResult = useQuery({
    queryKey: ['notifications', profile?.id, profile?.notifications_enabled, reminderHoursKey],
    queryFn: async () => {
      // Se notificações estão desabilitadas, retorna vazio
      if (!profile?.notifications_enabled || !profile?.id) {
        return [];
      }

      const now = new Date();
      // Data limite: 30 dias atrás para buscar agendamentos futuros (lembretes)
      const thirtyDaysAgo = subDays(now, 30);

      // Busca agendamentos dos últimos 30 dias até o futuro
      // Busca todos os status para mostrar notificações de consultas passadas com status atualizado
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (id, name, phone, whatsapp)
        `)
        .eq('profile_id', profile.id)
        .gte('appointment_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      if (!appointments) return [];

      const notifications: Notification[] = [];
      const reminderHours = profile.reminder_hours_before || [24];

      // Para cada agendamento, verifica se precisa de notificação
      appointments.forEach(apt => {
        const appointmentDateTime = parseISO(`${apt.appointment_date}T${apt.appointment_time}`);
        const daysSinceAppointment = differenceInDays(now, appointmentDateTime);
        
        const isFuture = isAfter(appointmentDateTime, now);
        const hoursSinceAppointment = differenceInHours(now, appointmentDateTime);
        
        // Para agendamentos futuros: mantém 30 dias (lembretes são úteis)
        // Para agendamentos passados: apenas últimas 24h (reduz drasticamente a redundância)
        if (isFuture) {
          // Ignora agendamentos futuros muito distantes (mais de 30 dias)
          if (daysSinceAppointment < -30) return;
        } else {
          // Ignora agendamentos que passaram há mais de 24h
          // Isso mantém apenas consultas do dia atual ou muito recentes
          if (hoursSinceAppointment > 24) return;
        }

        const hoursUntilAppointment = differenceInHours(appointmentDateTime, now);

        // Para agendamentos futuros: mostra notificações de lembrete
        if (isFuture) {
          // Ordena as horas de lembrete do maior para o menor
          const sortedReminderHours = [...reminderHours].sort((a, b) => b - a);
          
          // Encontra a primeira hora de lembrete que ainda não passou
          // Ex: se configurado [24, 12, 2] e faltam 15h, mostra notificação de 12h
          const applicableReminder = sortedReminderHours.find(hoursBefore => 
            hoursUntilAppointment <= hoursBefore
          );

          if (applicableReminder) {
            // Só cria notificação se ainda não passou do próximo lembrete
            // Ex: se tem [24, 12, 2] e faltam 15h, mostra 12h
            // Mas se faltam 1h, mostra 2h (o mais próximo que ainda não passou)
            const nextReminder = sortedReminderHours.find(h => h < applicableReminder && hoursUntilAppointment <= h);
            const shouldShow = !nextReminder || hoursUntilAppointment > nextReminder;

            if (shouldShow) {
              const notificationId = `${apt.id}-${applicableReminder}`;
              notifications.push({
                id: notificationId,
                type: 'appointment_reminder',
                appointment_id: apt.id,
                title: 'Lembrete de Agendamento',
                message: `${apt.clients?.name || 'Cliente'} tem consulta em ${Math.round(hoursUntilAppointment)}h`,
                appointment_date: apt.appointment_date,
                appointment_time: apt.appointment_time,
                client_name: apt.clients?.name || 'Cliente',
                hours_before: applicableReminder,
                read: isNotificationRead(notificationId, profile?.id),
                created_at: now.toISOString(),
              });
            }
          }
        } else {
          // Para agendamentos que já passaram (mas há menos de 30 dias): mostra notificação
          // Isso permite que o usuário veja e gerencie notificações de consultas recentes
          const notificationId = `${apt.id}-past`;
          
          // Define título e mensagem baseado no status
          let title = 'Agendamento Realizado';
          let message = `${apt.clients?.name || 'Cliente'} - Consulta realizada`;
          
          if (apt.status === 'completed') {
            title = 'Consulta Concluída';
            message = `${apt.clients?.name || 'Cliente'} - Consulta concluída`;
          } else if (apt.status === 'cancelled') {
            title = 'Consulta Cancelada';
            message = `${apt.clients?.name || 'Cliente'} - Consulta cancelada`;
          } else if (apt.status === 'no_show') {
            title = 'Cliente Não Compareceu';
            message = `${apt.clients?.name || 'Cliente'} - Não compareceu à consulta`;
          } else if (apt.status === 'scheduled') {
            // Se ainda está como 'scheduled' mas já passou, mantém "Agendamento Realizado"
            title = 'Agendamento Realizado';
            message = `${apt.clients?.name || 'Cliente'} - Consulta realizada`;
          }
          
          notifications.push({
            id: notificationId,
            type: 'appointment_reminder',
            appointment_id: apt.id,
            title,
            message,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            client_name: apt.clients?.name || 'Cliente',
            hours_before: 0, // Não aplicável para agendamentos passados
            read: isNotificationRead(notificationId, profile?.id),
            created_at: now.toISOString(),
            appointment_status: apt.status,
          });
        }
      });

      // Ordena por data/hora do agendamento (mais recentes primeiro)
      const sortedNotifications = notifications.sort((a, b) => {
        const dateA = parseISO(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = parseISO(`${b.appointment_date}T${b.appointment_time}`);
        return dateB.getTime() - dateA.getTime(); // Invertido para mostrar mais recentes primeiro
      });

      return sortedNotifications;
    },
    enabled: !!profile?.id && profile.notifications_enabled === true,
    staleTime: 30000, // Considera os dados "frescos" por 30 segundos
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    refetchIntervalInBackground: false, // Não refaz quando a aba está em background
  });

  return queryResult;
}

