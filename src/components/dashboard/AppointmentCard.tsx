import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, DollarSign, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/hooks/useAppointments';
import { generateWhatsAppLink, generateAppointmentReminderMessage } from '@/lib/whatsapp';
import { useProfile } from '@/hooks/useProfile';
import { ClientAvatar } from '@/components/ClientAvatar';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
  onPaymentChange?: (id: string, status: Appointment['payment_status']) => void;
  compact?: boolean;
}

export function AppointmentCard({
  appointment,
  onStatusChange,
  onPaymentChange,
  compact = false,
}: AppointmentCardProps) {
  const { data: profile } = useProfile();

  const statusConfig = {
    scheduled: { label: 'Agendado', variant: 'default' as const, bg: 'bg-primary/10 text-primary' },
    completed: { label: 'Concluído', variant: 'default' as const, bg: 'bg-success/10 text-success' },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const, bg: 'bg-destructive/10 text-destructive' },
    no_show: { label: 'Não compareceu', variant: 'secondary' as const, bg: 'bg-warning/10 text-warning' },
  };

  const paymentConfig = {
    pending: { label: 'Pendente', bg: 'bg-warning/10 text-warning' },
    paid: { label: 'Pago', bg: 'bg-success/10 text-success' },
    partial: { label: 'Parcial', bg: 'bg-primary/10 text-primary' },
  };

  const status = statusConfig[appointment.status];
  const payment = paymentConfig[appointment.payment_status];

  const handleWhatsAppReminder = () => {
    if (!appointment.clients?.whatsapp && !appointment.clients?.phone) return;
    
    const phone = appointment.clients.whatsapp || appointment.clients.phone || '';
    const message = generateAppointmentReminderMessage(
      appointment.clients.name,
      appointment.appointment_date,
      appointment.appointment_time,
      profile?.clinic_name || undefined
    );
    
    window.open(generateWhatsAppLink(phone, message), '_blank');
  };

  if (compact) {
    return (
      <div className="p-2.5 sm:p-3 rounded-lg bg-card border border-border hover:shadow-md transition-shadow w-full max-w-full overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <ClientAvatar 
              avatarUrl={appointment.clients?.avatar_url}
              name={appointment.clients?.name || 'Sem nome'}
              size="sm"
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-medium text-sm text-foreground truncate">
                {appointment.clients?.name || 'Sem nome'}
              </p>
              {appointment.procedures?.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {appointment.procedures.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge className={cn('text-xs px-1.5 py-0 whitespace-nowrap', status.bg)}>
              {status.label}
            </Badge>
            <Badge className={cn('text-xs px-1.5 py-0 whitespace-nowrap', payment.bg)}>
              {payment.label}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{appointment.appointment_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <DollarSign className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">R$ {Number(appointment.price).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {appointment.status === 'scheduled' && onStatusChange && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2 flex-shrink-0 text-success hover:text-success hover:bg-success/10"
                onClick={() => onStatusChange(appointment.id, 'completed')}
              >
                Concluir
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onStatusChange(appointment.id, 'cancelled')}
              >
                Cancelar
              </Button>
            </>
          )}
          
          {appointment.payment_status === 'pending' && appointment.status === 'completed' && onPaymentChange && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 flex-shrink-0 text-success hover:text-success hover:bg-success/10"
              onClick={() => onPaymentChange(appointment.id, 'paid')}
            >
              Pago
            </Button>
          )}

          {(appointment.clients?.whatsapp || appointment.clients?.phone) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsAppReminder}
              className="text-xs h-7 px-2 flex-shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 border-green-300 dark:border-green-700"
              title="Enviar mensagem via WhatsApp"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300 h-full flex flex-col w-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <ClientAvatar 
            avatarUrl={appointment.clients?.avatar_url}
            name={appointment.clients?.name || 'Sem nome'}
            size="md"
          />
          <div>
            <h4 className="font-semibold text-foreground">
              {appointment.clients?.name}
            </h4>
            {appointment.procedures?.name && (
              <p className="text-sm text-muted-foreground">
                {appointment.procedures.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={cn('text-xs', status.bg)}>
            {status.label}
          </Badge>
          <Badge className={cn('text-xs', payment.bg)}>
            {payment.label}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{appointment.appointment_time.slice(0, 5)}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>R$ {Number(appointment.price).toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
            {appointment.notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {appointment.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sem observações para este agendamento
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        {appointment.status === 'scheduled' && onStatusChange && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-success hover:text-success hover:bg-success/10"
              onClick={() => onStatusChange(appointment.id, 'completed')}
            >
              Concluir
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onStatusChange(appointment.id, 'cancelled')}
            >
              Cancelar
            </Button>
          </>
        )}
        
        {appointment.payment_status === 'pending' && appointment.status === 'completed' && onPaymentChange && (
          <Button
            size="sm"
            variant="outline"
            className="text-success hover:text-success hover:bg-success/10"
            onClick={() => onPaymentChange(appointment.id, 'paid')}
          >
            Marcar Pago
          </Button>
        )}

        {(appointment.clients?.whatsapp || appointment.clients?.phone) && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsAppReminder}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 border-green-300 dark:border-green-700"
            title="Enviar mensagem via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}



