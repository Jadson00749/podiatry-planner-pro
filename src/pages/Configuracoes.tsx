import { AppLayout } from '@/components/AppLayout';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Clock, Calendar as CalendarIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Configuracoes() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ 
    full_name: '', 
    clinic_name: '', 
    phone: '',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    appointment_duration: 60,
    working_days: [1, 2, 3, 4, 5] as number[]
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

  useEffect(() => {
    if (profile) {
      setFormData({ 
        full_name: profile.full_name || '', 
        clinic_name: profile.clinic_name || '', 
        phone: profile.phone || '',
        working_hours_start: profile.working_hours_start || '08:00',
        working_hours_end: profile.working_hours_end || '18:00',
        appointment_duration: profile.appointment_duration || 60,
        working_days: profile.working_days || [1, 2, 3, 4, 5]
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
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

  // Generate hours (0-23) and minutes (0-59, step 15)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>

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
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            <Button type="submit" className="gradient-primary">Salvar alterações</Button>
          </form>
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
