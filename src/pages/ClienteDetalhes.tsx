import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, User, Phone, MessageCircle, Edit2, Save, X, CheckCircle2, XCircle, Calendar, Clock, Footprints, FileText, DollarSign, TrendingUp, AlertCircle, Download, FileSpreadsheet, FileType } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClients, useUpdateClient } from '@/hooks/useClients';
import { useClientAppointments, useUpdateAppointment, PaymentStatus } from '@/hooks/useAppointments';
import { useProcedures } from '@/hooks/useProcedures';
import { useAnamnesis, useCreateAnamnesis, useUpdateAnamnesis } from '@/hooks/useAnamnesis';
import { useAnamnesisTemplates } from '@/hooks/useAnamnesisTemplates';
import { AnamnesisForm } from '@/components/anamnesis/AnamnesisForm';
import { AppointmentDetailCard } from '@/components/cliente/AppointmentDetailCard';
import { FinancialHistoryRow } from '@/components/cliente/FinancialHistoryRow';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { formatPhone } from '@/lib/phone';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportClientDetails } from '@/utils/exportClientDetails';
import { exportAnamnesisToPDF } from '@/utils/exportAnamnesis';
import { usePlan } from '@/hooks/usePlan';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { ImageUpload } from '@/components/ImageUpload';

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const { data: appointments, isLoading: isLoadingAppointments } = useClientAppointments(id || '');
  const { data: anamnesis, isLoading: isLoadingAnamnesis } = useAnamnesis(id || '');
  const { data: procedures } = useProcedures();
  const createAnamnesis = useCreateAnamnesis();
  const updateAnamnesis = useUpdateAnamnesis();
  const updateAppointment = useUpdateAppointment();
  const updateClient = useUpdateClient();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { 
    canUseAnamnesis, 
    canExport, 
    exportCount, 
    exportLimit, 
    isTrial 
  } = usePlan();
  
  const client = clients?.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState('dados');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || '',
    email: client?.email || '',
    address: client?.address || '',
    notes: client?.notes || '',
  });

  useEffect(() => {
    if (client && !isEditing) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    }
  }, [client, isEditing]);

  // Calcular estatísticas das consultas
  const clientStats = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return {
        firstAppointment: null,
        lastAppointment: null,
        totalAppointments: 0,
        totalSpent: 0,
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Ordenar todos os agendamentos por data
    const sortedAppointments = [...appointments].sort((a, b) => {
      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      return a.appointment_time.localeCompare(b.appointment_time);
    });

    // Primeira consulta: a primeira que foi agendada (independente de status)
    const firstAppointment = sortedAppointments[0];
    
    // Última consulta: apenas consultas CONCLUÍDAS que já aconteceram (hoje ou no passado)
    const completedPastAppointments = sortedAppointments.filter(a => 
      a.status === 'completed' && a.appointment_date <= today
    );
    
    const lastAppointment = completedPastAppointments.length > 0 
      ? completedPastAppointments[completedPastAppointments.length - 1]
      : null;
    
    const totalSpent = appointments
      .filter(a => a.payment_status === 'paid')
      .reduce((sum, a) => sum + Number(a.price), 0);

    return {
      firstAppointment: firstAppointment.appointment_date,
      lastAppointment: lastAppointment?.appointment_date || null,
      totalAppointments: appointments.length,
      totalSpent,
    };
  }, [appointments]);

  // Calcular estatísticas financeiras
  const financialStats = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return {
        totalGasto: 0,
        totalPago: 0,
        totalPendente: 0,
        ticketMedio: 0,
        hasPendingPayments: false,
      };
    }

    const totalGasto = appointments.reduce((sum, a) => sum + Number(a.price), 0);
    const totalPago = appointments
      .filter(a => a.payment_status === 'paid')
      .reduce((sum, a) => sum + Number(a.price), 0);
    const totalPendente = appointments
      .filter(a => a.payment_status === 'pending' || a.payment_status === 'partial')
      .reduce((sum, a) => sum + Number(a.price), 0);
    const ticketMedio = totalGasto / appointments.length;
    const hasPendingPayments = appointments.some(a => a.payment_status === 'pending' || a.payment_status === 'partial');

    return {
      totalGasto,
      totalPago,
      totalPendente,
      ticketMedio,
      hasPendingPayments,
    };
  }, [appointments]);

  // Estado para edição de anamnese
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [anamnesisFormData, setAnamnesisFormData] = useState<Record<string, any>>({});
  
  // Templates dinâmicos
  const { data: templates } = useAnamnesisTemplates();
  const userTemplates = templates?.filter(t => !t.is_system_template) || [];
  const defaultTemplate = userTemplates.find(t => t.is_default) || userTemplates[0];
  
  const [anamnesisData, setAnamnesisData] = useState({
    main_complaint: '',
    problem_history: '',
    has_diabetes: false,
    has_circulatory_problems: false,
    has_hypertension: false,
    uses_continuous_medication: false,
    has_allergies: false,
    is_pregnant: false,
    skin_type: '',
    sensitivity: '',
    nail_condition: '',
    calluses_fissures: '',
    clinical_observations: '',
  });

  // Atualizar dados quando anamnese carregar
  useEffect(() => {
    if (anamnesis && !isEditingAnamnesis) {
      // Dados antigos (compatibilidade)
      setAnamnesisData({
        main_complaint: anamnesis.main_complaint || '',
        problem_history: anamnesis.problem_history || '',
        has_diabetes: anamnesis.has_diabetes || false,
        has_circulatory_problems: anamnesis.has_circulatory_problems || false,
        has_hypertension: anamnesis.has_hypertension || false,
        uses_continuous_medication: anamnesis.uses_continuous_medication || false,
        has_allergies: anamnesis.has_allergies || false,
        is_pregnant: anamnesis.is_pregnant || false,
        skin_type: anamnesis.skin_type || '',
        sensitivity: anamnesis.sensitivity || '',
        nail_condition: anamnesis.nail_condition || '',
        calluses_fissures: anamnesis.calluses_fissures || '',
        clinical_observations: anamnesis.clinical_observations || '',
      });
      
      // Dados dinâmicos do template
      if (anamnesis.dynamic_answers) {
        setAnamnesisFormData(anamnesis.dynamic_answers as Record<string, any>);
      }
      if (anamnesis.template_id) {
        setSelectedTemplateId(anamnesis.template_id);
      }
    }
  }, [anamnesis, isEditingAnamnesis]);

  const hasAnamnesis = !!anamnesis;

  const handlePhoneChange = (field: 'phone' | 'whatsapp', value: string) => {
    const masked = formatPhone(value);
    setFormData({ ...formData, [field]: masked });
  };

  const handleEdit = () => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '') || null;
      const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '') || null;

      await updateClient.mutateAsync({
        id,
        name: formData.name,
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
      });

      toast({ title: 'Dados atualizados com sucesso!' });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar dados' });
    }
  };

  const handleCreateAnamnesis = () => {
    // Selecionar template padrão se houver
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
    setAnamnesisFormData({});
    setIsEditingAnamnesis(true);
  };

  const handleEditAnamnesis = () => {
    // Manter template e dados existentes
    if (anamnesis) {
      if (anamnesis.template_id) {
        setSelectedTemplateId(anamnesis.template_id);
      } else if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
      if (anamnesis.dynamic_answers) {
        setAnamnesisFormData(anamnesis.dynamic_answers as Record<string, any>);
      }
    }
    setIsEditingAnamnesis(true);
  };

  const handleNavigateToAnamneseEdit = () => {
    setActiveTab('anamnese');
    // Usar setTimeout para garantir que a aba mude antes de habilitar edição
    setTimeout(() => {
      if (hasAnamnesis) {
        handleEditAnamnesis();
      } else {
        handleCreateAnamnesis();
      }
    }, 100);
  };

  const handleCancelAnamnesis = () => {
    setIsEditingAnamnesis(false);
    if (anamnesis) {
      setAnamnesisData({
        main_complaint: anamnesis.main_complaint || '',
        problem_history: anamnesis.problem_history || '',
        has_diabetes: anamnesis.has_diabetes || false,
        has_circulatory_problems: anamnesis.has_circulatory_problems || false,
        has_hypertension: anamnesis.has_hypertension || false,
        uses_continuous_medication: anamnesis.uses_continuous_medication || false,
        has_allergies: anamnesis.has_allergies || false,
        is_pregnant: anamnesis.is_pregnant || false,
        skin_type: anamnesis.skin_type || '',
        sensitivity: anamnesis.sensitivity || '',
        nail_condition: anamnesis.nail_condition || '',
        calluses_fissures: anamnesis.calluses_fissures || '',
        clinical_observations: anamnesis.clinical_observations || '',
      });
    }
  };

  const handleSaveAnamnesisForm = async (formData: Record<string, any>) => {
    if (!id) return;

    try {
      if (hasAnamnesis && anamnesis) {
        // Atualizar anamnese existente
        await updateAnamnesis.mutateAsync({
          id: anamnesis.id,
          template_id: selectedTemplateId,
          dynamic_answers: formData,
        });
        toast({ title: 'Anamnese atualizada com sucesso!' });
      } else {
        // Criar nova anamnese
        await createAnamnesis.mutateAsync({
          client_id: id,
          template_id: selectedTemplateId,
          dynamic_answers: formData,
        });
        toast({ title: 'Anamnese criada com sucesso!' });
      }
      setIsEditingAnamnesis(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar anamnese' });
    }
  };

  const handleExportAnamnesis = () => {
    // Verificar se pode exportar (controle de plano)
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

    if (!client || !anamnesis) {
      toast({ variant: 'destructive', title: 'Dados incompletos para exportar' });
      return;
    }

    // Usar template_id da anamnese se selectedTemplateId estiver vazio
    const templateIdToUse = selectedTemplateId || anamnesis?.template_id;
    
    // Verificar se é anamnese no formato antigo (sem template)
    if (!templateIdToUse) {
      toast({ 
        variant: 'destructive', 
        title: 'Anamnese no formato antigo',
        description: 'Esta anamnese foi criada no formato antigo. Edite e salve novamente para poder exportar em PDF.' 
      });
      return;
    }

    // Usar dados da anamnese se anamnesisFormData estiver vazio
    const answersToUse = Object.keys(anamnesisFormData).length > 0 
      ? anamnesisFormData 
      : (anamnesis?.dynamic_answers as Record<string, any> || {});

    if (!templates) {
      toast({ variant: 'destructive', title: 'Templates não carregados' });
      return;
    }

    const template = templates.find(t => t.id === templateIdToUse);
    if (!template) {
      toast({ variant: 'destructive', title: 'Template não encontrado' });
      return;
    }

    try {
      exportAnamnesisToPDF({
        client,
        template,
        answers: answersToUse,
        clinicName: profile?.clinic_name || 'AgendaPro',
        lastUpdate: anamnesis.updated_at,
      });
      toast({ title: 'Anamnese exportada com sucesso!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao exportar anamnese' });
    }
  };

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
      if (!client) {
        toast({
          title: 'Erro',
          description: 'Cliente não encontrado.',
          variant: 'destructive',
        });
        return;
      }

      exportClientDetails({
        format,
        client,
        appointments: appointments || [],
        anamnesis: anamnesis || null,
      });

      // Incrementar contador de exportações (se não for trial e não for ilimitado)
      if (!isTrial && exportLimit !== -1) {
        await updateProfile.mutateAsync({
          export_count: (exportCount || 0) + 1,
        });
      }

      toast({
        title: 'Exportação realizada!',
        description: 'Histórico do cliente exportado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar histórico do cliente:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao exportar o histórico do cliente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <User className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Cliente não encontrado</h2>
          <p className="text-muted-foreground">O cliente que você está procurando não existe.</p>
          <Button onClick={() => navigate('/clientes')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Clientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/clientes')}
              className="hover:bg-muted flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">{client.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Detalhamento do cliente</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 sm:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto cursor-pointer">
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
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* Tab: Dados */}
          <TabsContent value="dados" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {/* Ações Rápidas */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    className="w-full sm:w-auto"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar Dados
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {client.phone && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`tel:${client.phone}`)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                )}
                {client.whatsapp && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(generateWhatsAppLink(client.whatsapp!, 'Olá!'))}
                    className="flex-1 sm:flex-initial"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-5">Informações de Contato</h3>
              <div className="space-y-4 sm:space-y-5">
                {/* Foto do Cliente */}
                <div className="flex flex-col items-center sm:items-start">
                  <ImageUpload
                    currentImageUrl={client.avatar_url || ''}
                    onImageUploaded={async (url) => {
                      try {
                        await updateClient.mutateAsync({
                          id: client.id,
                          avatar_url: url,
                        });
                        toast({ title: 'Foto do cliente atualizada!' });
                      } catch {
                        toast({ variant: 'destructive', title: 'Erro ao atualizar foto' });
                      }
                    }}
                    onImageRemoved={async () => {
                      try {
                        await updateClient.mutateAsync({
                          id: client.id,
                          avatar_url: null,
                        });
                        toast({ title: 'Foto do cliente removida!' });
                      } catch {
                        toast({ variant: 'destructive', title: 'Erro ao remover foto' });
                      }
                    }}
                    folder="avatars"
                    label="Foto do Cliente"
                    description="Foto para identificação visual"
                  />
                </div>

                <div>
                  <Label>Nome</Label>
                  {isEditing ? (
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{client.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    {isEditing ? (
                      <Input 
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.phone} 
                        onChange={e => handlePhoneChange('phone', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{formatPhone(client.phone) || 'Não informado'}</p>
                    )}
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    {isEditing ? (
                      <Input 
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.whatsapp} 
                        onChange={e => handlePhoneChange('whatsapp', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{formatPhone(client.whatsapp) || 'Não informado'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input 
                      type="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{client.email || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <Label>Endereço</Label>
                  {isEditing ? (
                    <Input 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{client.address || 'Não informado'}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Button onClick={handleSave} className="gradient-primary w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Observações gerais (não clínicas)</h3>
              {isEditing ? (
                <Textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Adicione observações sobre o paciente..."
                  className="min-h-[120px]"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {client.notes || 'Nenhuma observação registrada.'}
                </p>
              )}
            </div>

            {/* Informações de Contexto */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Informações de Contexto</h3>
              {isLoadingAppointments ? (
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Primeira Consulta</Label>
                    <p className="mt-1 text-foreground font-medium">
                      {clientStats.firstAppointment 
                        ? (() => {
                            const firstDate = parseISO(clientStats.firstAppointment);
                            const today = new Date();
                            const isToday = format(firstDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                            return isToday ? 'Hoje' : format(firstDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                          })()
                        : 'Nenhuma consulta'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Última Consulta</Label>
                    <p className="mt-1 text-foreground font-medium">
                      {clientStats.lastAppointment 
                        ? (() => {
                            const lastDate = parseISO(clientStats.lastAppointment);
                            const today = new Date();
                            const isToday = format(lastDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                            return isToday ? 'Hoje' : format(lastDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                          })()
                        : 'Nenhuma consulta'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total de Consultas</Label>
                    <p className="mt-1 text-foreground font-medium text-lg">
                      {clientStats.totalAppointments}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Gasto</Label>
                    <p className="mt-1 text-foreground font-medium text-lg">
                      R$ {clientStats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status da Anamnese */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-5">Status da Anamnese</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {hasAnamnesis ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Anamnese preenchida</span>
                      </div>
                      {anamnesis?.updated_at && (
                        <p className="text-sm text-muted-foreground">
                          Última atualização: {format(parseISO(anamnesis.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Anamnese pendente</span>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant={hasAnamnesis ? "outline" : "default"}
                  size="sm"
                  onClick={handleNavigateToAnamneseEdit}
                  className={cn(
                    hasAnamnesis ? "" : "gradient-primary",
                    "w-full sm:w-auto"
                  )}
                >
                  {hasAnamnesis ? (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar anamnese
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Criar anamnese
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Anamnese */}
          <TabsContent value="anamnese" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {!canUseAnamnesis() ? (
              <UpgradePrompt 
                feature="Anamnese do Paciente" 
                requiredPlan="professional"
              />
            ) : (
              <>
            {/* Status da Anamnese */}
            <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-5">Status da Anamnese</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {hasAnamnesis ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Anamnese preenchida</span>
                      </div>
                      {anamnesis?.updated_at && (
                        <p className="text-sm text-muted-foreground">
                          Última atualização: {format(parseISO(anamnesis.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Anamnese pendente</span>
                      </div>
                    </>
                  )}
                </div>
                {!isEditingAnamnesis && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    {hasAnamnesis && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleExportAnamnesis}
                        className="flex-1 sm:flex-none"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Exportar PDF</span>
                        <span className="sm:hidden">PDF</span>
                      </Button>
                    )}
                  <Button 
                    variant={hasAnamnesis ? "outline" : "default"}
                    size="sm"
                    onClick={hasAnamnesis ? handleEditAnamnesis : handleCreateAnamnesis}
                    className={cn(
                      hasAnamnesis ? "" : "gradient-primary",
                        "flex-1 sm:flex-none"
                    )}
                  >
                    {hasAnamnesis ? (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Editar anamnese</span>
                          <span className="sm:hidden">Editar</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Criar anamnese
                      </>
                    )}
                  </Button>
                  </div>
                )}
              </div>
            </div>

            {isLoadingAnamnesis ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                  {isEditingAnamnesis ? (
                  <>
                    {/* Seletor de Template */}
                    {(!selectedTemplateId || userTemplates.length > 1) && (
                <div className="rounded-xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Selecionar Modelo de Anamnese</h3>
                        <Select
                          value={selectedTemplateId || ''}
                          onValueChange={setSelectedTemplateId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {userTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                                {template.is_default && ' (Padrão)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {userTemplates.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Você não tem modelos personalizados.{' '}
                            <a href="/modelos-anamnese" className="text-primary hover:underline">
                              Criar primeiro modelo
                            </a>
                        </p>
                      )}
                    </div>
                    )}

                    {/* Formulário Dinâmico */}
                    {selectedTemplateId && (
                      <div className="rounded-xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-6">
                          {templates?.find(t => t.id === selectedTemplateId)?.name}
                        </h3>
                        <AnamnesisForm
                          template={templates?.find(t => t.id === selectedTemplateId)!}
                          initialData={anamnesisFormData}
                          onSubmit={handleSaveAnamnesisForm}
                          onCancel={() => {
                            setIsEditingAnamnesis(false);
                            // Restaurar dados originais se cancelar
                            if (anamnesis?.dynamic_answers) {
                              setAnamnesisFormData(anamnesis.dynamic_answers as Record<string, any>);
                            }
                          }}
                          isLoading={createAnamnesis.isPending || updateAnamnesis.isPending}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Visualização da Anamnese Preenchida */}
                    {anamnesis?.dynamic_answers && selectedTemplateId ? (
                      <div className="rounded-xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-6">
                          {templates?.find(t => t.id === selectedTemplateId)?.name}
                        </h3>
                        <div className="space-y-6">
                          {templates
                            ?.find(t => t.id === selectedTemplateId)
                            ?.questions?.map((question, index) => {
                              const answer = anamnesisFormData[question.id];
                              
                              if (question.question_type === 'section') {
                                return (
                                  <div key={question.id} className="pt-4 pb-2 border-b-2 border-primary/20">
                                    <h4 className="text-xl font-semibold text-foreground">{question.question_text}</h4>
                    </div>
                                );
                              }
                              
                              return (
                                <div key={question.id} className="space-y-1">
                                  <Label className="text-sm font-semibold">
                                    {index + 1}. {question.question_text}
                                  </Label>
                                  <p className="text-foreground pl-4">
                                    {answer 
                                      ? (typeof answer === 'object' 
                                          ? `${answer.answer}${answer.details ? ` - ${answer.details}` : ''}`
                                          : answer)
                                      : 'Não informado'}
                        </p>
                    </div>
                              );
                            })}
                  </div>
                </div>
                    ) : (
                      <div className="rounded-xl bg-card border border-border p-8 text-center">
                        <p className="text-muted-foreground">
                          Nenhuma anamnese preenchida ainda.
                        </p>
                  </div>
                    )}
                  </>
                )}
              </>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Consultas */}
          <TabsContent value="consultas" className="mt-6">
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentDetailCard
                    key={appointment.id}
                    appointment={appointment}
                    procedures={procedures || []}
                    onUpdate={updateAppointment}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-card border border-border p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma consulta</h3>
                <p className="text-sm text-muted-foreground">
                  Este cliente ainda não possui consultas registradas.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab: Financeiro */}
          <TabsContent value="financeiro" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Resumo Financeiro */}
                <div className="rounded-xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Resumo Financeiro
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs text-muted-foreground">Total Gasto</Label>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {financialStats.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <Label className="text-xs text-muted-foreground">Total Pago</Label>
                      </div>
                      <p className="text-2xl font-bold text-success">
                        R$ {financialStats.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <Label className="text-xs text-muted-foreground">Total Pendente</Label>
                      </div>
                      <p className="text-2xl font-bold text-warning">
                        R$ {financialStats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <Label className="text-xs text-muted-foreground">Ticket Médio</Label>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {financialStats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Indicadores de Comportamento */}
                <div className="rounded-xl bg-card border border-border p-4">
                  {financialStats.hasPendingPayments ? (
                    <div className="flex items-center gap-3 text-warning">
                      <AlertCircle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold text-foreground">Possui pagamentos pendentes</p>
                        <p className="text-sm text-muted-foreground">
                          Este cliente possui {appointments?.filter(a => a.payment_status === 'pending' || a.payment_status === 'partial').length} consulta(s) com pagamento pendente ou parcial.
                        </p>
                      </div>
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="flex items-center gap-3 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <div>
                        <p className="font-semibold text-foreground">Cliente sem pendências</p>
                        <p className="text-sm text-muted-foreground">
                          Todas as consultas deste cliente estão com pagamento em dia.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm">Nenhuma consulta registrada ainda.</p>
                    </div>
                  )}
                </div>

                {/* Histórico Financeiro */}
                <div className="rounded-xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Histórico Financeiro</h2>
                  {appointments && appointments.length > 0 ? (
                    <div className="space-y-2">
                      {appointments
                        .sort((a, b) => {
                          const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
                          if (dateCompare !== 0) return dateCompare;
                          return b.appointment_time.localeCompare(a.appointment_time);
                        })
                        .map((appointment) => (
                          <FinancialHistoryRow
                            key={appointment.id}
                            appointment={appointment}
                            onUpdatePaymentStatus={async (status) => {
                              try {
                                await updateAppointment.mutateAsync({
                                  id: appointment.id,
                                  payment_status: status,
                                });
                                toast({ 
                                  title: 'Status de pagamento atualizado!',
                                  description: 'As alterações foram salvas com sucesso.',
                                });
                              } catch (error) {
                                toast({ 
                                  variant: 'destructive', 
                                  title: 'Erro ao atualizar status',
                                  description: 'Não foi possível salvar as alterações. Tente novamente.',
                                });
                              }
                            }}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum histórico financeiro disponível.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
