import { AppLayout } from '@/components/AppLayout';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
// Notificações push desativadas - não funcionam bem no mobile
// import { usePushNotifications } from '@/hooks/usePushNotifications';
// import { forceServiceWorkerUpdate } from '@/utils/forceUpdate';
import { logAppInfo } from '@/utils/debugVersion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Clock, Calendar as CalendarIcon, HelpCircle, Building2, Bell, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ } from '@/lib/cnpj';

export default function Configuracoes() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  // Notificações push desativadas
  // const { 
  //   isSupported: pushSupported, 
  //   permission: pushPermission, 
  //   requestPermission: requestPushPermission,
  //   testNotification
  // } = usePushNotifications();
  const [formData, setFormData] = useState({ 
    full_name: '', 
    clinic_name: '', 
    phone: '',
    clinic_email: '',
    clinic_address: '',
    clinic_cnpj: '',
    clinic_website: '',
    clinic_instagram: '',
    clinic_facebook: '',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    appointment_duration: 60,
    working_days: [1, 2, 3, 4, 5] as number[],
    notifications_enabled: true,
    email_notifications_enabled: false,
    reminder_hours_before: [24] as number[],
    email_template: ''
  });

  const weekDays = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
  ];

  // Usa ref para rastrear se já inicializou (não causa re-renders)
  const initializedRef = useRef(false);

  useEffect(() => {
    // Só inicializa uma vez quando o profile é carregado pela primeira vez
    // Usa apenas profile?.id como dependência para evitar loops
    if (profile?.id && !initializedRef.current) {
      setFormData({ 
        full_name: profile.full_name || '', 
        clinic_name: profile.clinic_name || '', 
        phone: formatPhone(profile.phone) || '',
        clinic_email: profile.clinic_email || '',
        clinic_address: profile.clinic_address || '',
        clinic_cnpj: formatCNPJ(profile.clinic_cnpj) || '',
        clinic_website: profile.clinic_website || '',
        clinic_instagram: profile.clinic_instagram || '',
        clinic_facebook: profile.clinic_facebook || '',
        working_hours_start: profile.working_hours_start || '08:00',
        working_hours_end: profile.working_hours_end || '18:00',
        appointment_duration: profile.appointment_duration || 60,
        working_days: profile.working_days || [1, 2, 3, 4, 5],
        notifications_enabled: profile.notifications_enabled ?? true,
        email_notifications_enabled: profile.email_notifications_enabled ?? false,
        reminder_hours_before: profile.reminder_hours_before || [24],
        email_template: profile.email_template || ''
      });
      initializedRef.current = true;
    }
  }, [profile?.id]); // Apenas profile?.id como dependência

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Remove máscaras antes de salvar (apenas números)
      const cleanPhone = formData.phone.replace(/\D/g, '') || null;
      const cleanCNPJ = formData.clinic_cnpj.replace(/\D/g, '') || null;
      
      await updateProfile.mutateAsync({
        ...formData,
        phone: cleanPhone || null,
        clinic_cnpj: cleanCNPJ || null,
        clinic_email: formData.clinic_email || null,
        clinic_address: formData.clinic_address || null,
        clinic_website: formData.clinic_website || null,
        clinic_instagram: formData.clinic_instagram || null,
        clinic_facebook: formData.clinic_facebook || null,
        notifications_enabled: formData.notifications_enabled,
        email_notifications_enabled: formData.email_notifications_enabled,
        reminder_hours_before: formData.reminder_hours_before,
        email_template: formData.email_template || null,
      });
      toast({ title: 'Perfil atualizado com sucesso!' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil' });
    }
  };

  const handleWorkingDayToggle = (day: number) => {
    const newWorkingDays = formData.working_days.includes(day)
      ? formData.working_days.filter(d => d !== day)
      : [...formData.working_days, day].sort();
    setFormData({ ...formData, working_days: newWorkingDays });
  };

  // Helper functions for time picker
  const parseTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':');
    return { hour: hour || '08', minute: minute || '00' };
  };

  const formatTime = (hour: string, minute: string) => {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  const handleTimeChange = (field: 'working_hours_start' | 'working_hours_end', hour: string, minute: string) => {
    setFormData({ ...formData, [field]: formatTime(hour, minute) });
  };

  const handlePhoneChange = (value: string) => {
    const masked = formatPhone(value);
    setFormData({ ...formData, phone: masked });
  };

  const handleCNPJChange = (value: string) => {
    const masked = formatCNPJ(value);
    setFormData({ ...formData, clinic_cnpj: masked });
  };

  // Ref para prevenir chamadas duplicadas
  const lastToggledRef = useRef<{ hours: number; timestamp: number } | null>(null);

  const handleReminderHoursToggle = useCallback((hours: number) => {
    const now = Date.now();
    
    // Previne chamadas duplicadas dentro de 200ms
    if (
      lastToggledRef.current &&
      lastToggledRef.current.hours === hours &&
      now - lastToggledRef.current.timestamp < 200
    ) {
      return;
    }
    
    lastToggledRef.current = { hours, timestamp: now };
    
    setFormData(prev => {
      const currentIncludes = prev.reminder_hours_before.includes(hours);
      const newHours = currentIncludes
        ? prev.reminder_hours_before.filter(h => h !== hours)
        : [...prev.reminder_hours_before, hours].sort((a, b) => b - a);
      
      // Só atualiza se realmente mudou
      if (JSON.stringify(newHours) === JSON.stringify(prev.reminder_hours_before)) {
        return prev;
      }
      
      return { ...prev, reminder_hours_before: newHours };
    });
  }, []);

  // Generate hours (0-23) and minutes (0-59, step 15)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'));

  const reminderHoursOptions = [
    { value: 24, label: '24 horas antes' },
    { value: 12, label: '12 horas antes' },
    { value: 2, label: '2 horas antes' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-6xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>

        {/* Perfil e Informações da Clínica lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                />
              </div>
              <div>
                <Label>Nome da clínica</Label>
                <Input 
                  value={formData.clinic_name} 
                  onChange={e => setFormData({...formData, clinic_name: e.target.value})} 
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input 
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone} 
                  onChange={e => handlePhoneChange(e.target.value)} 
                />
              </div>
              <Button type="submit" className="gradient-primary w-full">Salvar alterações</Button>
            </form>
          </div>

          <div className="rounded-xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informações da Clínica
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Email da clínica</Label>
                <Input 
                  type="email"
                  placeholder="contato@clinica.com.br"
                  value={formData.clinic_email} 
                  onChange={e => setFormData({...formData, clinic_email: e.target.value})} 
                />
              </div>
              <div>
                <Label>Endereço completo</Label>
                <Input 
                  placeholder="Rua, número, bairro, cidade - CEP"
                  value={formData.clinic_address} 
                  onChange={e => setFormData({...formData, clinic_address: e.target.value})} 
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input 
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.clinic_cnpj} 
                  onChange={e => handleCNPJChange(e.target.value)} 
                />
              </div>
              <div>
                <Label>Site</Label>
                <Input 
                  type="url"
                  placeholder="https://www.clinica.com.br"
                  value={formData.clinic_website} 
                  onChange={e => setFormData({...formData, clinic_website: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Instagram</Label>
                  <Input 
                    type="text"
                    placeholder="@clinica"
                    value={formData.clinic_instagram} 
                    onChange={e => setFormData({...formData, clinic_instagram: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input 
                    type="text"
                    placeholder="clinica.podologia"
                    value={formData.clinic_facebook} 
                    onChange={e => setFormData({...formData, clinic_facebook: e.target.value})} 
                  />
                </div>
              </div>
              <Button type="submit" className="gradient-primary w-full">Salvar alterações</Button>
            </form>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários de Funcionamento
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Horário de Início</Label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const { hour, minute } = parseTime(formData.working_hours_start);
                    return (
                      <>
                        <Select
                          value={hour}
                          onValueChange={(value) => handleTimeChange('working_hours_start', value, minute)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground font-semibold">:</span>
                        <Select
                          value={minute}
                          onValueChange={(value) => handleTimeChange('working_hours_start', hour, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div>
                <Label>Horário de Fim</Label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const { hour, minute } = parseTime(formData.working_hours_end);
                    return (
                      <>
                        <Select
                          value={hour}
                          onValueChange={(value) => handleTimeChange('working_hours_end', value, minute)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground font-semibold">:</span>
                        <Select
                          value={minute}
                          onValueChange={(value) => handleTimeChange('working_hours_end', hour, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div>
                <Label>Duração das agendas (min)</Label>
                <Input 
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={formData.appointment_duration} 
                  onChange={e => setFormData({...formData, appointment_duration: parseInt(e.target.value) || 60})}
                  className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Dias de Funcionamento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {weekDays.map((day) => (
                  <div 
                    key={day.value}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md border transition-colors",
                      formData.working_days.includes(day.value)
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.working_days.includes(day.value)}
                      onCheckedChange={() => handleWorkingDayToggle(day.value)}
                    />
                    <Label 
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {day.short}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.working_days.length === 0 && (
                <p className="text-xs text-destructive mt-2">
                  Selecione pelo menos um dia de funcionamento
                </p>
              )}
            </div>

            <Button type="submit" className="gradient-primary">Salvar alterações</Button>
          </form>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Notificações no Sistema */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-semibold cursor-pointer">Notificações no Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba avisos de agendamentos próximos no dashboard
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notifications_enabled: checked as boolean })
                  }
                />
              </div>

              {/* Email Automático */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-semibold cursor-pointer">Email Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Envie lembretes automáticos por email aos clientes
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={formData.email_notifications_enabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, email_notifications_enabled: checked as boolean })
                  }
                />
              </div>

              {/* Botão Manual WhatsApp */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-semibold">Botão Manual WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Botão para enviar lembretes manualmente via WhatsApp (sempre ativo)
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                  Ativo
                </div>
              </div>

              {/* Notificações Push no Celular - DESATIVADO */}
              {/* Funcionalidade desativada pois não funciona bem em dispositivos móveis */}
            </div>

            {/* Horas antes de enviar */}
            {formData.email_notifications_enabled && (
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-base font-semibold">Enviar lembretes</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione quantas horas antes do agendamento enviar o lembrete
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reminderHoursOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center space-x-2 p-3 rounded-md border transition-colors",
                        formData.reminder_hours_before.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        id={`reminder-${option.value}`}
                        checked={formData.reminder_hours_before.includes(option.value)}
                        onCheckedChange={() => {
                          handleReminderHoursToggle(option.value);
                        }}
                      />
                      <Label 
                        htmlFor={`reminder-${option.value}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.reminder_hours_before.length === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    Selecione pelo menos uma opção
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="gradient-primary w-full">Salvar alterações</Button>
          </form>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Aparência</h2>
          <div className="flex items-center justify-between">
            <div><p className="font-medium text-foreground">Tema</p><p className="text-sm text-muted-foreground">Alternar entre claro e escuro</p></div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
