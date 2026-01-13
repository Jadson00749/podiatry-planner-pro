import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

export type OnboardingStep = 
  | 'welcome'
  | 'configuracoes'
  | 'clientes'
  | 'agenda'
  | 'dashboard'
  | 'relatorios'
  | 'complete';

interface OnboardingState {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  showChecklist: boolean;
}

interface OnboardingContextType {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  showChecklist: boolean;
  isLoading: boolean;
  tourKey: number;
  startOnboarding: () => void;
  nextStep: (step: OnboardingStep) => void;
  closeTour: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  goToStep: (step: OnboardingStep, route?: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STATE_KEY = 'onboarding_state';

// Componente interno que usa hooks do Router
function OnboardingProviderInner({ children }: { children: ReactNode }) {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const initializedRef = useRef(false);
  
  // Carregar estado do sessionStorage se existir
  const loadStateFromStorage = (): OnboardingState => {
    try {
      const stored = sessionStorage.getItem(ONBOARDING_STATE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignorar erros de parsing
    }
    return {
      isActive: false,
      currentStep: null,
      showChecklist: false,
    };
  };

  const [state, setState] = useState<OnboardingState>(loadStateFromStorage);
  const [tourKey, setTourKey] = useState(0);
  
  // Não mostrar tour se está carregando ou se já foi completado
  const isLoading = profileLoading || !profile;
  const isCompleted = profile?.onboarding_completed === true;
  
  // Salvar estado no sessionStorage sempre que mudar
  useEffect(() => {
    if (state.isActive || state.currentStep) {
      sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(ONBOARDING_STATE_KEY);
    }
  }, [state]);
  
  // Verificar se navigate está disponível
  const safeNavigate = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      // Erro silencioso - fallback para window.location
      window.location.href = path;
    }
  };

  // Verificar se precisa mostrar onboarding apenas na primeira vez
  useEffect(() => {
    // Não fazer nada enquanto está carregando
    if (isLoading) return;
    
    // Se o tour está ativo e foi completado, não fazer nada (deixar o tour continuar)
    if (isCompleted && state.isActive) {
      return; // Não interferir com tour iniciado manualmente
    }
    
    // Se já foi completado E o tour não está ativo, resetar a ref
    if (isCompleted && !state.isActive) {
      initializedRef.current = false;
      return;
    }
    
    // Só inicializar automaticamente uma vez, e só se o onboarding não foi completado
    // onboarding_completed pode ser null (não definido) ou false (não completado)
    if (
      profile && 
      (profile.onboarding_completed === false || profile.onboarding_completed === null) && 
      !initializedRef.current &&
      !state.isActive
    ) {
      initializedRef.current = true;
      setState({
        isActive: true,
        currentStep: 'welcome',
        showChecklist: true,
      });
    }
  }, [profile?.onboarding_completed, profile?.id, isLoading, isCompleted, state.isActive]);

  const startOnboarding = async () => {
    // Permitir reiniciar o tour mesmo após ter sido completado
    // Resetar o onboarding_completed para false para permitir que apareça novamente
    try {
      await updateProfile.mutateAsync({ onboarding_completed: false });
    } catch (error) {
      console.error('Erro ao resetar onboarding_completed:', error);
    }
    
    sessionStorage.removeItem(ONBOARDING_STATE_KEY);
    initializedRef.current = true;
    
    const newState = {
      isActive: true,
      currentStep: 'welcome' as OnboardingStep,
      showChecklist: false,
    };
    
    setState(newState);
    sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState));
    setTourKey(prev => prev + 1);
  };

  // Verificar flag de iniciar tour após navegação
  useEffect(() => {
    if (isLoading) return;
    
    const shouldStartTour = sessionStorage.getItem('start_tour_after_navigation');
    if (shouldStartTour === 'true') {
      sessionStorage.removeItem('start_tour_after_navigation');
      // Resetar onboarding_completed e iniciar tour
      setTimeout(async () => {
        try {
          await updateProfile.mutateAsync({ onboarding_completed: false });
        } catch (error) {
          console.error('Erro ao resetar onboarding_completed:', error);
        }
        
        const newState = {
          isActive: true,
          currentStep: 'welcome' as OnboardingStep,
          showChecklist: false,
        };
        initializedRef.current = true;
        setState(newState);
        sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState));
        setTourKey(prev => prev + 1);
      }, 500);
    }
  }, [isLoading, profile?.id]);

  const nextStep = (step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  };

  // Fechar tour (marca como completado para não aparecer novamente ao recarregar)
  const closeTour = async () => {
    try {
      // Marcar como completado para que não apareça novamente ao recarregar
      await updateProfile.mutateAsync({ onboarding_completed: true });
      sessionStorage.removeItem(ONBOARDING_STATE_KEY);
      setState({
        isActive: false,
        currentStep: null,
        showChecklist: false,
      });
    } catch (error) {
      console.error('Erro ao fechar tour:', error);
      // Mesmo com erro, fechar o tour localmente
      setState({
        isActive: false,
        currentStep: null,
        showChecklist: false,
      });
    }
  };

  // Pular tour permanentemente (marca como completado)
  const skipOnboarding = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
      sessionStorage.removeItem(ONBOARDING_STATE_KEY);
      setState({
        isActive: false,
        currentStep: null,
        showChecklist: false,
      });
    } catch (error) {
      console.error('Erro ao pular onboarding:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
      sessionStorage.removeItem(ONBOARDING_STATE_KEY);
      setState({
        isActive: false,
        currentStep: null,
        showChecklist: false,
      });
      
      // Navegar para o Dashboard após completar o tour
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        safeNavigate('/dashboard');
      }, 300);
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const goToStep = (step: OnboardingStep, route?: string) => {
    // Atualizar o step primeiro
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
    
    // Depois navegar se necessário
    if (route && route !== window.location.pathname) {
      // Pequeno delay para garantir que o estado seja atualizado antes de navegar
      setTimeout(() => {
        safeNavigate(route);
      }, 100);
    }
  };

  const computedIsActive = state.isActive && !isLoading;
  
  return (
    <OnboardingContext.Provider
      value={{
        isActive: computedIsActive,
        currentStep: state.currentStep,
        showChecklist: !isLoading && !isCompleted && state.showChecklist,
        isLoading,
        tourKey,
        startOnboarding,
        nextStep,
        closeTour,
        skipOnboarding,
        completeOnboarding,
        goToStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// Provider wrapper que garante que está dentro do Router
export function OnboardingProvider({ children }: { children: ReactNode }) {
  return <OnboardingProviderInner>{children}</OnboardingProviderInner>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider');
  }
  return context;
}

