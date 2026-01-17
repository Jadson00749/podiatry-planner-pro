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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Clock, Calendar as CalendarIcon, HelpCircle, Building2, Bell, Mail, MessageCircle, Database, Download, Upload, AlertTriangle, Search, Plus, Edit, Trash, Stethoscope, User, FileText, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ } from '@/lib/cnpj';
import { ImageUpload } from '@/components/ImageUpload';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useProcedures, useCreateProcedure, useUpdateProcedure, useDeleteProcedure, type Procedure } from '@/hooks/useProcedures';
import { useAllAnamnesis } from '@/hooks/useAnamnesis';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { exportBackup, validateBackup, getBackupStats, BackupData } from '@/utils/backup';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlan } from '@/hooks/usePlan';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { BookingSettingsTab } from '@/components/BookingSettingsTab';

export default function Configuracoes() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canUseBackup } = usePlan();
  const [showTourDialog, setShowTourDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const { data: procedures } = useProcedures();
  const { data: anamnesis } = useAllAnamnesis();
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();
  const deleteProcedure = useDeleteProcedure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Estados para gerenciamento de procedimentos
  const [procedureSearch, setProcedureSearch] = useState('');
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [procedureFormData, setProcedureFormData] = useState({
    name: '',
    default_price: '',
    duration_minutes: '',
    description: ''
  });
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
    avatar_url: '',
    clinic_email: '',
    clinic_address: '',
    clinic_cnpj: '',
    clinic_website: '',
    clinic_instagram: '',
    clinic_facebook: '',
    clinic_logo_url: '',
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

  // Atualizar formData quando o profile mudar (incluindo após salvar)
  useEffect(() => {
    if (profile?.id) {
      setFormData(prev => {
        // Só atualiza se realmente mudou (evita loops)
        const newData = { 
          full_name: profile.full_name || '', 
          clinic_name: profile.clinic_name || '', 
          phone: formatPhone(profile.phone) || '',
          avatar_url: profile.avatar_url || '',
          clinic_email: profile.clinic_email || '',
          clinic_address: profile.clinic_address || '',
          clinic_cnpj: formatCNPJ(profile.clinic_cnpj) || '',
          clinic_website: profile.clinic_website || '',
          clinic_instagram: profile.clinic_instagram || '',
          clinic_facebook: profile.clinic_facebook || '',
          clinic_logo_url: profile.clinic_logo_url || '',
          working_hours_start: profile.working_hours_start || '08:00',
          working_hours_end: profile.working_hours_end || '18:00',
          appointment_duration: profile.appointment_duration || 60,
          working_days: profile.working_days || [1, 2, 3, 4, 5],
          notifications_enabled: profile.notifications_enabled ?? true,
          email_notifications_enabled: profile.email_notifications_enabled ?? false,
          reminder_hours_before: profile.reminder_hours_before || [24],
          email_template: profile.email_template || ''
        };
        
        // Sempre atualiza se avatar_url ou clinic_logo_url mudaram (importante para exibir imagens)
        if (
          prev.avatar_url !== newData.avatar_url ||
          prev.clinic_logo_url !== newData.clinic_logo_url
        ) {
          return newData;
        }
        
        // Para outros campos, compara para evitar re-renders desnecessários
        if (
          prev.full_name === newData.full_name &&
          prev.clinic_name === newData.clinic_name &&
          prev.phone === newData.phone &&
          prev.clinic_email === newData.clinic_email &&
          prev.clinic_address === newData.clinic_address &&
          prev.clinic_cnpj === newData.clinic_cnpj
        ) {
          return prev;
        }
        
        return newData;
      });
    }
  }, [
    profile?.id,
    profile?.avatar_url,
    profile?.clinic_logo_url,
    profile?.full_name,
    profile?.clinic_name,
    profile?.phone,
    profile?.clinic_email,
    profile?.clinic_address,
    profile?.clinic_cnpj,
    profile?.clinic_website,
    profile?.clinic_instagram,
    profile?.clinic_facebook,
    profile?.working_hours_start,
    profile?.working_hours_end,
    profile?.appointment_duration,
    profile?.working_days,
    profile?.notifications_enabled,
    profile?.email_notifications_enabled,
    profile?.reminder_hours_before,
    profile?.email_template,
  ]);

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
        avatar_url: formData.avatar_url || null,
        clinic_email: formData.clinic_email || null,
        clinic_address: formData.clinic_address || null,
        clinic_website: formData.clinic_website || null,
        clinic_instagram: formData.clinic_instagram || null,
        clinic_facebook: formData.clinic_facebook || null,
        clinic_logo_url: formData.clinic_logo_url || null,
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

  const handleExportBackup = async () => {
    try {
      if (!profile) {
        toast({
          title: 'Erro',
          description: 'Perfil não encontrado.',
          variant: 'destructive',
        });
        return;
      }

      await exportBackup({
        profile,
        clients: clients || [],
        appointments: appointments || [],
        procedures: procedures || [],
        anamnesis: anamnesis || [],
      });

      toast({
        title: 'Backup realizado!',
        description: 'Todos os dados foram exportados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      toast({
        title: 'Erro ao exportar backup',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar o backup.',
        variant: 'destructive',
      });
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      setIsRestoring(true);
      
      const validation = await validateBackup(file);
      
      if (!validation.valid || !validation.data) {
        toast({
          title: 'Arquivo inválido',
          description: validation.error || 'O arquivo de backup não é válido.',
          variant: 'destructive',
        });
        return;
      }

      const backup = validation.data;
      const stats = getBackupStats(backup);

      // Mostrar preview e pedir confirmação
      toast({
        title: 'Backup validado!',
        description: `Backup de ${format(parseISO(backup.exportDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. ${stats.clients} clientes, ${stats.appointments} agendamentos, ${stats.procedures} procedimentos.`,
      });

      // TODO: Implementar restauração real (por enquanto só valida)
      // A restauração real precisaria de uma função que:
      // 1. Limpa dados atuais (opcional)
      // 2. Insere dados do backup
      // 3. Atualiza profile
      // Isso é mais complexo e precisa de confirmação do usuário

      toast({
        title: 'Importação concluída',
        description: 'Os dados do backup foram validados. A restauração completa será implementada em breve.',
      });
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      toast({
        title: 'Erro ao importar backup',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao importar o backup.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

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

  // Funções para formatação de moeda
  const formatCurrencyDisplay = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (numValue === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const parseCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = Number(numbers) / 100;
    return amount.toFixed(2);
  };

  // Filtrar procedimentos
  const filteredProcedures = procedures?.filter(p => 
    p.name.toLowerCase().includes(procedureSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(procedureSearch.toLowerCase())
  ) || [];

  // Resetar formulário quando dialog abrir para criar novo
  useEffect(() => {
    if (isProcedureDialogOpen && !editingProcedure) {
      setProcedureFormData({
        name: '',
        default_price: '',
        duration_minutes: '',
        description: ''
      });
    }
  }, [isProcedureDialogOpen, editingProcedure]);

  // Abrir modal para editar procedimento
  const handleEditProcedure = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setProcedureFormData({
      name: procedure.name,
      default_price: procedure.default_price.toString(),
      duration_minutes: procedure.duration_minutes?.toString() || '',
      description: procedure.description || ''
    });
    setIsProcedureDialogOpen(true);
  };

  // Salvar procedimento (criar ou atualizar)
  const handleSaveProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = parseFloat(procedureFormData.default_price) || 0;
      const duration = procedureFormData.duration_minutes ? parseInt(procedureFormData.duration_minutes) : null;

      if (editingProcedure) {
        await updateProcedure.mutateAsync({
          id: editingProcedure.id,
          name: procedureFormData.name,
          default_price: price,
          duration_minutes: duration,
          description: procedureFormData.description || null,
        });
        toast({ title: 'Procedimento atualizado com sucesso!' });
      } else {
        await createProcedure.mutateAsync({
          name: procedureFormData.name,
          default_price: price,
          duration_minutes: duration,
          description: procedureFormData.description || null,
        });
        toast({ title: 'Procedimento cadastrado com sucesso!' });
      }
      setIsProcedureDialogOpen(false);
      setEditingProcedure(null);
      setProcedureFormData({
        name: '',
        default_price: '',
        duration_minutes: '',
        description: ''
      });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: editingProcedure ? 'Erro ao atualizar procedimento' : 'Erro ao cadastrar procedimento' 
      });
    }
  };

  // Excluir procedimento
  const handleDeleteProcedure = async (id: string) => {
    try {
      await deleteProcedure.mutateAsync(id);
      toast({ title: 'Procedimento excluído com sucesso!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir procedimento' });
    }
  };

  // Handler para mudança no campo de preço
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseCurrencyInput(e.target.value);
    setProcedureFormData({ ...procedureFormData, default_price: numericValue });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Select para Mobile */}
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full mb-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perfil">
          <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Perfil e Clínica</span>
                  </div>
                </SelectItem>
                <SelectItem value="horarios">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Horários</span>
                  </div>
                </SelectItem>
                <SelectItem value="procedimentos">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>Procedimentos</span>
                  </div>
                </SelectItem>
                <SelectItem value="agendamento">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    <span>Agendamento Online</span>
                  </div>
                </SelectItem>
                <SelectItem value="sistema">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Sistema</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            /* Tabs para Desktop */
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil e Clínica</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="horarios" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="procedimentos" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Procedimentos
              </TabsTrigger>
              <TabsTrigger value="agendamento" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden lg:inline">Agendamento</span>
              </TabsTrigger>
              <TabsTrigger value="sistema" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sistema
              </TabsTrigger>
            </TabsList>
          )}

          {/* TAB: Perfil e Clínica */}
          <TabsContent value="perfil" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Perfil e Clínica</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                currentImageUrl={formData.avatar_url}
                onImageUploaded={async (url) => {
                  setFormData({...formData, avatar_url: url});
                  // Salva automaticamente no banco
                  try {
                    const cleanPhone = formData.phone.replace(/\D/g, '') || null;
                    const cleanCNPJ = formData.clinic_cnpj.replace(/\D/g, '') || null;
                    await updateProfile.mutateAsync({
                      ...formData,
                      avatar_url: url,
                      phone: cleanPhone || null,
                      clinic_cnpj: cleanCNPJ || null,
                    });
                    toast({ title: 'Foto salva com sucesso!' });
                  } catch {
                    toast({ variant: 'destructive', title: 'Erro ao salvar foto' });
                  }
                }}
                onImageRemoved={async () => {
                  setFormData({...formData, avatar_url: ''});
                  // Remove do banco também
                  try {
                    const cleanPhone = formData.phone.replace(/\D/g, '') || null;
                    const cleanCNPJ = formData.clinic_cnpj.replace(/\D/g, '') || null;
                    await updateProfile.mutateAsync({
                      ...formData,
                      avatar_url: null,
                      phone: cleanPhone || null,
                      clinic_cnpj: cleanCNPJ || null,
                    });
                    toast({ title: 'Foto removida com sucesso!' });
                  } catch {
                    toast({ variant: 'destructive', title: 'Erro ao remover foto' });
                  }
                }}
                folder="avatars"
                label="Foto do Profissional"
                description="Sua foto de perfil"
              />
              
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
              <ImageUpload
                currentImageUrl={formData.clinic_logo_url}
                onImageUploaded={async (url) => {
                  setFormData({...formData, clinic_logo_url: url});
                  // Salva automaticamente no banco
                  try {
                    const cleanPhone = formData.phone.replace(/\D/g, '') || null;
                    const cleanCNPJ = formData.clinic_cnpj.replace(/\D/g, '') || null;
                    await updateProfile.mutateAsync({
                      ...formData,
                      clinic_logo_url: url,
                      phone: cleanPhone || null,
                      clinic_cnpj: cleanCNPJ || null,
                    });
                    toast({ title: 'Logo salvo com sucesso!' });
                  } catch {
                    toast({ variant: 'destructive', title: 'Erro ao salvar logo' });
                  }
                }}
                onImageRemoved={async () => {
                  setFormData({...formData, clinic_logo_url: ''});
                  // Remove do banco também
                  try {
                    const cleanPhone = formData.phone.replace(/\D/g, '') || null;
                    const cleanCNPJ = formData.clinic_cnpj.replace(/\D/g, '') || null;
                    await updateProfile.mutateAsync({
                      ...formData,
                      clinic_logo_url: null,
                      phone: cleanPhone || null,
                      clinic_cnpj: cleanCNPJ || null,
                    });
                    toast({ title: 'Logo removido com sucesso!' });
                  } catch {
                    toast({ variant: 'destructive', title: 'Erro ao remover logo' });
                  }
                }}
                folder="logos"
                label="Logo da Clínica"
                description="Logo da sua clínica (aparecerá em emails e relatórios)"
              />
              
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
                    placeholder="minhaempresa"
                    value={formData.clinic_facebook} 
                    onChange={e => setFormData({...formData, clinic_facebook: e.target.value})} 
                  />
                </div>
              </div>
              <Button type="submit" className="gradient-primary w-full">Salvar alterações</Button>
            </form>
          </div>
          </div>
          </TabsContent>

          {/* TAB: Horários e Notificações */}
          <TabsContent value="horarios" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Horários</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Horários de Funcionamento */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horários de Funcionamento
              </h3>
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

                <Button type="submit" className="gradient-primary w-full">Salvar alterações</Button>
              </form>
            </div>

            {/* Notificações */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </h3>
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
          </div>
          </TabsContent>

          {/* TAB: Procedimentos */}
          <TabsContent value="procedimentos" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Procedimentos</h2>
          </div>
          <div className="rounded-xl bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Gerenciar Procedimentos
            </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Cadastre e gerencie os procedimentos oferecidos pela sua clínica. 
            Estes procedimentos estarão disponíveis ao criar novos agendamentos.
          </p>

          <div className="space-y-4">
            {/* Busca e Botão Novo */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar procedimento..."
                  value={procedureSearch}
                  onChange={(e) => setProcedureSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isProcedureDialogOpen} onOpenChange={(open) => {
                setIsProcedureDialogOpen(open);
                if (!open) {
                  setEditingProcedure(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Procedimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveProcedure} className="space-y-4">
                    <div>
                      <Label>Nome do Procedimento *</Label>
                      <Input
                        value={procedureFormData.name}
                        onChange={(e) => setProcedureFormData({ ...procedureFormData, name: e.target.value })}
                        placeholder="Ex: Corte de Cabelo, Limpeza de Pele, Consulta"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Preço Padrão *</Label>
                        <Input
                          type="text"
                          value={procedureFormData.default_price ? formatCurrencyDisplay(procedureFormData.default_price) : ''}
                          onChange={handlePriceChange}
                          placeholder="R$ 0,00"
                          required
                        />
                      </div>
                      <div>
                        <Label>Duração (minutos)</Label>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          value={procedureFormData.duration_minutes}
                          onChange={(e) => setProcedureFormData({ ...procedureFormData, duration_minutes: e.target.value })}
                          placeholder="60"
                          className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={procedureFormData.description}
                        onChange={(e) => setProcedureFormData({ ...procedureFormData, description: e.target.value })}
                        placeholder="Descrição detalhada do procedimento..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsProcedureDialogOpen(false);
                          setEditingProcedure(null);
                          setProcedureFormData({
                            name: '',
                            default_price: '',
                            duration_minutes: '',
                            description: ''
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 gradient-primary">
                        {editingProcedure ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de Procedimentos */}
            {filteredProcedures.length === 0 ? (
              <div className="text-center py-12 rounded-lg border border-dashed border-border bg-muted/30">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">
                  {procedureSearch ? 'Nenhum procedimento encontrado' : 'Nenhum procedimento cadastrado'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {procedureSearch 
                    ? 'Tente buscar com outros termos' 
                    : 'Clique em "Novo Procedimento" para começar'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProcedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{procedure.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {formatCurrencyDisplay(procedure.default_price)}
                          </span>
                          {procedure.duration_minutes && (
                            <span>{procedure.duration_minutes} min</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditProcedure(procedure)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Procedimento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o procedimento "{procedure.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProcedure(procedure.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {procedure.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {procedure.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          </TabsContent>

          {/* TAB: Agendamento Online */}
          <TabsContent value="agendamento" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <Link2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Agendamento Online</h2>
            </div>
            <BookingSettingsTab />
          </TabsContent>

          {/* TAB: Sistema */}
          <TabsContent value="sistema" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
            <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Sistema</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Modelos de Anamnese - NOVO */}
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Modelos de Anamnese</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Crie e personalize fichas de anamnese para seu negócio
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/modelos-anamnese')}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Gerenciar Modelos
              </Button>
            </div>

            {/* Aparência */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Aparência</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Tema</p>
                    <p className="text-sm text-muted-foreground">Alternar entre claro e escuro</p>
                  </div>
                  <ThemeToggle />
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">Tutorial de Início</p>
                      <p className="text-xs text-muted-foreground">Revise o tutorial de boas-vindas</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowTourDialog(true)}
                      className="gap-2 w-full"
                      size="sm"
                    >
                      Ver Tutorial Novamente
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup e Restauração */}
            <div className="xl:col-span-3 rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Backup e Restauração</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Faça backup de todos os seus dados ou restaure de um backup anterior. 
                Recomendamos fazer backup regularmente para proteger seus dados.
              </p>

              {!canUseBackup() ? (
                <UpgradePrompt
                  feature="Backup e Restauração"
                  requiredPlan="professional"
                />
              ) : (
              <div className="space-y-4">
                {/* Exportar Backup */}
                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Exportar Backup</h3>
                      <p className="text-sm text-muted-foreground">
                        Baixe todos os seus dados em formato JSON
                      </p>
                    </div>
                    <Button
                      onClick={handleExportBackup}
                      variant="outline"
                      className="gap-2 w-full sm:w-auto shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      Fazer Backup
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Inclui: clientes, agendamentos, procedimentos, configurações e anamneses</p>
                    <p>• Formato: JSON (fácil de ler e editar)</p>
                    <p>• Guarde o arquivo em local seguro</p>
                  </div>
                </div>

                {/* Importar Backup */}
                <div className="rounded-lg bg-muted/50 border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Restaurar Backup</h3>
                      <p className="text-sm text-muted-foreground">
                        Restaure seus dados de um arquivo de backup
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImportBackup(file);
                            // Reset input
                            e.target.value = '';
                          }
                        }}
                        disabled={isRestoring}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="gap-2 flex-1 sm:flex-initial"
                        disabled={isRestoring}
                      >
                        <Upload className="h-4 w-4" />
                        {isRestoring ? 'Restaurando...' : 'Restaurar Backup'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Atenção:</p>
                      <p>• A restauração completa substituirá todos os dados atuais</p>
                      <p>• Certifique-se de ter um backup recente antes de restaurar</p>
                      <p>• A validação do arquivo está funcionando, restauração completa em breve</p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas do Backup */}
                {clients && appointments && procedures && (
                  <div className="rounded-lg bg-muted/30 border border-border p-4">
                    <h3 className="font-semibold text-foreground mb-3 text-sm">Dados Atuais</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Clientes</p>
                        <p className="font-semibold text-foreground">{clients.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Agendamentos</p>
                        <p className="font-semibold text-foreground">{appointments.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Procedimentos</p>
                        <p className="font-semibold text-foreground">{procedures.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Anamneses</p>
                        <p className="font-semibold text-foreground">{anamnesis?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para iniciar o tour */}
      <Dialog open={showTourDialog} onOpenChange={setShowTourDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Tutorial</DialogTitle>
            <DialogDescription>
              Para reiniciar o tutorial, você precisará fazer logout e login novamente. Isso garantirá que o tutorial apareça corretamente. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTourDialog(false)}
              className="text-xs h-9 sm:text-sm sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setShowTourDialog(false);
                try {
                  // Resetar onboarding_completed para false antes de fazer logout
                  await updateProfile.mutateAsync({ onboarding_completed: false });
                  // Pequeno delay para garantir que a atualização foi salva
                  await new Promise(resolve => setTimeout(resolve, 300));
                  // Fazer logout (vai limpar tudo e redirecionar para /auth)
                  await signOut();
                } catch (error) {
                  console.error('Erro ao reiniciar tutorial:', error);
                  toast({
                    title: 'Erro',
                    description: 'Não foi possível reiniciar o tutorial. Tente novamente.',
                    variant: 'destructive',
                  });
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 sm:text-sm sm:h-10"
            >
              Reiniciar Tutorial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}