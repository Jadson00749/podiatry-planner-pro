import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, DollarSign, Clock, TrendingUp, AlertCircle, Download, FileSpreadsheet, FileType } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Calendar } from '@/components/ui/calendar';
import { AppointmentCard } from '@/components/dashboard/AppointmentCard';
import { useProfile } from '@/hooks/useProfile';
import { useAppointments, useTodayStats, useMonthStats, useUpdateAppointment } from '@/hooks/useAppointments';
import { useTheme } from '@/contexts/ThemeContext';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { getHolidaysForMonth } from '@/lib/holidays';
import { isHolidayDate, disablePastDates } from '@/lib/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { exportDashboard } from '@/utils/exportDashboard';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { usePlan } from '@/hooks/usePlan';
import { useUpdateProfile } from '@/hooks/useProfile';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayAppointments, isLoading: appointmentsLoading } = useAppointments(today);
  const { data: allAppointments } = useAppointments();
  const { data: todayStats } = useTodayStats();
  const { data: monthStats } = useMonthStats();
  const { data: clients } = useClients();
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  // Dados para gráfico de receitas (últimos 6 meses)
  const revenueChartData = useMemo(() => {
    if (!allAppointments) return [];

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(now),
    });

    return months.map((month) => {
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
      
      const monthAppointments = allAppointments.filter((apt) => {
        const aptDate = apt.appointment_date;
        return aptDate >= monthStart && aptDate <= monthEnd && apt.payment_status === 'paid';
      });

      const revenue = monthAppointments.reduce((sum, apt) => sum + Number(apt.price || 0), 0);

      return {
        mes: format(month, 'MMM/yyyy', { locale: ptBR }),
        receita: Number(revenue.toFixed(2)),
      };
    });
  }, [allAppointments]);

  const appointmentDates = todayAppointments?.map(a => a.appointment_date) || [];
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Calcular número de colunas baseado na quantidade de appointments
  const getGridCols = () => {
    const count = todayAppointments?.length || 0;
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'md:grid-cols-2';
    return 'md:grid-cols-2 xl:grid-cols-3';
  };


  // Obter feriados do mês atual
  const holidays = getHolidaysForMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      navigate(`/agenda?date=${format(date, 'yyyy-MM-dd')}`);
    }
  };

  const handleStatusChange = (id: string, status: 'completed' | 'cancelled' | 'scheduled' | 'no_show') => {
    updateAppointment.mutate({ id, status });
  };

  const handlePaymentChange = (id: string, payment_status: 'pending' | 'paid' | 'partial') => {
    updateAppointment.mutate({ id, payment_status });
  };

  const { canExport, exportCount, exportLimit, isTrial } = usePlan();
  const updateProfile = useUpdateProfile();

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
      exportDashboard({
        format,
        stats: {
          todayStats,
          monthStats,
          totalClients: clients?.length,
          profileName: profile?.full_name,
        },
      });

      // Incrementar contador de exportações (se não for trial e não for ilimitado)
      if (!isTrial && exportLimit !== -1) {
        await updateProfile.mutateAsync({
          export_count: (exportCount || 0) + 1,
        });
      }

      toast({
        title: 'Exportação realizada!',
        description: 'Relatório do dashboard exportado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar o dashboard.',
        variant: 'destructive',
      });
    }
  };

  // Verificar se todos os dados necessários carregaram
  const isDataLoading = profileLoading || appointmentsLoading;

  if (isDataLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Olá, {profile?.full_name?.split(' ')[0] || 'Profissional'}! 👋
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Onboarding Checklist - Só aparece após tudo carregar */}
        {!isDataLoading && <OnboardingChecklist />}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 cursor-pointer">
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
            <button
              onClick={() => navigate('/agenda')}
              className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              + Novo Agendamento
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Consultas Hoje"
            value={todayStats?.total || 0}
            icon={<CalendarIcon className="h-5 w-5" />}
            description={`${todayStats?.completed || 0} concluídas`}
            variant="primary"
          />
          <StatCard
            title="Total de Clientes"
            value={clients?.length || 0}
            icon={<Users className="h-5 w-5" />}
            description="Cadastrados"
            variant="default"
          />
          <StatCard
            title="Recebido Hoje"
            value={`R$ ${(todayStats?.totalReceived || 0).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Pendente Hoje"
            value={`R$ ${(todayStats?.totalPending || 0).toFixed(2)}`}
            icon={<AlertCircle className="h-5 w-5" />}
            description="Aguardando pagamento"
            variant="warning"
          />
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Consultas do Mês"
            value={monthStats?.total || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            description={`${monthStats?.cancelled || 0} canceladas`}
          />
          <StatCard
            title="Recebido no Mês"
            value={`R$ ${(monthStats?.totalReceived || 0).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Pendente no Mês"
            value={`R$ ${(monthStats?.totalPending || 0).toFixed(2)}`}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
        </div>

        {/* Gráfico de Receitas (últimos 6 meses) */}
        {revenueChartData.length > 0 && revenueChartData.some(d => d.receita > 0) && (
          <div className="rounded-xl bg-card border border-border p-3 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Receitas - Últimos 6 Meses</h2>
            <div className={cn("w-full", isMobile ? "h-[200px]" : "h-[300px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={revenueChartData} 
                  margin={isMobile 
                    ? { top: 5, right: 5, left: -15, bottom: 20 } 
                    : { top: 5, right: 10, left: 0, bottom: 5 }
                  }
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeOpacity={0.2}
                  />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => {
                      if (isMobile) {
                        // No mobile, mostrar valores mais compactos
                        if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
                        return `R$${value}`;
                      }
                      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: isMobile ? '6px' : '8px',
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                    formatter={(value: number) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      'Receita'
                    ]}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={isMobile ? 2 : 3}
                    dot={{ fill: 'hsl(var(--primary))', r: isMobile ? 3 : 5 }}
                    activeDot={{ r: isMobile ? 5 : 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full">
          {/* Today's Appointments */}
          <div className="flex-1 space-y-4 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              Consultas de Hoje
              {todayAppointments && todayAppointments.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({todayAppointments.length})
                </span>
              )}
            </h2>
            
            {appointmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : todayAppointments?.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma consulta hoje</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aproveite para organizar sua agenda!
                </p>
                <button
                  onClick={() => navigate('/agenda')}
                  className="text-sm text-primary hover:underline"
                >
                  Criar novo agendamento
                </button>
              </div>
            ) : (
              <>
              <div className={`grid grid-cols-1 ${getGridCols()} gap-4 auto-rows-fr`}>
                  {todayAppointments?.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="min-w-0 h-full flex">
                    <AppointmentCard
                      appointment={appointment}
                      onStatusChange={handleStatusChange}
                      onPaymentChange={handlePaymentChange}
                    />
                  </div>
                ))}
              </div>
                
                {todayAppointments && todayAppointments.length > 5 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                      ... e mais <span className="font-semibold text-foreground">{todayAppointments.length - 5}</span> agendamento{todayAppointments.length - 5 > 1 ? 's' : ''}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/agenda')}
                      className="w-full sm:w-auto"
                    >
                      Ver todos na Agenda →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Calendar */}
          <div className="flex flex-col w-full sm:w-fit flex-shrink-0 sm:ml-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">Calendário</h2>
            <div className="p-4 rounded-xl bg-card border border-border w-fit">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={ptBR}
                disabled={disablePastDates}
                modifiers={{
                  holiday: isHolidayDate,
                }}
                modifiersClassNames={{
                  holiday: 'border border-red-500 rounded-md',
                }}
                onMonthChange={setCurrentMonth}
              />
              
              {/* Feriados do mês */}
              {holidays.length > 0 && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
