import { useProfile } from './useProfile';

export type PlanType = 'basic' | 'professional' | 'premium';

interface PlanLimits {
  maxClients: number;
  maxProcedures: number;
  exportLimit: number;
  hasReports: boolean;
  hasAnamnesis: boolean;
  hasBackup: boolean;
  hasEmailNotifications: boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  basic: {
    maxClients: 50,
    maxProcedures: 10,
    exportLimit: 0,
    hasReports: false,
    hasAnamnesis: false,
    hasBackup: false,
    hasEmailNotifications: false,
  },
  professional: {
    maxClients: 200,
    maxProcedures: 20,
    exportLimit: 10,
    hasReports: true,
    hasAnamnesis: true,
    hasBackup: true,
    hasEmailNotifications: true,
  },
  premium: {
    maxClients: -1, // ilimitado
    maxProcedures: -1, // ilimitado
    exportLimit: -1, // ilimitado
    hasReports: true,
    hasAnamnesis: true,
    hasBackup: true,
    hasEmailNotifications: true,
  },
};

export function usePlan() {
  const { data: profile } = useProfile();

  const plan: PlanType = (profile?.subscription_plan as PlanType) || 'basic';
  const limits = PLAN_LIMITS[plan];

  // Verificar se está em trial (15 dias grátis)
  const isTrial = profile?.trial_ends_at 
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  // Verificar se assinatura expirou
  const isExpired = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at) < new Date()
    : false;

  // Calcular dias restantes do trial
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificações de permissões (trial tem acesso a tudo)
  const canUseReports = () => limits.hasReports || isTrial;
  const canUseAnamnesis = () => limits.hasAnamnesis || isTrial;
  const canUseBackup = () => limits.hasBackup || isTrial;
  const canUseEmailNotifications = () => limits.hasEmailNotifications || isTrial;

  const canExport = () => {
    if (isTrial) return true;
    // Usar o limite do plano, não do banco (garantir consistência)
    const currentExportLimit = limits.exportLimit;
    if (currentExportLimit === -1) return true; // ilimitado
    if (currentExportLimit === 0) return false; // básico sem exportação
    // Para professional, verificar se atingiu o limite
    return (profile?.export_count || 0) < currentExportLimit;
  };

  const canCreateClient = (currentCount: number) => {
    if (isTrial) return true;
    if (limits.maxClients === -1) return true; // ilimitado
    return currentCount < limits.maxClients;
  };

  const canCreateProcedure = (currentCount: number) => {
    if (isTrial) return true;
    if (limits.maxProcedures === -1) return true; // ilimitado
    return currentCount < limits.maxProcedures;
  };

  // Obter limites reais (usando do banco ou padrão)
  const maxClients = profile?.max_clients !== null && profile?.max_clients !== undefined
    ? profile.max_clients
    : limits.maxClients;
  
  const maxProcedures = profile?.max_procedures !== null && profile?.max_procedures !== undefined
    ? profile.max_procedures
    : limits.maxProcedures;

  const exportCount = profile?.export_count || 0;
  const exportLimit = profile?.export_limit !== null && profile?.export_limit !== undefined
    ? profile.export_limit
    : limits.exportLimit;

  return {
    plan,
    isTrial,
    isExpired,
    trialDaysLeft,
    limits,
    // Permissões
    canUseReports,
    canUseAnamnesis,
    canUseBackup,
    canUseEmailNotifications,
    canExport,
    canCreateClient,
    canCreateProcedure,
    // Limites
    maxClients,
    maxProcedures,
    exportCount,
    exportLimit,
    // Helpers
    isUnlimited: (type: 'clients' | 'procedures' | 'exports') => {
      if (isTrial) return true;
      if (type === 'clients') return maxClients === -1;
      if (type === 'procedures') return maxProcedures === -1;
      if (type === 'exports') return exportLimit === -1;
      return false;
    },
    getRemaining: (type: 'clients' | 'procedures' | 'exports', current: number) => {
      if (isTrial) return 'Ilimitado (Trial)';
      if (type === 'clients') {
        if (maxClients === -1) return 'Ilimitado';
        return Math.max(0, maxClients - current);
      }
      if (type === 'procedures') {
        if (maxProcedures === -1) return 'Ilimitado';
        return Math.max(0, maxProcedures - current);
      }
      if (type === 'exports') {
        if (exportLimit === -1) return 'Ilimitado';
        return Math.max(0, exportLimit - exportCount);
      }
      return 0;
    },
  };
}

