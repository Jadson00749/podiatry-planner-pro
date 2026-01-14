import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, parseISO, getDay, getHours, getMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Users, Clock, Download, FileSpreadsheet, FileType, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useProcedures } from '@/hooks/useProcedures';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { exportProcedureReport, exportClientFrequencyReport, exportScheduleReport } from '@/utils/exportReports';
import { usePlan } from '@/hooks/usePlan';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useUpdateProfile } from '@/hooks/useProfile';

type PeriodOption = 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'last-year' | 'custom';

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Relatorios() {
  const { data: appointments } = useAppointments();
  const { data: clients } = useClients();
  const { data: procedures } = useProcedures();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const updateProfile = useUpdateProfile();
  const { 
    canUseReports, 
    canExport, 
    exportCount, 
    exportLimit, 
    isTrial, 
    trialDaysLeft 
  } = usePlan();
  const currentDate = new Date();
  const [periodOption, setPeriodOption] = useState<PeriodOption>('current-month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('procedimentos');

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

  // Formatar label do período
  const periodLabel = useMemo(() => {
    switch (periodOption) {
      case 'current-month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'last-month':
        return format(subMonths(currentDate, 1), 'MMMM yyyy', { locale: ptBR });
      case 'last-3-months':
        return `Últimos 3 meses`;
      case 'last-6-months':
        return `Últimos 6 meses`;
      case 'current-year':
        return format(currentDate, 'yyyy', { locale: ptBR });
      case 'last-year':
        return format(subYears(currentDate, 1), 'yyyy', { locale: ptBR });
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`;
        }
        return 'Período customizado';
      default:
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    }
  }, [periodOption, customStartDate, customEndDate, currentDate]);

  // 3.1. Relatório por Procedimento
  const procedureReport = useMemo(() => {
    if (!appointments || !procedures) return [];

    const filteredAppointments = appointments.filter(apt => {
      if (!apt.appointment_date) return false;
      return apt.appointment_date >= periodDates.start && apt.appointment_date <= periodDates.end && apt.payment_status === 'paid';
    });

    const procedureMap = new Map<string, { name: string; count: number; total: number }>();

    filteredAppointments.forEach(apt => {
      const procedureId = apt.procedure_id;
      const procedureName = apt.procedures?.name || 'Sem procedimento';
      const price = Number(apt.price) || 0;

      if (!procedureMap.has(procedureId || 'sem-procedimento')) {
        procedureMap.set(procedureId || 'sem-procedimento', {
          name: procedureName,
          count: 0,
          total: 0,
        });
      }

      const current = procedureMap.get(procedureId || 'sem-procedimento')!;
      current.count += 1;
      current.total += price;
    });

    const report = Array.from(procedureMap.values())
      .map(item => ({
        ...item,
        average: item.count > 0 ? item.total / item.count : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const totalRevenue = report.reduce((sum, item) => sum + item.total, 0);

    return report.map(item => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.total / totalRevenue) * 100 : 0,
    }));
  }, [appointments, procedures, periodDates]);

  // Dados para gráfico de pizza de procedimentos (Top 5)
  const procedureChartData = useMemo(() => {
    const top5 = procedureReport.slice(0, 5);
    return top5.map(item => ({
      name: item.name,
      value: item.count,
      percentage: item.percentage,
    }));
  }, [procedureReport]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // 3.2. Relatório de Clientes Mais Frequentes
  const clientFrequencyReport = useMemo(() => {
    if (!appointments || !clients) return [];

    const filteredAppointments = appointments.filter(apt => {
      if (!apt.appointment_date) return false;
      return apt.appointment_date >= periodDates.start && apt.appointment_date <= periodDates.end;
    });

    const clientMap = new Map<string, { 
      name: string; 
      count: number; 
      total: number; 
      lastAppointment: string | null;
    }>();

    filteredAppointments.forEach(apt => {
      const clientId = apt.client_id;
      const client = clients.find(c => c.id === clientId);
      const clientName = client?.name || 'Cliente não encontrado';
      const price = Number(apt.price) || 0;

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          name: clientName,
          count: 0,
          total: 0,
          lastAppointment: null,
        });
      }

      const current = clientMap.get(clientId)!;
      current.count += 1;
      current.total += price;

      if (!current.lastAppointment || apt.appointment_date > current.lastAppointment) {
        current.lastAppointment = apt.appointment_date;
      }
    });

    return Array.from(clientMap.values())
      .map(item => ({
        ...item,
        average: item.count > 0 ? item.total / item.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20
  }, [appointments, clients, periodDates]);

  // 3.3. Relatório de Horários Mais Ocupados
  const scheduleReport = useMemo(() => {
    if (!appointments) return { byTime: [], byDay: [] };

    const filteredAppointments = appointments.filter(apt => {
      if (!apt.appointment_date) return false;
      return apt.appointment_date >= periodDates.start && apt.appointment_date <= periodDates.end;
    });

    // Por horário
    const timeMap = new Map<string, number>();
    filteredAppointments.forEach(apt => {
      if (apt.appointment_time) {
        const time = apt.appointment_time.slice(0, 5); // HH:MM
        timeMap.set(time, (timeMap.get(time) || 0) + 1);
      }
    });

    const byTime = Array.from(timeMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => {
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        return hoursA * 60 + minutesA - (hoursB * 60 + minutesB);
      });

    const totalByTime = byTime.reduce((sum, item) => sum + item.count, 0);

    // Por dia da semana
    const dayMap = new Map<number, number>();
    filteredAppointments.forEach(apt => {
      if (apt.appointment_date) {
        const date = parseISO(apt.appointment_date);
        const dayOfWeek = getDay(date); // 0 = Domingo, 6 = Sábado
        dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + 1);
      }
    });

    const byDay = Array.from(dayMap.entries())
      .map(([day, count]) => ({ 
        day, 
        dayName: dayNames[day], 
        count 
      }))
      .sort((a, b) => a.day - b.day);

    const totalByDay = byDay.reduce((sum, item) => sum + item.count, 0);

    return {
      byTime: byTime.map(item => ({
        ...item,
        percentage: totalByTime > 0 ? (item.count / totalByTime) * 100 : 0,
      })),
      byDay: byDay.map(item => ({
        ...item,
        percentage: totalByDay > 0 ? (item.count / totalByDay) * 100 : 0,
      })),
    };
  }, [appointments, periodDates]);

  const handleExport = async (type: 'procedures' | 'clients' | 'schedule', format: 'excel' | 'pdf') => {
    // Verificar se pode exportar
    if (!canExport()) {
      toast({
        title: 'Limite de exportações atingido',
        description: `Você usou ${exportCount}/${exportLimit === -1 ? '∞' : exportLimit} exportações. Faça upgrade para exportações ilimitadas.`,
        variant: 'destructive',
        action: (
          <Button size="sm" onClick={() => window.location.href = '/planos'}>
            Ver Planos
          </Button>
        ),
      });
      return;
    }

    try {
      if (type === 'procedures') {
        exportProcedureReport(procedureReport, { format, periodDates, periodLabel });
      } else if (type === 'clients') {
        exportClientFrequencyReport(clientFrequencyReport, { format, periodDates, periodLabel });
      } else if (type === 'schedule') {
        exportScheduleReport(scheduleReport, { format, periodDates, periodLabel });
      }

      // Incrementar contador de exportações (se não for trial e não for ilimitado)
      if (!isTrial && exportLimit !== -1) {
        await updateProfile.mutateAsync({
          export_count: (exportCount || 0) + 1,
        });
      }

      toast({
        title: 'Exportação realizada!',
        description: 'Relatório exportado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar o relatório.',
        variant: 'destructive',
      });
    }
  };

  // Verificar se tem acesso aos relatórios
  if (!canUseReports()) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análises e estatísticas detalhadas</p>
          </div>
          <UpgradePrompt 
            feature="Relatórios e Análises" 
            requiredPlan="professional"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
        {isTrial && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Período Grátis Ativo</p>
              <p className="text-sm text-muted-foreground">
                Você tem <strong>{trialDaysLeft} dias</strong> restantes para testar todas as funcionalidades.
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Análises e estatísticas detalhadas - {periodLabel}</p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="procedimentos" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Por Procedimento</span>
              <span className="sm:hidden">Proced.</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Clientes Frequentes</span>
              <span className="sm:hidden">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="horarios" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Horários Ocupados</span>
              <span className="sm:hidden">Horários</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Relatório por Procedimento */}
          <TabsContent value="procedimentos" className="mt-4 sm:mt-6 space-y-4">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 text-xs sm:text-sm cursor-pointer">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                    <span className="sm:hidden">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleExport('procedures', 'excel')}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar como Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('procedures', 'pdf')}
                    className="cursor-pointer"
                  >
                    <FileType className="h-4 w-4 mr-2 text-red-600" />
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Gráfico de Pizza - Top 5 Procedimentos */}
            {procedureChartData.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-4 sm:p-6 mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Top 5 Procedimentos Mais Realizados</h3>
                <div className="h-[280px] sm:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={procedureChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={!isMobile}
                        label={({ name, percentage, cx, cy, midAngle, innerRadius, outerRadius }) => {
                          if (isMobile) {
                            // No mobile, mostrar apenas o percentual sempre centralizado
                            const RADIAN = Math.PI / 180;
                            const radius = (innerRadius || 0) + ((outerRadius || 0) - (innerRadius || 0)) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="white"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="11px"
                                fontWeight="600"
                                stroke="hsl(var(--background))"
                                strokeWidth="0.5"
                              >
                                {`${percentage.toFixed(1)}%`}
                              </text>
                            );
                          }
                          // No desktop, mostrar nome completo
                          return `${name}: ${percentage.toFixed(1)}%`;
                        }}
                        outerRadius={isMobile ? 80 : 110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {procedureChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} consultas (${props.payload.percentage.toFixed(1)}%)`,
                          'Quantidade'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: isMobile ? '11px' : '12px',
                        }}
                      />
                      <Legend 
                        formatter={(value: string, entry: any) => `${value} (${entry.payload.percentage.toFixed(1)}%)`}
                        wrapperStyle={{ paddingTop: isMobile ? '30px' : '20px', fontSize: isMobile ? '10px' : '12px' }}
                        iconSize={isMobile ? 8 : 10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {/* Mobile: Cards */}
              <div className="sm:hidden p-4 space-y-3">
                {procedureReport.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum procedimento encontrado no período selecionado
                  </div>
                ) : (
                  procedureReport.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Procedimento</div>
                      <div className="font-medium text-foreground mb-3">{item.name}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Quantidade</div>
                          <div className="font-medium text-foreground">{item.count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Faturamento</div>
                          <div className="font-medium text-foreground">R$ {item.total.toFixed(2).replace('.', ',')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">% do Total</div>
                          <div className="font-medium text-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">Ticket Médio</div>
                        <div className="font-medium text-foreground">R$ {item.average.toFixed(2).replace('.', ',')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Procedimento</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Quantidade</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Faturamento</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ticket Médio</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedureReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum procedimento encontrado no período selecionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      procedureReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{item.count}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            R$ {item.total.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            R$ {item.average.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Clientes Mais Frequentes */}
          <TabsContent value="clientes" className="mt-4 sm:mt-6 space-y-4">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 text-xs sm:text-sm cursor-pointer">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleExport('clients', 'excel')}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar como Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('clients', 'pdf')}
                    className="cursor-pointer"
                  >
                    <FileType className="h-4 w-4 mr-2 text-red-600" />
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Título da Seção */}
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Clientes Mais Frequentes</h3>
              <p className="text-sm text-muted-foreground mt-1">Lista dos clientes com mais consultas no período selecionado</p>
            </div>

            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {/* Mobile: Cards */}
              <div className="sm:hidden p-4 space-y-3">
                {clientFrequencyReport.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado no período selecionado
                  </div>
                ) : (
                  clientFrequencyReport.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Cliente</div>
                      <div className="font-medium text-foreground mb-3">{item.name}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Consultas</div>
                          <div className="font-medium text-foreground">{item.count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Total Gasto</div>
                          <div className="font-medium text-foreground">R$ {item.total.toFixed(2).replace('.', ',')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">Ticket Médio</div>
                          <div className="font-medium text-foreground">R$ {item.average.toFixed(2).replace('.', ',')}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">Última Consulta</div>
                        <div className="font-medium text-foreground text-sm">
                          {item.lastAppointment 
                            ? format(parseISO(item.lastAppointment), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Cliente</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Consultas</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Total Gasto</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ticket Médio</TableHead>
                      <TableHead className="text-center text-xs sm:text-sm">Última Consulta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientFrequencyReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground text-xs sm:text-sm">
                          Nenhum cliente encontrado no período selecionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientFrequencyReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">{item.count}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            R$ {item.total.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            R$ {item.average.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {item.lastAppointment 
                              ? format(parseISO(item.lastAppointment), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Horários Mais Ocupados */}
          <TabsContent value="horarios" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 text-xs sm:text-sm cursor-pointer">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleExport('schedule', 'excel')}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar como Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExport('schedule', 'pdf')}
                    className="cursor-pointer"
                  >
                    <FileType className="h-4 w-4 mr-2 text-red-600" />
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Gráficos de Ocupação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Gráfico de Barras - Por Horário */}
              {scheduleReport.byTime.length > 0 && (
                <div className="rounded-xl bg-card border border-border p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Ocupação por Horário</h3>
                  <div className="h-[220px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scheduleReport.byTime.slice(0, 10)} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} agendamentos (${props.payload.percentage.toFixed(1)}%)`,
                            'Quantidade'
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Gráfico de Barras - Por Dia da Semana */}
              {scheduleReport.byDay.length > 0 && (
                <div className="rounded-xl bg-card border border-border p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Ocupação por Dia da Semana</h3>
                  <div className="h-[220px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scheduleReport.byDay} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                        <XAxis 
                          dataKey="dayName" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} agendamentos (${props.payload.percentage.toFixed(1)}%)`,
                            'Quantidade'
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Por Horário */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Por Horário</h3>
                </div>
                
                {/* Mobile: Cards */}
                <div className="sm:hidden max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {scheduleReport.byTime.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum agendamento encontrado
                    </div>
                  ) : (
                    scheduleReport.byTime.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Horário</div>
                            <div className="font-medium text-foreground">{item.time}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Agendamentos</div>
                            <div className="font-medium text-foreground">{item.count}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">% Ocupação</div>
                            <div className="font-medium text-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop: Table */}
                <div className="hidden sm:block max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                      <TableRow>
                        <TableHead>Horário</TableHead>
                        <TableHead className="text-center">Agendamentos</TableHead>
                        <TableHead className="text-right">% Ocupação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleReport.byTime.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhum agendamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduleReport.byTime.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.time}</TableCell>
                            <TableCell className="text-center">{item.count}</TableCell>
                            <TableCell className="text-right">
                              {item.percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Por Dia da Semana */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Por Dia da Semana</h3>
                </div>
                
                {/* Mobile: Cards */}
                <div className="sm:hidden p-4 space-y-3">
                  {scheduleReport.byDay.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum agendamento encontrado
                    </div>
                  ) : (
                    scheduleReport.byDay.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Dia</div>
                            <div className="font-medium text-foreground">{item.dayName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Agendamentos</div>
                            <div className="font-medium text-foreground">{item.count}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">% Ocupação</div>
                            <div className="font-medium text-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop: Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dia</TableHead>
                        <TableHead className="text-center">Agendamentos</TableHead>
                        <TableHead className="text-right">% Ocupação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleReport.byDay.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhum agendamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduleReport.byDay.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.dayName}</TableCell>
                            <TableCell className="text-center">{item.count}</TableCell>
                            <TableCell className="text-right">
                              {item.percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

