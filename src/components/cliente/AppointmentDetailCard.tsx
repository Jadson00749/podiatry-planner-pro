import { useState, useMemo } from 'react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Footprints, FileText, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { Appointment, AppointmentStatus, PaymentStatus, useUpdateAppointment } from '@/hooks/useAppointments';
import { Procedure } from '@/hooks/useProcedures';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppointmentDetailCardProps {
  appointment: Appointment;
  procedures: Procedure[];
  onUpdate: ReturnType<typeof useUpdateAppointment>;
}

export function AppointmentDetailCard({ appointment, procedures, onUpdate }: AppointmentDetailCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    notes: appointment.notes || '',
    procedure_id: appointment.procedure_id || '',
    price: appointment.price.toString(),
    payment_status: appointment.payment_status,
    status: appointment.status,
  });
  const { toast } = useToast();

  // Função para formatar valor como dinheiro brasileiro (para exibição no input)
  const formatCurrencyInput = (value: string): string => {
    if (!value || value === '0' || value === '') return '';
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // Função para extrair apenas números do input e converter para formato numérico
  const parseCurrencyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '0';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = Number(numbers) / 100;
    return amount.toFixed(2);
  };

  // Handler para mudança no campo de preço
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrencyInput(rawValue);
    setEditData({...editData, price: numericValue});
  };

  const appointmentDate = parseISO(appointment.appointment_date);
  const isOldAppointment = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(appointmentDate);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate < today && differenceInDays(today, aptDate) > 0;
  }, [appointmentDate]);

  const statusConfig = {
    scheduled: { label: 'Agendada', variant: 'default' as const, bg: 'bg-primary/10 text-primary' },
    completed: { label: 'Concluída', variant: 'default' as const, bg: 'bg-success/10 text-success' },
    cancelled: { label: 'Cancelada', variant: 'destructive' as const, bg: 'bg-destructive/10 text-destructive' },
    no_show: { label: 'Não compareceu', variant: 'secondary' as const, bg: 'bg-warning/10 text-warning' },
  };

  const paymentConfig = {
    pending: { label: 'Pendente', bg: 'bg-warning/10 text-warning' },
    paid: { label: 'Pago', bg: 'bg-success/10 text-success' },
    partial: { label: 'Parcial', bg: 'bg-primary/10 text-primary' },
  };

  const status = statusConfig[appointment.status];
  const payment = paymentConfig[appointment.payment_status];

  const handleEdit = () => {
    setEditData({
      notes: appointment.notes || '',
      procedure_id: appointment.procedure_id || '',
      price: appointment.price.toString(),
      payment_status: appointment.payment_status,
      status: appointment.status,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      notes: appointment.notes || '',
      procedure_id: appointment.procedure_id || '',
      price: appointment.price.toString(),
      payment_status: appointment.payment_status,
      status: appointment.status,
    });
  };

  const handleSave = async () => {
    try {
      await onUpdate.mutateAsync({
        id: appointment.id,
        notes: editData.notes || null,
        procedure_id: editData.procedure_id === '__none__' || !editData.procedure_id ? null : editData.procedure_id,
        price: parseFloat(editData.price) || 0,
        payment_status: editData.payment_status,
        ...(isOldAppointment && { status: editData.status }),
      });
      toast({ title: 'Consulta atualizada com sucesso!' });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar consulta' });
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-6 space-y-4">
      {/* Header com botão de editar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data e Horário */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{appointment.appointment_time.slice(0, 5)}</span>
        </div>

        {/* Status (somente leitura quando não é antiga) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <BadgeComponent className={cn('text-xs', status.bg)}>
            {status.label}
          </BadgeComponent>
        </div>
      </div>

      {/* Procedimento */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          <Footprints className="h-4 w-4" />
          Procedimento realizado
        </Label>
        {isEditing ? (
          <Select
            value={editData.procedure_id || '__none__'}
            onValueChange={(value) => setEditData({...editData, procedure_id: value === '__none__' ? '' : value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o procedimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhum procedimento</SelectItem>
              {procedures.map((proc) => (
                <SelectItem key={proc.id} value={proc.id}>
                  {proc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-foreground">
            {appointment.procedures?.name || 'Não informado'}
          </p>
        )}
      </div>

      {/* Observações da consulta */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          Observações da consulta
        </Label>
        {isEditing ? (
          <Textarea
            placeholder="Ex: Redução de inflamação, Orientado retorno em 30 dias..."
            value={editData.notes}
            onChange={e => setEditData({...editData, notes: e.target.value})}
            className="min-h-[100px]"
          />
        ) : (
          <p className="text-foreground whitespace-pre-wrap">
            {appointment.notes || 'Nenhuma observação registrada.'}
          </p>
        )}
      </div>

      {/* Financeiro */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Financeiro da consulta
        </Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor cobrado */}
          <div>
            <Label className="text-xs text-muted-foreground">Valor cobrado</Label>
            {isEditing ? (
              <Input
                type="text"
                value={formatCurrencyInput(editData.price)}
                onChange={handlePriceChange}
                className="mt-1"
                placeholder="R$ 0,00"
              />
            ) : (
              <p className="mt-1 text-foreground font-medium">
                R$ {Number(appointment.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Status do pagamento */}
          <div>
            <Label className="text-xs text-muted-foreground">Status do pagamento</Label>
            {isEditing ? (
              <Select
                value={editData.payment_status}
                onValueChange={(value: PaymentStatus) => setEditData({...editData, payment_status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1">
                <BadgeComponent className={cn('text-xs', payment.bg)}>
                  {payment.label}
                </BadgeComponent>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status da consulta (editável com cuidado) */}
      {isOldAppointment && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Status da consulta (correção)
          </Label>
          {isEditing ? (
            <Select
              value={editData.status}
              onValueChange={(value: AppointmentStatus) => {
                // Só permitir mudança entre Concluída e Cancelada
                if (value === 'completed' || value === 'cancelled') {
                  setEditData({...editData, status: value});
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <BadgeComponent className={cn('text-xs', status.bg)}>
              {status.label}
            </BadgeComponent>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Consulta antiga - permitida correção de status
          </p>
        </div>
      )}

      {/* Botões de ação */}
      {isEditing && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button onClick={handleSave} className="gradient-primary">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

