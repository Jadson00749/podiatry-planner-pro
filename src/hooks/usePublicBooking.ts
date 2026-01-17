import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicProfessionalInfo, TimeSlot, CreateClientAppointmentData } from '@/types/booking';
import { format, addDays, parse, isBefore, isAfter, startOfDay } from 'date-fns';

// Buscar informações públicas do profissional pelo código
export function usePublicProfessional(bookingCode: string) {
  return useQuery({
    queryKey: ['public-professional', bookingCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, clinic_name, phone, avatar_url, booking_code, booking_settings, booking_enabled, working_hours_start, working_hours_end, working_days, appointment_duration')
        .eq('booking_code', bookingCode)
        .eq('role', 'professional')
        .eq('booking_enabled', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profissional não encontrado ou agendamento não ativado');

      return data as unknown as PublicProfessionalInfo;
    },
    enabled: !!bookingCode,
    staleTime: 0, // Sem cache - sempre buscar dados atualizados
  });
}

// Buscar procedimentos disponíveis do profissional
export function usePublicProcedures(professionalId: string) {
  return useQuery({
    queryKey: ['public-procedures', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('id, name, default_price, duration_minutes, description')
        .eq('profile_id', professionalId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });
}

// Gerar horários disponíveis para uma data específica
export function useAvailableTimeSlots(
  professionalId: string,
  date: Date,
  professional: PublicProfessionalInfo | undefined
) {
  return useQuery({
    queryKey: ['available-slots', professionalId, format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!professional) return [];

      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...
      
      // Verificar se trabalha neste dia usando working_days
      if (!professional.working_days || !professional.working_days.includes(dayOfWeek)) {
        return []; // Não trabalha neste dia
      }

      // Usar horários da aba Horários
      if (!professional.working_hours_start || !professional.working_hours_end) {
        return []; // Sem horários configurados
      }

      // Buscar agendamentos já existentes
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('profile_id', professionalId)
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Gerar todos os horários possíveis
      const slots: TimeSlot[] = [];
      // Remover segundos se vier do banco (ex: "08:00:00" -> "08:00")
      const startTimeStr = professional.working_hours_start.substring(0, 5);
      const endTimeStr = professional.working_hours_end.substring(0, 5);
      const startTime = parse(startTimeStr, 'HH:mm', new Date());
      const endTime = parse(endTimeStr, 'HH:mm', new Date());
      const slotDuration = professional.booking_settings?.slot_duration_minutes || professional.appointment_duration || 30;

      let currentTime = startTime;
      
      // Normalizar horários do banco para formato HH:mm
      const occupiedTimes = new Set(
        appointments?.map(a => {
          // Se vier como "13:45:00", pegar só "13:45"
          return a.appointment_time.substring(0, 5);
        }) || []
      );

      // Verificar se é hoje e aplicar antecedência mínima
      const now = new Date();
      const minAdvanceHours = professional.booking_settings?.min_advance_hours || 2;
      const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

      while (isBefore(currentTime, endTime)) {
        const timeStr = format(currentTime, 'HH:mm');
        let available = !occupiedTimes.has(timeStr);
        let reason: string | undefined;

        // Se for hoje, verificar se já passou do horário + antecedência mínima
        if (isToday && available) {
          const slotDateTime = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
          const minDateTime = addDays(now, 0);
          minDateTime.setHours(minDateTime.getHours() + minAdvanceHours);

          if (isBefore(slotDateTime, minDateTime)) {
            available = false;
            reason = 'Horário muito próximo';
          }
        }

        slots.push({
          time: timeStr,
          available,
          reason: !available && !reason ? 'Horário ocupado' : reason,
        });

        // Próximo slot
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }

      return slots;
    },
    enabled: !!professionalId && !!date && !!professional,
    staleTime: 0, // Sempre buscar dados atualizados
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

// Criar agendamento como cliente
export function useCreatePublicAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientAppointmentData) => {
      // Pegar usuário atual autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Verificar se o cliente já existe (por telefone)
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', data.professional_id)
        .eq('phone', data.client_phone)
        .maybeSingle();

      let clientId: string;

      if (existingClient) {
        // Cliente já existe, atualizar dados se necessário
        clientId = existingClient.id;
        
        await supabase
          .from('clients')
          .update({
            name: data.client_name,
            whatsapp: data.client_whatsapp || data.client_phone,
            email: data.client_email,
            linked_user_id: user?.id || null,
          })
          .eq('id', clientId);
      } else {
        // Criar novo cliente vinculando ao usuário autenticado
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            profile_id: data.professional_id,
            name: data.client_name,
            phone: data.client_phone,
            whatsapp: data.client_whatsapp || data.client_phone,
            email: data.client_email,
            linked_user_id: user?.id || null,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // 2. Criar o agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          profile_id: data.professional_id,
          client_id: clientId,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          procedure_id: data.procedure_id || null,
          notes: data.notes || null,
          status: 'scheduled',
          price: 0, // Será definido pelo profissional
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

// Verificar se uma data pode ser agendada
export function useIsDateBookable(
  professional: PublicProfessionalInfo | undefined
) {
  return (date: Date) => {
    if (!professional) return false;

    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...
    
    // Verificar se trabalha neste dia
    if (!professional.working_days || !professional.working_days.includes(dayOfWeek)) {
      return false;
    }

    // Verificar se está dentro do prazo máximo de antecedência
    const maxAdvanceDays = professional.booking_settings?.max_advance_days || 30;
    const maxDate = addDays(new Date(), maxAdvanceDays);
    
    return !isAfter(date, maxDate) && !isBefore(startOfDay(date), startOfDay(new Date()));
  };
}
