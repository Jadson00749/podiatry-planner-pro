// Tipos para o sistema de agendamento público

export type UserRole = 'professional' | 'client';

export interface BookingSettings {
  min_advance_hours: number;
  max_advance_days: number;
  auto_confirm: boolean;
  slot_duration_minutes: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string; // Motivo se não disponível
}

export interface PublicProfessionalInfo {
  id: string;
  full_name: string;
  clinic_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
  specialty?: string | null;
  booking_code: string;
  booking_enabled: boolean;
  booking_settings: BookingSettings | null;
  // Campos da aba Horários
  working_hours_start: string | null;
  working_hours_end: string | null;
  working_days: number[] | null; // 0 = Domingo, 1 = Segunda, etc
  appointment_duration: number | null;
}

export interface CreateClientAppointmentData {
  professional_id: string;
  client_name: string;
  client_phone: string;
  client_whatsapp?: string;
  client_email?: string;
  procedure_id: string | null;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}


