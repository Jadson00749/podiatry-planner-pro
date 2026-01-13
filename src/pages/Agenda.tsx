import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval, isSameMonth, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, X, Download, FileSpreadsheet, FileType, List, Grid3x3, LayoutGrid } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { AppointmentCard } from '@/components/dashboard/AppointmentCard';
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments';
import { isHoliday, getHolidaysForMonth } from '@/lib/holidays';
import { isHolidayDate } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewAppointmentForm } from '@/components/agenda/NewAppointmentForm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportAppointments } from '@/utils/exportAppointments';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlan } from '@/hooks/usePlan';
import { useUpdateProfile } from '@/hooks/useProfile';

type ViewMode = 'day' | 'week' | 'month';
type StatusFilter = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
type PaymentFilter = 'pending' | 'paid' | 'partial';
type CardLayout = 'list' | 'grid-2' | 'grid-3';

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { canExport, exportCount, exportLimit, isTrial } = usePlan();
  const updateProfile = useUpdateProfile();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(dateParam ? parseISO(dateParam) : new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [cardLayout, setCardLayout] = useState<CardLayout>(() => {
    // Carregar preferência salva ou usar 'list' como padrão
    const saved = localStorage.getItem('agenda_card_layout');
    return (saved as CardLayout) || 'list';
  });
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);
  const isMobile = useIsMobile();

  // Salvar preferência de layout
  useEffect(() => {
    localStorage.setItem('agenda_card_layout', cardLayout);
  }, [cardLayout]);

  // Atualizar currentMonth quando selectedDate mudar
  useEffect(() => {
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  // Quando o calendário abrir, garantir que mostra o mês da data selecionada
  useEffect(() => {
    if (isCalendarOpen) {
      setCurrentMonth(selectedDate);
    }
  }, [isCalendarOpen, selectedDate]);
  
  // Filtros de status
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilter[]>([]);

  const { data: appointments, isLoading } = useAppointments();
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSearchParams({ date: format(date, 'yyyy-MM-dd') });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    if (viewMode === 'month') {
      // Navegar mês a mês
      newDate = direction === 'next' 
        ? addMonths(selectedDate, 1)
        : addMonths(selectedDate, -1);
    } else if (viewMode === 'week') {
      // Navegar semana a semana
      newDate = direction === 'next' 
        ? addDays(selectedDate, 7)
        : addDays(selectedDate, -7);
    } else {
      // Navegar dia a dia
      newDate = direction === 'next' 
        ? addDays(selectedDate, 1)
        : addDays(selectedDate, -1);
    }
    
    handleDateChange(newDate);
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    // Começar da semana que contém o primeiro dia do mês
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    // Terminar na semana que contém o último dia do mês
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    
    let filtered = appointments;
    
    // Filtro por data (dia, semana ou mês)
    if (viewMode === 'day') {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(a => a.appointment_date === dateStr);
    } else if (viewMode === 'week') {
      const dates = weekDays.map(d => format(d, 'yyyy-MM-dd'));
      filtered = filtered.filter(a => dates.includes(a.appointment_date));
    } else if (viewMode === 'month') {
      // Filtrar por mês: pegar primeiro e último dia do mês selecionado
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      filtered = filtered.filter(a => {
        const appointmentDate = parseISO(a.appointment_date);
        return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      });
    }
    
    // Filtro por status
    if (statusFilters.length > 0) {
      filtered = filtered.filter(a => statusFilters.includes(a.status as StatusFilter));
    }
    
    // Filtro por payment_status
    if (paymentFilters.length > 0) {
      filtered = filtered.filter(a => paymentFilters.includes(a.payment_status as PaymentFilter));
    }
    
    return filtered;
  }, [appointments, selectedDate, viewMode, weekDays, statusFilters, paymentFilters]);

  // Verificar se a data selecionada é passada (apenas o dia, não a hora)
  const isPastDate = isPast(startOfDay(selectedDate)) && !isSameDay(selectedDate, new Date());

  const handleStatusChange = (id: string, status: 'completed' | 'cancelled' | 'scheduled' | 'no_show') => {
    updateAppointment.mutate({ id, status });
  };

  const handlePaymentChange = (id: string, payment_status: 'pending' | 'paid' | 'partial') => {
    updateAppointment.mutate({ id, payment_status });
  };

  // Handlers para filtros
  const handleStatusFilterChange = (status: StatusFilter, checked: boolean) => {
    if (checked) {
      setStatusFilters([...statusFilters, status]);
    } else {
      setStatusFilters(statusFilters.filter(s => s !== status));
    }
  };

  const handlePaymentFilterChange = (payment: PaymentFilter, checked: boolean) => {
    if (checked) {
      setPaymentFilters([...paymentFilters, payment]);
    } else {
      setPaymentFilters(paymentFilters.filter(p => p !== payment));
    }
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setPaymentFilters([]);
  };

  const hasActiveFilters = statusFilters.length > 0 || paymentFilters.length > 0;

  const handleExport = async (format: 'excel' | 'pdf') => {
    // Verificar se pode exportar
    if (!canExport()) {
      toast({
        title: 'Limite de exportações atingido',
        description: `Você usou ${exportCount}/${exportLimit === -1 ? '∞' : exportLimit} exportações. Faça upgrade para exportações ilimitadas.`,
        variant: 'destructive',
        action: (
          <Button size="sm" onClick={() => navigate('/planos')}>
            Ver Planos
          </Button>
        ),
      });
      return;
    }

    try {
      if (!appointments || appointments.length === 0) {
        toast({
          title: 'Nenhum agendamento',
          description: 'Não há agendamentos para exportar.',
          variant: 'destructive',
        });
        return;
      }

      const appointmentsToExport = filteredAppointments.length > 0 ? filteredAppointments : appointments;
      
      if (appointmentsToExport.length === 0) {
        toast({
          title: 'Nenhum agendamento',
          description: 'Não há agendamentos para exportar com os filtros aplicados.',
          variant: 'destructive',
        });
        return;
      }

      // Determinar período baseado nos agendamentos filtrados
      const dates = appointmentsToExport.map(apt => apt.appointment_date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      exportAppointments(appointmentsToExport, { 
        format,
        startDate,
        endDate,
      });

      // Incrementar contador de exportações (se não for trial e não for ilimitado)
      if (!isTrial && exportLimit !== -1) {
        await updateProfile.mutateAsync({
          export_count: (exportCount || 0) + 1,
        });
      }

      toast({
        title: 'Exportação realizada!',
        description: `${appointmentsToExport.length} agendamento(s) exportado(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar os agendamentos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie seus agendamentos
            </p>
          </div>
          
          <div className="flex gap-2">
            {appointments && appointments.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleExport('excel')}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar como Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('pdf')}
                    className="cursor-pointer"
                  >
                    <FileType className="h-4 w-4 mr-2 text-red-600" />
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button 
                  className={cn("gradient-primary", isPastDate && "cursor-not-allowed disabled:cursor-not-allowed")}
                  disabled={isPastDate}
                  title={isPastDate ? "Não é possível criar agendamentos em datas passadas" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <NewAppointmentForm 
                  defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                  onSuccess={() => setIsNewAppointmentOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "text-center h-auto py-2 px-3 sm:px-4 font-semibold hover:bg-accent text-xs sm:text-sm w-full sm:w-auto sm:min-w-[220px]"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="font-semibold text-foreground capitalize truncate">
                        {viewMode === 'day' && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        {viewMode === 'week' && `Semana de ${format(weekDays[0], 'd MMM', { locale: ptBR })} - ${format(weekDays[6], 'd MMM', { locale: ptBR })}`}
                        {viewMode === 'month' && format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      month={currentMonth}
                      onSelect={(date) => {
                        if (date) {
                          handleDateChange(date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      locale={ptBR}
                      modifiers={{
                        holiday: isHolidayDate,
                      }}
                      modifiersClassNames={{
                        holiday: 'border border-red-500 rounded-md',
                      }}
                      onMonthChange={setCurrentMonth}
                    />
                    
                    {/* Feriados do mês */}
                    {(() => {
                      const holidays = getHolidaysForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
                      return holidays.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Feriados do mês:</p>
                          <div className="space-y-1">
                            {holidays.map((h) => (
                              <div key={h.date} className="flex items-center gap-2 text-xs">
                                <span className="text-destructive font-medium">
                                  {format(new Date(h.date + 'T00:00:00'), 'd')}
                                </span>
                                <span className="text-muted-foreground">{h.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-background text-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {mode === 'day' && 'Dia'}
                  {mode === 'week' && 'Semana'}
                  {mode === 'month' && 'Mês'}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Toggle (apenas desktop) e Filter */}
          <div className="flex items-center gap-2">
            {/* Layout Toggle - apenas desktop e quando há agendamentos */}
            {!isMobile && filteredAppointments.length > 0 && viewMode === 'day' && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                <Button
                  variant={cardLayout === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCardLayout('list')}
                  className={cn(
                    "h-8 px-3",
                    cardLayout === 'list' && "bg-background shadow-sm"
                  )}
                  title="Visualização em lista (1 por linha)"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={cardLayout === 'grid-2' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCardLayout('grid-2')}
                  className={cn(
                    "h-8 px-3",
                    cardLayout === 'grid-2' && "bg-background shadow-sm"
                  )}
                  title="Visualização em grade (2 por linha)"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={cardLayout === 'grid-3' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCardLayout('grid-3')}
                  className={cn(
                    "h-8 px-3",
                    cardLayout === 'grid-3' && "bg-background shadow-sm"
                  )}
                  title="Visualização em grade (3 por linha)"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "gap-2",
                    hasActiveFilters && "border-primary bg-primary/5"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filtrar
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      {statusFilters.length + paymentFilters.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filtros</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>

                  {/* Status Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status-scheduled"
                          checked={statusFilters.includes('scheduled')}
                          onCheckedChange={(checked) => handleStatusFilterChange('scheduled', checked as boolean)}
                        />
                        <Label
                          htmlFor="status-scheduled"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Agendado
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status-completed"
                          checked={statusFilters.includes('completed')}
                          onCheckedChange={(checked) => handleStatusFilterChange('completed', checked as boolean)}
                        />
                        <Label
                          htmlFor="status-completed"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Concluído
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status-cancelled"
                          checked={statusFilters.includes('cancelled')}
                          onCheckedChange={(checked) => handleStatusFilterChange('cancelled', checked as boolean)}
                        />
                        <Label
                          htmlFor="status-cancelled"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Cancelado
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status-no_show"
                          checked={statusFilters.includes('no_show')}
                          onCheckedChange={(checked) => handleStatusFilterChange('no_show', checked as boolean)}
                        />
                        <Label
                          htmlFor="status-no_show"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Não compareceu
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Payment Filters */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Pagamento</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="payment-pending"
                          checked={paymentFilters.includes('pending')}
                          onCheckedChange={(checked) => handlePaymentFilterChange('pending', checked as boolean)}
                        />
                        <Label
                          htmlFor="payment-pending"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Pendente
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="payment-paid"
                          checked={paymentFilters.includes('paid')}
                          onCheckedChange={(checked) => handlePaymentFilterChange('paid', checked as boolean)}
                        />
                        <Label
                          htmlFor="payment-paid"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Pago
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="payment-partial"
                          checked={paymentFilters.includes('partial')}
                          onCheckedChange={(checked) => handlePaymentFilterChange('partial', checked as boolean)}
                        />
                        <Label
                          htmlFor="payment-partial"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Parcial
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'day' && (
          <>
            {filteredAppointments.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">Nenhum agendamento</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isPastDate ? "Não houve consultas marcadas para este dia" : "Não há consultas marcadas para este dia"}
                </p>
                {!isPastDate && (
                  <Button onClick={() => setIsNewAppointmentOpen(true)}>
                    Criar agendamento
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn(
                // Lista (padrão)
                cardLayout === 'list' && !isMobile && "space-y-2",
                // Grid 2 colunas (apenas desktop)
                cardLayout === 'grid-2' && !isMobile && "grid grid-cols-1 lg:grid-cols-2 gap-4",
                // Grid 3 colunas (apenas desktop)
                cardLayout === 'grid-3' && !isMobile && "grid grid-cols-1 lg:grid-cols-3 gap-4",
                // Mobile: lista compacta com menos espaçamento e overflow controlado
                isMobile && "space-y-1.5 w-full overflow-x-hidden"
              )}>
                {filteredAppointments
                  .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                  .map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onStatusChange={handleStatusChange}
                      onPaymentChange={handlePaymentChange}
                      compact={isMobile} // Mobile usa modo compacto
                    />
                  ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'week' && (
          <div className={cn(
            "grid grid-cols-7",
            isMobile ? "gap-0.5 auto-rows-[110px]" : "gap-2 auto-rows-[208px]"
          )}>
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointments?.filter(a => a.appointment_date === dateStr) || [];
              const dayHoliday = isHoliday(dateStr);
              const isToday = isSameDay(day, new Date());
              const isPastDay = isPast(startOfDay(day)) && !isToday;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'border h-full transition-colors flex flex-col cursor-pointer',
                    isMobile ? 'rounded-lg p-1' : 'rounded-xl p-3',
                    isToday ? 'border-primary bg-primary/5' : 'border-border bg-card',
                    isPastDay && 'opacity-60',
                    'hover:border-primary/50'
                  )}
                  onClick={() => {
                    handleDateChange(day);
                    setViewMode('day');
                  }}
                >
                  <div className={cn("text-center flex-shrink-0", isMobile ? "mb-0.5" : "mb-2")}>
                    <p className={cn(
                      "text-muted-foreground capitalize",
                      isMobile ? "text-[9px]" : "text-xs"
                    )}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn(
                      'font-semibold',
                      isMobile ? 'text-xs' : 'text-lg',
                      isToday ? 'text-primary' : 'text-foreground',
                      dayHoliday && 'text-destructive'
                    )}>
                      {format(day, 'd')}
                    </p>
                    {dayHoliday && (
                      <p className={cn("text-destructive truncate", isMobile ? "text-[8px]" : "text-xs")}>
                        {dayHoliday.name}
                      </p>
                    )}
                  </div>
                  
                  <div className={cn("flex-1 overflow-y-auto", isMobile ? "space-y-0.5" : "space-y-1")}>
                    {dayAppointments.slice(0, isMobile ? 2 : 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={cn(
                          "rounded bg-primary/10",
                          isMobile ? "p-0.5 text-[8px]" : "p-2 text-xs"
                        )}
                      >
                        <p className="font-medium text-foreground truncate">
                          {isMobile 
                            ? `${apt.appointment_time.slice(0, 5)} ${apt.clients?.name?.split(' ')[0] || ''}`
                            : `${apt.appointment_time.slice(0, 5)} - ${apt.clients?.name}`
                          }
                        </p>
                      </div>
                    ))}
                    {dayAppointments.length > (isMobile ? 2 : 3) && (
                      <p className={cn("text-muted-foreground text-center", isMobile ? "text-[8px]" : "text-xs")}>
                        +{dayAppointments.length - (isMobile ? 2 : 3)} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'month' && (
          <>
            {/* Cabeçalho dos dias da semana */}
            <div className={cn(
              "grid grid-cols-7 mb-2",
              isMobile ? "gap-1" : "gap-2"
            )}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
                <div key={dayName} className={cn(
                  "text-center font-semibold text-muted-foreground",
                  isMobile ? "text-[10px] py-1" : "text-sm py-2"
                )}>
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid do calendário mensal */}
            <div className={cn(
              "grid grid-cols-7",
              isMobile ? "gap-1 auto-rows-[100px]" : "gap-2 auto-rows-[208px]"
            )}>
              {monthDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayAppointments = filteredAppointments.filter(a => a.appointment_date === dateStr);
                const dayHoliday = isHoliday(dateStr);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const isPastDay = isPast(startOfDay(day)) && !isToday;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'rounded-xl border h-full transition-colors flex flex-col cursor-pointer',
                      isMobile ? 'p-1' : 'p-3',
                      isToday ? 'border-primary bg-primary/5' : 'border-border bg-card',
                      !isCurrentMonth && 'opacity-40',
                      isPastDay && 'opacity-60',
                      'hover:border-primary/50'
                    )}
                    onClick={() => {
                      handleDateChange(day);
                      setViewMode('day');
                    }}
                  >
                    <div className={cn("text-center flex-shrink-0", isMobile ? "mb-0.5" : "mb-2")}>
                      <p className={cn(
                        'mb-0.5 capitalize',
                        isMobile ? 'text-[9px]' : 'text-xs mb-1',
                        isCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      )}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={cn(
                        'font-semibold',
                        isMobile ? 'text-xs' : 'text-lg',
                        isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                        dayHoliday && 'text-destructive'
                      )}>
                        {format(day, 'd')}
                      </p>
                      {dayHoliday && (
                        <p className={cn("text-destructive truncate", isMobile ? "text-[8px]" : "text-xs")}>
                          {dayHoliday.name}
                        </p>
                      )}
                    </div>
                    
                    <div className={cn("flex-1 overflow-y-auto", isMobile ? "space-y-0.5" : "space-y-1")}>
                      {dayAppointments.slice(0, isMobile ? 1 : 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "rounded bg-primary/10",
                            isMobile ? "p-0.5 text-[8px]" : "p-2 text-xs"
                          )}
                        >
                          <p className="font-medium text-foreground truncate">
                            {isMobile 
                              ? `${apt.appointment_time.slice(0, 5)} ${apt.clients?.name?.split(' ')[0] || ''}`
                              : `${apt.appointment_time.slice(0, 5)} - ${apt.clients?.name}`
                            }
                          </p>
                        </div>
                      ))}
                      {dayAppointments.length > (isMobile ? 1 : 3) && (
                        <p className={cn("text-muted-foreground text-center", isMobile ? "text-[8px]" : "text-xs")}>
                          +{dayAppointments.length - (isMobile ? 1 : 3)} mais
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
