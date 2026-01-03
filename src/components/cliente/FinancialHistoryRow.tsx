import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Footprints, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Appointment, PaymentStatus } from '@/hooks/useAppointments';
import { cn } from '@/lib/utils';

interface FinancialHistoryRowProps {
  appointment: Appointment;
  onUpdatePaymentStatus: (status: PaymentStatus) => Promise<void>;
}

export function FinancialHistoryRow({ appointment, onUpdatePaymentStatus }: FinancialHistoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(appointment.payment_status);

  const paymentConfig = {
    pending: { label: 'Pendente', bg: 'bg-warning/10 text-warning border-warning/20' },
    paid: { label: 'Pago', bg: 'bg-success/10 text-success border-success/20' },
    partial: { label: 'Parcial', bg: 'bg-primary/10 text-primary border-primary/20' },
  };

  const payment = paymentConfig[appointment.payment_status];

  const handleSave = async () => {
    if (selectedStatus !== appointment.payment_status) {
      await onUpdatePaymentStatus(selectedStatus);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedStatus(appointment.payment_status);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Data da consulta */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {format(parseISO(appointment.appointment_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
              {appointment.appointment_time.slice(0, 5)}
            </p>
          </div>
        </div>

        {/* Procedimento */}
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-foreground">
            {appointment.procedures?.name || 'Não informado'}
          </p>
        </div>

        {/* Valor */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            R$ {Number(appointment.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Status do pagamento */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Select
              value={selectedStatus}
              onValueChange={(value: PaymentStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={cn('text-xs border', payment.bg)}>
              {payment.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Botão de editar */}
      <div className="ml-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleSave}>
                  <Save className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancelar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

