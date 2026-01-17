import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { usePublicProfessional, usePublicProcedures, useAvailableTimeSlots, useCreatePublicAppointment, useIsDateBookable } from '@/hooks/usePublicBooking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, MessageSquare, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isHolidayDate } from '@/lib/calendar';
import { getHolidaysForMonth } from '@/lib/holidays';

export default function AgendamentoCliente() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'auth' | 'date' | 'time' | 'info' | 'confirm'>('date');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Buscar feriados do mês atual
  const holidays = getHolidaysForMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  // Ajustar step baseado no usuário
  useEffect(() => {
    if (!user) {
      setStep('auth');
    } else {
      setStep((currentStep) => currentStep === 'auth' ? 'date' : currentStep);
    }
  }, [user]);

  // Buscar dados do profissional
  const { data: professional, isLoading: loadingProfessional, error: professionalError } = usePublicProfessional(codigo || '');
  
  // Buscar procedimentos
  const { data: procedures } = usePublicProcedures(professional?.id || '');

  // Buscar horários disponíveis
  const { data: timeSlots, isLoading: loadingSlots } = useAvailableTimeSlots(
    professional?.id || '',
    selectedDate || new Date(),
    professional
  );

  // Mutation para criar agendamento
  const createAppointment = useCreatePublicAppointment();
  const queryClient = useQueryClient();

  // Verificar se a data pode ser agendada
  const isDateBookable = useIsDateBookable(professional);

  // Resetar seleção de horário quando muda a data
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

  // Forçar recarregar horários quando voltar para step de escolha de horário
  useEffect(() => {
    if (step === 'time' && professional?.id && selectedDate) {
      queryClient.invalidateQueries({
        queryKey: ['available-slots', professional.id, format(selectedDate, 'yyyy-MM-dd')],
      });
    }
  }, [step, professional?.id, selectedDate, queryClient]);

  // Auto-preencher dados se usuário estiver logado
  useEffect(() => {
    if (user && user.user_metadata) {
      setClientName(user.user_metadata.full_name || '');
      setClientEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !professional) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!clientName || !clientPhone) {
      toast({
        title: 'Erro',
        description: 'Nome e telefone são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAppointment.mutateAsync({
        professional_id: professional.id,
        client_name: clientName,
        client_phone: clientPhone,
        client_whatsapp: clientPhone,
        client_email: clientEmail,
        procedure_id: selectedProcedure || null,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        notes,
      });

      toast({
        title: 'Agendamento confirmado!',
        description: `Seu horário foi agendado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime}.`,
        duration: 5000,
      });

      // Forçar atualização dos horários disponíveis
      await queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      await queryClient.refetchQueries({ queryKey: ['available-slots'] });

      // Resetar form e voltar para seleção de data
      setSelectedDate(new Date());
      setSelectedTime('');
      setSelectedProcedure('');
      setNotes('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setStep('date');
      
      // Forçar scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Não foi possível criar o agendamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (loadingProfessional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (professionalError || !professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Link não encontrado
            </CardTitle>
            <CardDescription>
              O link de agendamento não existe ou foi desativado.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Auth needed (se não estiver logado)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Agendar com {professional.full_name}</CardTitle>
            <CardDescription>
              {professional.clinic_name && `${professional.clinic_name} • `}
              Faça login para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para agendar um horário, você precisa fazer login ou criar uma conta.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              onClick={() => {
                // Salvar URL de retorno antes de ir para login
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                navigate('/auth');
              }} 
              className="w-full"
            >
              Fazer Login / Criar Conta
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main booking flow
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com Logo */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {professional?.avatar_url ? (
              <img 
                src={professional.avatar_url} 
                alt={professional.clinic_name || professional.full_name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-lg">{professional?.clinic_name || professional?.full_name}</h1>
              <p className="text-sm text-muted-foreground">Sistema de Agendamento</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Agendar com {professional.full_name}</CardTitle>
            {professional.clinic_name && (
              <CardDescription className="text-base">{professional.clinic_name}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Steps */}
        {step !== 'auth' && (
        <div className="flex items-center justify-center gap-2">
          {['date', 'time', 'info', 'confirm'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : idx < ['date', 'time', 'info', 'confirm'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {idx < ['date', 'time', 'info', 'confirm'].indexOf(step) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && <div className="w-12 h-0.5 bg-border mx-1" />}
            </div>
          ))}
        </div>
        )}

        {/* Step: Select Date */}
        {step === 'date' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Escolha a Data
              </CardTitle>
              <CardDescription>Selecione o dia que deseja agendar</CardDescription>
            </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    onMonthChange={setCurrentMonth}
                    disabled={(date) => !isDateBookable(date)}
                    locale={ptBR}
                    className="rounded-md border w-fit"
                    modifiers={{
                      holiday: isHolidayDate,
                    }}
                    modifiersClassNames={{
                      holiday: '!border-2 !border-red-500 rounded-md bg-red-50/50',
                    }}
                  />
                  {holidays.length > 0 && (
                    <div className="mt-4 pt-3 border-t w-full max-w-md">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Feriados do mês:</p>
                      <div className="space-y-1">
                        {holidays.map((h) => (
                          <div key={h.date} className="text-xs text-destructive flex items-center gap-2">
                            <span>• {format(new Date(h.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
                            <span>- {h.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            <CardFooter>
              <Button
                onClick={() => setStep('time')}
                disabled={!selectedDate}
                className="w-full"
              >
                Próximo: Escolher Horário
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Select Time */}
        {step === 'time' && selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Escolha o Horário
              </CardTitle>
              <CardDescription>
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-full overflow-y-auto">
              {loadingSlots ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : timeSlots && timeSlots.length > 0 ? (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? 'default' : 'outline'}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "w-full h-9 text-sm relative transition-all",
                          !slot.available && "bg-red-50 border-red-200 text-red-400 hover:bg-red-50 cursor-not-allowed"
                        )}
                        title={!slot.available ? slot.reason : undefined}
                      >
                        {slot.available ? (
                          slot.time
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>{slot.time}</span>
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-border rounded bg-white"></div>
                      <span className="text-muted-foreground">Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-200 rounded bg-red-50 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-muted-foreground">Ocupado</span>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não há horários disponíveis para esta data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={() => setStep('date')} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={() => setStep('info')}
                disabled={!selectedTime}
                className="flex-1"
              >
                Próximo: Informações
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Client Info */}
        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Suas Informações
              </CardTitle>
              <CardDescription>Preencha seus dados para o agendamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Procedimento */}
              {procedures && procedures.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="procedure">Procedimento (opcional)</Label>
                  <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
                    <SelectTrigger id="procedure">
                      <SelectValue placeholder="Selecione um procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((proc) => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.name} - R$ {proc.default_price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                <Input
                  id="phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma informação adicional?"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={() => setStep('time')} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!clientName || !clientPhone}
                className="flex-1"
              >
                Próximo: Confirmar
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Confirmar Agendamento
              </CardTitle>
              <CardDescription>Revise as informações antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium">{professional.full_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                {selectedProcedure && procedures && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Procedimento:</span>
                    <span className="font-medium">
                      {procedures.find((p) => p.id === selectedProcedure)?.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{clientPhone}</span>
                </div>
              </div>

              {/* Futuro: Integração com WhatsApp API
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você receberá uma confirmação no WhatsApp após o agendamento.
                </AlertDescription>
              </Alert>
              */}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Seu agendamento será registrado com sucesso! Guarde as informações para referência futura.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={() => setStep('info')} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createAppointment.isPending}
                className="flex-1"
              >
                {createAppointment.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} | JL Santos Suporte e Consultoria em Sistema de Informação LTDA
          </p>
        </div>
      </footer>
    </div>
  );
}

