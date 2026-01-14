import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, MessageCircle, User, MoreVertical, Trash, InfoIcon, Download, FileSpreadsheet, FileType, Grid3x3, LayoutGrid, List, ChevronDown, Layers } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { formatPhone } from '@/lib/phone';
import { exportClients } from '@/utils/exportClients';
import { usePlan } from '@/hooks/usePlan';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientAvatar } from '@/components/ClientAvatar';

type ClientLayout = 'grid-3' | 'grid-4' | 'grid-6'; // 3, 4 ou 6 cards por linha (desktop)
type MobileClientLayout = 'compact' | 'grouped'; // compact = normal, grouped = agrupado alfabético
type SortOption = 'a-z' | 'z-a' | 'recent';

export default function Clientes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const { 
    canCreateClient, 
    maxClients, 
    canExport, 
    exportCount, 
    exportLimit, 
    isTrial 
  } = usePlan();
  const updateProfile = useUpdateProfile();
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({ name: '', phone: '', whatsapp: '', email: '', address: '', notes: '' });
  
  // Layout preferences
  const [clientLayout, setClientLayout] = useState<ClientLayout>(() => {
    const saved = localStorage.getItem('clients_layout');
    return (saved as ClientLayout) || 'grid-3';
  });
  
  const [mobileLayout, setMobileLayout] = useState<MobileClientLayout>(() => {
    const saved = localStorage.getItem('clients_mobile_layout');
    return (saved as MobileClientLayout) || 'grouped';
  });
  
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('clients_sort');
    return (saved as SortOption) || 'a-z';
  });
  
  // Controle de grupos alfabéticos expandidos
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Salvar preferências
  useEffect(() => {
    localStorage.setItem('clients_layout', clientLayout);
  }, [clientLayout]);

  useEffect(() => {
    localStorage.setItem('clients_mobile_layout', mobileLayout);
  }, [mobileLayout]);

  useEffect(() => {
    localStorage.setItem('clients_sort', sortBy);
  }, [sortBy]);

  // Handler para mudança no campo de telefone
  const handlePhoneChange = (field: 'phone' | 'whatsapp', value: string) => {
    const masked = formatPhone(value);
    setFormData({ ...formData, [field]: masked });
  };

  // Toggle de grupo alfabético
  const toggleGroup = (letter: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [letter]: !prev[letter]
    }));
  };

  // Filtrar e ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = clients;
    
    // Aplicar busca
    if (search) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.whatsapp?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Ordenar
    const sorted = [...filtered];
    if (sortBy === 'a-z') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'z-a') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    
    return sorted;
  }, [clients, search, sortBy]);

  // Agrupar por letra (para modo agrupado)
  const groupedByLetter = useMemo(() => {
    const groups: Record<string, typeof filteredAndSortedClients> = {};
    
    filteredAndSortedClients.forEach(client => {
      const firstLetter = client.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(client);
    });
    
    // Expandir todos os grupos por padrão na primeira renderização
    if (Object.keys(expandedGroups).length === 0 && Object.keys(groups).length > 0) {
      const allExpanded: Record<string, boolean> = {};
      Object.keys(groups).forEach(letter => {
        allExpanded[letter] = true;
      });
      setExpandedGroups(allExpanded);
    }
    
    return groups;
  }, [filteredAndSortedClients, expandedGroups]);

  const filteredClients = filteredAndSortedClients;

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
      const clientsToExport = filteredClients && filteredClients.length > 0 ? filteredClients : clients || [];
      
      if (clientsToExport.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum cliente para exportar',
          description: 'Não há clientes cadastrados para exportar.',
        });
        return;
      }

      exportClients(clientsToExport, { format });
      
      // Incrementar contador de exportações (se não for trial e não for ilimitado)
      if (!isTrial && exportLimit !== -1) {
        await updateProfile.mutateAsync({
          export_count: (exportCount || 0) + 1,
        });
      }
      
      toast({
        title: 'Exportação realizada!',
        description: `${clientsToExport.length} cliente(s) exportado(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os clientes. Tente novamente.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar limite de clientes
    const currentCount = clients?.length || 0;
    if (!canCreateClient(currentCount)) {
      toast({
        title: 'Limite de clientes atingido',
        description: `Você atingiu o limite de ${maxClients === -1 ? '∞' : maxClients} clientes do seu plano. Faça upgrade para mais clientes.`,
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
      // Remove máscara antes de salvar (apenas números)
      const cleanPhone = formData.phone.replace(/\D/g, '') || null;
      const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '') || null;

      await createClient.mutateAsync({
        name: formData.name,
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        email: formData.email || null,
        address: formData.address || null,
        avatar_url: null,
        notes: formData.notes || null,
      });
      toast({ title: 'Cliente cadastrado!' });
      setIsOpen(false);
      setFormData({ name: '', phone: '', whatsapp: '', email: '', address: '', notes: '' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar cliente' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">{clients?.length || 0} clientes cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            {clients && clients.length > 0 && (
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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary"><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <Input 
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.phone} 
                      onChange={e => handlePhoneChange('phone', e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input 
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp} 
                      onChange={e => handlePhoneChange('whatsapp', e.target.value)} 
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>

        {/* Ordenação e Layout Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Ordenação */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('a-z')}
                className={cn(
                  "h-8 px-3 text-xs transition-all",
                  sortBy === 'a-z' 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                A-Z
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('z-a')}
                className={cn(
                  "h-8 px-3 text-xs transition-all",
                  sortBy === 'z-a' 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                Z-A
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy('recent')}
                className={cn(
                  "h-8 px-3 text-xs transition-all",
                  sortBy === 'recent' 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                Recentes
              </Button>
            </div>
          </div>

          {/* Layout Toggle */}
          {filteredClients.length > 0 && (
            <div>
              {/* Mobile Layout Toggle */}
              {isMobile && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMobileLayout('compact')}
                    className={cn(
                      "h-8 px-3 text-xs transition-all",
                      mobileLayout === 'compact' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                        : "bg-background hover:bg-muted border-border"
                    )}
                    title="Visualização compacta"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMobileLayout('grouped')}
                    className={cn(
                      "h-8 px-3 text-xs transition-all",
                      mobileLayout === 'grouped' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                        : "bg-background hover:bg-muted border-border"
                    )}
                    title="Agrupado alfabeticamente"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Desktop Layout Toggle */}
              {!isMobile && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientLayout('grid-6')}
                    className={cn(
                      "h-8 px-3 text-xs transition-all",
                      clientLayout === 'grid-6' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                        : "bg-background hover:bg-muted border-border"
                    )}
                    title="6 por linha"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientLayout('grid-4')}
                    className={cn(
                      "h-8 px-3 text-xs transition-all",
                      clientLayout === 'grid-4' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                        : "bg-background hover:bg-muted border-border"
                    )}
                    title="4 por linha"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientLayout('grid-3')}
                    className={cn(
                      "h-8 px-3 text-xs transition-all",
                      clientLayout === 'grid-3' 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
                        : "bg-background hover:bg-muted border-border"
                    )}
                    title="3 por linha"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Clientes */}
        {isMobile && mobileLayout === 'grouped' ? (
          // Mobile - Modo Agrupado Alfabético
          <div className="space-y-3">
            {Object.keys(groupedByLetter).sort().map(letter => (
              <div key={letter} className="rounded-xl bg-card border border-border overflow-hidden">
                <button
                  onClick={() => toggleGroup(letter)}
                  className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{letter}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {groupedByLetter[letter].length} {groupedByLetter[letter].length === 1 ? 'cliente' : 'clientes'}
                    </Badge>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedGroups[letter] && "rotate-180"
                    )} />
                  </div>
                </button>
                
                {expandedGroups[letter] && (
                  <div className="p-2 space-y-1.5">
                    {groupedByLetter[letter].map(client => (
                      <div key={client.id} className="flex gap-0 overflow-hidden rounded-lg border border-border bg-background">
                        <div className={cn("w-1 flex-shrink-0", client.whatsapp ? "bg-success" : "bg-muted")} />
                        <div className="flex-1 min-w-0 p-2.5">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <ClientAvatar 
                                avatarUrl={client.avatar_url}
                                name={client.name}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {client.name}
                                </p>
                                {client.whatsapp && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {formatPhone(client.whatsapp)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="text-primary cursor-pointer"
                                  onClick={() => navigate(`/clientes/${client.id}`)}
                                >
                                  <InfoIcon className="h-4 w-4 mr-2" />
                                  Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteClient.mutate(client.id)} 
                                  className="text-destructive cursor-pointer"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {client.phone && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(`tel:${client.phone}`)}
                                className="text-xs h-6 px-2 flex-shrink-0"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Ligar
                              </Button>
                            )}
                            {client.whatsapp && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const message = `Olá ${client.name}! 👋\n\nComo posso ajudar você hoje?`;
                                  window.open(generateWhatsAppLink(client.whatsapp!, message), '_blank');
                                }}
                                className="text-xs h-6 px-2 flex-shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 border-green-300 dark:border-green-700"
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Desktop ou Mobile Compacto - Grid Normal
          <div className={cn(
            "grid gap-4",
            // Desktop
            !isMobile && clientLayout === 'grid-6' && "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
            !isMobile && clientLayout === 'grid-4' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            !isMobile && clientLayout === 'grid-3' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            // Mobile
            isMobile && "grid-cols-1"
          )}>
          {filteredClients?.map(client => (
            <div key={client.id} className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ClientAvatar 
                    avatarUrl={client.avatar_url}
                    name={client.name}
                    size="md"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}
                    </h3>
                    {client.whatsapp && <p className="text-sm text-muted-foreground">{formatPhone(client.whatsapp)}</p>}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      className="text-primary cursor-pointer"
                      onClick={() => navigate(`/clientes/${client.id}`)}
                    >
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                    onClick={() => deleteClient.mutate(client.id)} 
                    className="text-destructive cursor-pointer">
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex gap-2 mt-4">
                {client.phone && 
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${client.phone}`)}>
                  <Phone className="h-4 w-4 mr-1" />Ligar
                </Button>}
                {client.whatsapp && 
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const message = `Olá ${client.name}! 👋\n\nComo posso ajudar você hoje?`;
                    window.open(generateWhatsAppLink(client.whatsapp!, message), '_blank');
                  }}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 border-green-300 dark:border-green-700"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                </Button>}
              </div>
            </div>
          ))}
          </div>
        )}

        {filteredClients?.length === 0 && (
          <div className="p-8 rounded-xl bg-card border border-border text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro cliente para começar'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
