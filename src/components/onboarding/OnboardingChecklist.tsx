import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useProcedures } from '@/hooks/useProcedures';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  route: string;
  isCompleted: boolean;
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const proceduresQuery = useProcedures();
  const clientsQuery = useClients();
  const appointmentsQuery = useAppointments();
  
  const procedures = proceduresQuery.data;
  const clients = clientsQuery.data;
  const appointments = appointmentsQuery.data;
  
  // Verificar se algum dado ainda está carregando
  const isLoading = 
    profileLoading || 
    proceduresQuery.isLoading || 
    clientsQuery.isLoading || 
    appointmentsQuery.isLoading;
  
  // Não mostrar se:
  // 1. Ainda está carregando
  // 2. Não tem profile
  // 3. Já completou o onboarding
  if (isLoading || !profile || profile.onboarding_completed === true) {
    return null;
  }

  const checklistItems: ChecklistItem[] = [
    {
      id: 'config',
      title: 'Configurar horários e procedimentos',
      description: 'Defina seus horários de funcionamento e cadastre os procedimentos oferecidos',
      route: '/configuracoes',
      isCompleted: !!(
        profile?.working_hours_start &&
        profile?.working_hours_end &&
        procedures &&
        procedures.length > 0
      ),
    },
    {
      id: 'clients',
      title: 'Cadastrar primeiro cliente',
      description: 'Adicione pelo menos um cliente para começar a agendar consultas',
      route: '/clientes',
      isCompleted: !!(clients && clients.length > 0),
    },
    {
      id: 'appointment',
      title: 'Criar primeiro agendamento',
      description: 'Crie seu primeiro agendamento para testar o sistema completo',
      route: '/agenda',
      isCompleted: !!(appointments && appointments.length > 0),
    },
  ];

  const completedCount = checklistItems.filter(item => item.isCompleted).length;
  const allCompleted = completedCount === checklistItems.length;

  if (allCompleted) {
    return null; // Não mostra se tudo estiver completo
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 p-6 mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground mb-1">
            Bem-vindo ao AgendaPro! 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete os passos abaixo para começar a usar o sistema
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {completedCount}/{checklistItems.length}
          </div>
          <div className="text-xs text-muted-foreground">concluídos</div>
        </div>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all',
              item.isCompleted
                ? 'bg-muted/50 border-border'
                : 'bg-card border-border hover:border-primary/50'
            )}
          >
            <div className="mt-0.5">
              {item.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-medium text-sm',
                  item.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
              >
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
            {!item.isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.route)}
                className="gap-1 text-primary hover:text-primary"
              >
                Ir
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-foreground font-medium text-center">
            🎉 Parabéns! Você completou a configuração inicial!
          </p>
        </div>
      )}
    </div>
  );
}

