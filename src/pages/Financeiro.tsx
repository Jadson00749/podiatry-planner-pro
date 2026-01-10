import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, differenceInDays, subDays, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Clock, CheckCircle, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, Download, FileSpreadsheet, FileType } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppointments, useMonthStats, usePeriodStats, useUpdateAppointment } from '@/hooks/useAppointments';
import { useProcedures } from '@/hooks/useProcedures';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportFinancial } from '@/utils/exportFinancial';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

type PeriodOption = 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'last-year' | 'custom';

export default function Financeiro() {
  const { data: appointments } = useAppointments();
  const { data: procedures } = useProcedures();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const currentDate = new Date();
  const [periodOption, setPeriodOption] = useState<PeriodOption>('current-month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  const updateAppointment = useUpdateAppointment();

  // Calcular datas do período selecionado
  const periodDates = useMemo(() => {
    let start: Date;
    let end: Date = currentDate;

    switch (periodOption) {
      case 'current-month':
        start = startOfMonth(currentDate);
        end = currentDate;
        break;
      case 'last-month':
        const lastMonth = subMonths(currentDate, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'last-3-months':
        start = startOfMonth(subMonths(currentDate, 2));
        end = currentDate;
        break;
      case 'last-6-months':
        start = startOfMonth(subMonths(currentDate, 5));
        end = currentDate;
        break;
      case 'current-year':
        start = startOfYear(currentDate);
        end = currentDate;
        break;
      case 'last-year':
        const lastYear = subYears(currentDate, 1);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = customStartDate;
          end = customEndDate;
        } else {
          // Se não tiver datas customizadas, usar mês atual
          start = startOfMonth(currentDate);
          end = currentDate;
        }
        break;
      default:
        start = startOfMonth(currentDate);
        end = currentDate;
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      startDate: start,
      endDate: end,
    };
  }, [periodOption, customStartDate, customEndDate, currentDate]);

  // Calcular período anterior equivalente
  const previousPeriodDates = useMemo(() => {
    const { startDate, endDate } = periodDates;
    const daysDiff = differenceInDays(endDate, startDate);
    const previousEnd = subDays(startDate, 1);
    const previousStart = subDays(previousEnd, daysDiff);

    return {
      start: format(previousStart, 'yyyy-MM-dd'),
      end: format(previousEnd, 'yyyy-MM-dd'),
    };
  }, [periodDates]);

  // Buscar dados do período atual e anterior
  const shouldUsePeriod = periodOption === 'custom' ? (customStartDate && customEndDate) : true;
  const { data: periodStats } = usePeriodStats(periodDates.start, periodDates.end);
  const { data: previousPeriodStats } = usePeriodStats(previousPeriodDates.start, previousPeriodDates.end);
  
  // Fallback para mês atual se não houver dados do período customizado
  const { data: monthStats } = useMonthStats(currentDate.getMonth(), currentDate.getFullYear());
  const previousMonth = subMonths(currentDate, 1);
  const { data: previousMonthStats } = useMonthStats(previousMonth.getMonth(), previousMonth.getFullYear());
  
  // Usar dados do período ou fallback para mês
  const currentStats = (shouldUsePeriod && periodStats) ? periodStats : monthStats;
  const previousStats = (shouldUsePeriod && previousPeriodStats) ? previousPeriodStats : previousMonthStats;

  const pendingAppointments = appointments?.filter(a => a.payment_status === 'pending' && a.status === 'completed') || [];
  
  const handleMarkAsPaid = (id: string) => {
    updateAppointment.mutate({ id, payment_status: 'paid' });
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    try {
      if (!appointments || appointments.length === 0) {
        toast({
          title: 'Nenhum agendamento',
          description: 'Não há agendamentos para exportar.',
          variant: 'destructive',
        });
        return;
      }

      exportFinancial(appointments, { 
        format,
        startDate: periodDates.start,
        endDate: periodDates.end,
      });

      toast({
        title: 'Exportação realizada!',
        description: 'Relatório financeiro exportado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar relatório financeiro:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar o relatório financeiro.',
        variant: 'destructive',
      });
    }
  };

  // Cálculos de comparação
  const comparisons = useMemo(() => {
    if (!currentStats || !previousStats) {
      return {
        revenueChange: 0,
        revenueChangePercent: 0,
        appointmentsChange: 0,
        appointmentsChangePercent: 0,
        averageValue: 0,
        previousAverageValue: 0,
        averageChange: 0,
        averageChangePercent: 0,
      };
    }

    const revenueChange = currentStats.totalReceived - previousStats.totalReceived;
    const revenueChangePercent = previousStats.totalReceived > 0
      ? (revenueChange / previousStats.totalReceived) * 100
      : 0;

    const appointmentsChange = currentStats.total - previousStats.total;
    const appointmentsChangePercent = previousStats.total > 0
      ? (appointmentsChange / previousStats.total) * 100
      : 0;

    const averageValue = currentStats.total > 0
      ? currentStats.totalReceived / currentStats.total
      : 0;
    
    const previousAverageValue = previousStats.total > 0
      ? previousStats.totalReceived / previousStats.total
      : 0;

    const averageChange = averageValue - previousAverageValue;
    const averageChangePercent = previousAverageValue > 0
      ? (averageChange / previousAverageValue) * 100
      : 0;

    return {
      revenueChange,
      revenueChangePercent,
      appointmentsChange,
      appointmentsChangePercent,
      averageValue,
      previousAverageValue,
      averageChange,
      averageChangePercent,
    };
  }, [currentStats, previousStats]);

  // Formatar label do período
  const periodLabel = useMemo(() => {
    switch (periodOption) {
      case 'current-month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'last-month':
        return format(subMonths(currentDate, 1), 'MMMM yyyy', { locale: ptBR });
      case 'last-3-months':
        return `Últimos 3 meses (${format(subMonths(currentDate, 2), 'MMM', { locale: ptBR })} - ${format(currentDate, 'MMM yyyy', { locale: ptBR })})`;
      case 'last-6-months':
        return `Últimos 6 meses (${format(subMonths(currentDate, 5), 'MMM', { locale: ptBR })} - ${format(currentDate, 'MMM yyyy', { locale: ptBR })})`;
      case 'current-year':
        return format(currentDate, 'yyyy', { locale: ptBR });
      case 'last-year':
        return format(subYears(currentDate, 1), 'yyyy', { locale: ptBR });
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
        }
        return 'Período customizado';
      default:
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  }, [periodOption, customStartDate, customEndDate, currentDate]);

  // Dados para o gráfico (agrupado por mês e procedimento)
  const chartData = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const { startDate, endDate } = periodDates;
    
    try {
      // Criar array de meses no período
      const months = eachMonthOfInterval({
        start: startOfMonth(startDate),
        end: endOfMonth(endDate),
      });

      // Agrupar appointments por mês e procedimento
      const data = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthStartStr = format(monthStart, 'yyyy-MM-dd');
        const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

        // Filtrar appointments do mês (apenas pagos)
        const monthAppointments = appointments.filter((apt) => {
          if (!apt.appointment_date) return false;
          const aptDate = apt.appointment_date;
          return aptDate >= monthStartStr && aptDate <= monthEndStr && apt.payment_status === 'paid';
        });

        // Objeto para armazenar faturamento por procedimento
        const faturamentoPorProcedimento: Record<string, number> = {};
        let faturamentoSemProcedimento = 0;

        // Calcular faturamento por procedimento
        monthAppointments.forEach((apt) => {
          const price = Number(apt.price) || 0;
          const procedureId = apt.procedure_id;
          
          if (procedureId) {
            const procedureName = apt.procedures?.name || `Procedimento ${procedureId}`;
            faturamentoPorProcedimento[procedureName] = (faturamentoPorProcedimento[procedureName] || 0) + price;
          } else {
            faturamentoSemProcedimento += price;
          }
        });

        // Criar objeto com dados do mês
        const monthData: Record<string, any> = {
          mes: format(month, 'MMM', { locale: ptBR }),
          mesCompleto: format(month, 'MMMM yyyy', { locale: ptBR }),
        };

        // Adicionar faturamento por procedimento
        Object.keys(faturamentoPorProcedimento).forEach((procedureName) => {
          monthData[procedureName] = Math.round(faturamentoPorProcedimento[procedureName] * 100) / 100;
        });

        // Adicionar faturamento sem procedimento
        if (faturamentoSemProcedimento > 0) {
          monthData['Sem procedimento'] = Math.round(faturamentoSemProcedimento * 100) / 100;
        }

        // Calcular total do mês (sempre incluir, mesmo se for 0)
        const totalMes = Object.values(faturamentoPorProcedimento).reduce((sum, val) => sum + val, 0) + faturamentoSemProcedimento;
        monthData['total'] = Math.round(totalMes * 100) / 100;

        return monthData;
      });

      return data;
    } catch (error) {
      console.error('Erro ao processar dados do gráfico:', error);
      return [];
    }
  }, [appointments, periodDates]);

  // Obter todos os procedimentos únicos que aparecem nos dados
  const uniqueProcedures = useMemo(() => {
    const proceduresSet = new Set<string>();
    chartData.forEach((month) => {
      Object.keys(month).forEach((key) => {
        if (key !== 'mes' && key !== 'mesCompleto' && key !== 'total') {
          proceduresSet.add(key);
        }
      });
    });
    return Array.from(proceduresSet);
  }, [chartData]);

  // Cores para os procedimentos (paleta cinza e azul)
  // Paleta de cores harmoniosa baseada no tema do app
  const procedureColors = [
    'hsl(var(--primary))',           // Cor primária do app (teal)
    'hsl(174, 65%, 52%)',            // Teal vibrante
    'hsl(200, 70%, 55%)',            // Azul ciano vibrante
    'hsl(220, 65%, 55%)',            // Azul médio
    'hsl(240, 60%, 58%)',            // Azul escuro
    'hsl(260, 55%, 58%)',            // Roxo azulado
    'hsl(280, 50%, 58%)',            // Roxo
    'hsl(300, 45%, 58%)',            // Magenta
    'hsl(190, 60%, 52%)',            // Azul esverdeado
    'hsl(210, 60%, 55%)',            // Azul claro
    'hsl(230, 55%, 56%)',            // Azul acinzentado
    'hsl(250, 50%, 58%)',            // Azul índigo
  ];


  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle de recebimentos - {periodLabel}</p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
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
            
            <Select value={periodOption} onValueChange={(value) => setPeriodOption(value as PeriodOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Este mês</SelectItem>
                <SelectItem value="last-month">Mês anterior</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                <SelectItem value="current-year">Ano atual</SelectItem>
                <SelectItem value="last-year">Ano anterior</SelectItem>
                <SelectItem value="custom">Período customizado</SelectItem>
              </SelectContent>
            </Select>

            {periodOption === 'custom' && (
              <div className="flex gap-2">
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[140px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Data inicial'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        setStartDateOpen(false);
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[140px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Data final'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        setEndDateOpen(false);
                      }}
                      locale={ptBR}
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Recebido no Período" 
            value={`R$ ${(currentStats?.totalReceived || 0).toFixed(2)}`} 
            icon={<CheckCircle className="h-5 w-5" />} 
            variant="success" 
          />
          <StatCard 
            title="Pendente no Período" 
            value={`R$ ${(currentStats?.totalPending || 0).toFixed(2)}`} 
            icon={<Clock className="h-5 w-5" />} variant="warning" 
          />
          <StatCard 
            title="Total de Consultas" 
            value={currentStats?.total || 0} 
            icon={<TrendingUp className="h-5 w-5" />} 
          />
          <StatCard 
            title="Consultas Concluídas" 
            value={currentStats?.completed || 0} 
            icon={<DollarSign className="h-5 w-5" />} 
            variant="primary" 
          />
        </div>

        {/* Comparações e Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Comparação de Faturamento */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Faturamento</h3>
              {comparisons.revenueChangePercent >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {comparisons.revenueChangePercent >= 0 ? '+' : ''}
                {comparisons.revenueChangePercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {comparisons.revenueChange >= 0 ? '+' : ''}
              R$ {Math.abs(comparisons.revenueChange).toFixed(2)} em relação ao mês anterior
            </p>
          </div>

          {/* Comparação de Consultas */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Consultas</h3>
              {comparisons.appointmentsChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold",
                comparisons.appointmentsChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {comparisons.appointmentsChange >= 0 ? '+' : ''}
                {comparisons.appointmentsChange}
              </span>
              <span className="text-sm text-muted-foreground">consultas</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {comparisons.appointmentsChangePercent >= 0 ? '+' : ''}
              {comparisons.appointmentsChangePercent.toFixed(1)}% em relação ao mês anterior
            </p>
          </div>

          {/* Valor Médio */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Valor Médio</h3>
              {comparisons.averageChangePercent >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                R$ {comparisons.averageValue.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {comparisons.averageChangePercent >= 0 ? '+' : ''}
              {comparisons.averageChangePercent.toFixed(1)}% em relação ao mês anterior
            </p>
          </div>
        </div>

        {/* Gráfico de Faturamento Mensal por Procedimento */}
        {chartData.length > 0 && uniqueProcedures.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-3 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Faturamento Mensal por Procedimento</h2>
            <div className={cn(
              "w-full [&_.recharts-surface]:bg-transparent [&_.recharts-tooltip-cursor]:transition-all [&_.recharts-tooltip-cursor]:duration-200 [&_.recharts-tooltip-cursor]:ease-in-out",
              isMobile ? "h-[220px]" : "h-[300px]"
            )}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={isMobile 
                    ? { top: 20, right: 5, left: -15, bottom: 20 } 
                    : { top: 30, right: 10, left: 0, bottom: 5 }
                  } 
                  barCategoryGap={isMobile ? "10%" : "20%"}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(180, 3%, 98%)" 
                    strokeOpacity={0.15}
                  />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: 'hsl(180, 5%, 95%)' }}
                    axisLine={{ stroke: 'hsl(180, 5%, 95%)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 12 }}
                    tickLine={{ stroke: 'hsl(180, 5%, 95%)' }}
                    axisLine={{ stroke: 'hsl(180, 5%, 95%)' }}
                    tickFormatter={(value) => {
                      if (isMobile) {
                        if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
                        return `R$${value}`;
                      }
                      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    }}
                  />
                  <Tooltip 
                    cursor={theme === 'dark' ? false : { fill: 'hsl(180, 5%, 94%)', fillOpacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: isMobile ? '6px' : '8px',
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      name
                    ]}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  {uniqueProcedures.map((procedureName, index) => {
                    const fillColor = procedureColors[index % procedureColors.length];
                    const isLastBar = index === uniqueProcedures.length - 1;
                    
                    return (
                      <Bar
                        key={procedureName}
                        dataKey={procedureName}
                        stackId="faturamento"
                        fill={fillColor}
                        radius={isLastBar ? [4, 4, 0, 0] : 0}
                        barSize={isMobile ? 40 : 60}
                      >
                        {isLastBar && (
                          <LabelList
                            dataKey="total"
                            position="top"
                            offset={isMobile ? 3 : 5}
                            formatter={(value: number) => {
                              if (value === null || value === undefined || isNaN(value) || value === 0) return '';
                              return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }}
                            style={{ 
                              fill: 'hsl(var(--foreground))', 
                              fontSize: isMobile ? 10 : 13, 
                              fontWeight: 700,
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                        )}
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda */}
            {uniqueProcedures.length > 0 && (
              <div className={cn("border-t border-border", isMobile ? "mt-3 pt-3" : "mt-4 pt-4")}>
                <p className={cn("font-medium text-foreground mb-2", isMobile ? "text-xs" : "text-sm")}>Legenda:</p>
                <div className={cn("flex flex-wrap", isMobile ? "gap-2" : "gap-3")}>
                  {uniqueProcedures.map((procedureName, index) => {
                    const backgroundColor = procedureColors[index % procedureColors.length];
                    
                    return (
                      <div key={procedureName} className="flex items-center gap-1.5 sm:gap-2">
                        <div 
                          className={cn("rounded-sm", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")}
                          style={{ backgroundColor: backgroundColor }}
                        />
                        <span className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>
                          {procedureName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pagamentos Pendentes</h2>
          {pendingAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum pagamento pendente!</p>
          ) : (
            <div className="space-y-3">
              {pendingAppointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{apt.clients?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(apt.appointment_date + 'T00:00:00'), "d 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">R$ {Number(apt.price).toFixed(2)}</span>
                    <Button 
                    size="sm" 
                    onClick={() => handleMarkAsPaid(apt.id)} 
                    className="bg-success hover:bg-success/90">Marcar Pago</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
