import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, User, Calendar, Footprints, Clock } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useProcedures } from '@/hooks/useProcedures';
import { formatPhone } from '@/lib/phone';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const { data: clients } = useClients();
  const { data: appointments } = useAppointments();
  const { data: procedures } = useProcedures();

  // Atalho de teclado Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    if (!search.trim()) return { clients: [], appointments: [], procedures: [] };

    const searchLower = search.toLowerCase().trim();
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

    // Buscar clientes
    const filteredClients = clients?.filter(client => {
      if (!client) return false;
      
      const name = (client.name || '').toLowerCase();
      const phone = (client.phone || '').replace(/\D/g, '');
      const whatsapp = (client.whatsapp || '').replace(/\D/g, '');
      const email = (client.email || '').toLowerCase();
      const searchClean = searchLower.replace(/\D/g, '');

      // Busca por nome (todas as palavras devem estar presentes ou busca parcial)
      const nameMatch = searchWords.length > 0 
        ? searchWords.every(word => name.includes(word))
        : name.includes(searchLower);
      
      // Busca por telefone/WhatsApp (busca exata nos números)
      const phoneMatch = searchClean.length > 0 && (
        phone.includes(searchClean) || 
        whatsapp.includes(searchClean)
      );
      
      // Busca por email
      const emailMatch = email.includes(searchLower);

      return nameMatch || phoneMatch || emailMatch;
    }) || [];

    // Buscar agendamentos
    const filteredAppointments = appointments?.filter(apt => {
      if (!apt) return false;
      
      const clientName = (apt.clients?.name || '').toLowerCase();
      const procedureName = (apt.procedures?.name || '').toLowerCase();
      const date = apt.appointment_date || '';
      const time = apt.appointment_time || '';
      const dateFormatted = date ? format(parseISO(date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '';
      const dateFormattedBR = date ? format(parseISO(date + 'T00:00:00'), 'dd-MM-yyyy', { locale: ptBR }) : '';

      // Busca por nome do cliente (todas as palavras)
      const clientMatch = searchWords.every(word => clientName.includes(word));
      
      // Busca por procedimento
      const procedureMatch = procedureName.includes(searchLower);
      
      // Busca por data (formato brasileiro)
      const dateMatch = dateFormatted.includes(searchLower) || dateFormattedBR.includes(searchLower) || date.includes(searchLower);
      
      // Busca por horário
      const timeMatch = time.includes(searchLower);

      return clientMatch || procedureMatch || dateMatch || timeMatch;
    }) || [];

    // Buscar procedimentos
    const filteredProcedures = procedures?.filter(proc => {
      const name = proc.name?.toLowerCase() || '';
      return name.includes(searchLower);
    }) || [];

    return {
      clients: filteredClients.slice(0, 5), // Limitar a 5 resultados por tipo
      appointments: filteredAppointments.slice(0, 5),
      procedures: filteredProcedures.slice(0, 5),
    };
  }, [search, clients, appointments, procedures]);

  const totalResults = filteredResults.clients.length + filteredResults.appointments.length + filteredResults.procedures.length;

  const handleSelectClient = (clientId: string) => {
    navigate(`/clientes/${clientId}`);
    onOpenChange(false);
    setSearch('');
  };

  const handleSelectAppointment = (appointmentDate: string) => {
    navigate(`/agenda?date=${appointmentDate}`);
    onOpenChange(false);
    setSearch('');
  };

  const handleSelectProcedure = (procedureId: string) => {
    // Por enquanto, só navega para agenda, mas poderia ter uma página de procedimentos
    navigate('/agenda');
    onOpenChange(false);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={isMobile ? "Buscar..." : "Buscar clientes, agendamentos, procedimentos..."}
        value={search}
        onValueChange={setSearch}
        className={isMobile ? "text-sm" : ""}
      />
      <CommandList>
        {(!clients || !appointments || !procedures) && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Carregando dados...
          </div>
        )}
        {clients && appointments && procedures && (
          <CommandEmpty>
            {search.trim() ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <p>Nenhum resultado encontrado para &quot;{search}&quot;</p>
                <p className="text-xs mt-2 text-muted-foreground/70">
                  Total disponível: {clients.length} clientes, {appointments.length} agendamentos, {procedures.length} procedimentos
                </p>
              </div>
            ) : (
              <div className={cn(
                "text-center text-muted-foreground",
                isMobile ? "py-4 text-xs" : "py-6 text-sm"
              )}>
                {isMobile ? "Digite para buscar..." : "Digite para buscar clientes, agendamentos ou procedimentos..."}
              </div>
            )}
          </CommandEmpty>
        )}

        {filteredResults.clients.length > 0 && (
          <CommandGroup heading={`Clientes (${filteredResults.clients.length})`}>
            {filteredResults.clients.map((client) => (
              <CommandItem
                key={client.id}
                value={`client-${client.id}`}
                onSelect={() => handleSelectClient(client.id)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{client.name}</span>
                  {(client.phone || client.email) && (
                    <span className="text-xs text-muted-foreground">
                      {client.phone && formatPhone(client.phone)}
                      {client.phone && client.email && ' • '}
                      {client.email}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.appointments.length > 0 && (
          <CommandGroup heading={`📅 Agendamentos (${filteredResults.appointments.length})`}>
            {filteredResults.appointments.map((apt) => {
              const date = apt.appointment_date 
                ? format(parseISO(apt.appointment_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                : '';
              const time = apt.appointment_time ? apt.appointment_time.slice(0, 5) : '';

              return (
                <CommandItem
                  key={apt.id}
                  value={`appointment-${apt.id}`}
                  onSelect={() => apt.appointment_date && handleSelectAppointment(apt.appointment_date)}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {apt.clients?.name || 'Cliente não encontrado'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date} {time && `às ${time}`}
                      {apt.procedures?.name && ` • ${apt.procedures.name}`}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredResults.procedures.length > 0 && (
          <CommandGroup heading={`🦶 Procedimentos (${filteredResults.procedures.length})`}>
            {filteredResults.procedures.map((proc) => (
              <CommandItem
                key={proc.id}
                value={`procedure-${proc.id}`}
                onSelect={() => handleSelectProcedure(proc.id)}
                className="cursor-pointer"
              >
                <Footprints className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{proc.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {search.trim() && totalResults === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>Nenhum resultado encontrado</p>
            <p className="text-xs mt-1">Tente buscar por nome, telefone, data ou procedimento</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

