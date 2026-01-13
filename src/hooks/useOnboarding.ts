import { useState, useEffect, useRef } from 'react';
import { useProfile, useUpdateProfile } from './useProfile';
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

const ONBOARDING_STATE_KEY = 'onboarding_state';

export function useOnboarding() {
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
  const [tourKey, setTourKey] = useState(0); // Key para forçar remontagem do componente
  
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
  
  // Forçar re-render quando necessário (atualizando a key)
  const triggerUpdate = () => {
    setTourKey(prev => prev + 1);
  };
  
  // Verificar se navigate está disponível (dentro do Router context)
  const safeNavigate = (path: string) => {
    try {
      if (navigate) {
        navigate(path);
      } else {
        window.location.href = path;
      }
    } catch (error) {
      console.error('Erro ao navegar:', error);
      window.location.href = path;
    }
  };

  // Verificar se precisa mostrar onboarding apenas na primeira vez
  useEffect(() => {
    // Não fazer nada enquanto está carregando
    if (isLoading) return;
    
    // Se o tour está ativo e foi completado, não fazer nada (deixar o tour continuar)
    // Isso permite que o tour iniciado manualmente continue funcionando
    if (isCompleted && state.isActive) {
      return; // Não interferir com tour iniciado manualmente
    }
    
    // Se já foi completado E o tour não está ativo, resetar a ref
    if (isCompleted && !state.isActive) {
      initializedRef.current = false;
      return;
    }
    
    // Só inicializar automaticamente uma vez, e só se o onboarding não foi completado
    if (
      profile && 
      profile.onboarding_completed === false && 
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

  const startOnboarding = () => {
    // Permitir reiniciar o tour mesmo após ter sido completado
    // Limpar o sessionStorage para garantir que não há estado antigo
    sessionStorage.removeItem(ONBOARDING_STATE_KEY);
    initializedRef.current = true;
    
    // Forçar atualização do estado de forma síncrona
    const newState = {
      isActive: true,
      currentStep: 'welcome' as OnboardingStep,
      showChecklist: false, // Não mostrar checklist quando reiniciar manualmente
    };
    
    // Atualizar estado imediatamente
    setState(newState);
    
    // Salvar imediatamente no sessionStorage
    sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState));
    
    // Forçar remontagem do componente imediatamente
    setTourKey(prev => prev + 1);
  };

  const nextStep = (step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  };

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

  // Calcular isActive - permitir tour se está ativo (independente de ter sido completado ou não)
  // Mas não mostrar se ainda está carregando os dados iniciais
  const computedIsActive = state.isActive && !isLoading;
  
  return {
    // Permitir tour se: está ativo E não está carregando (independente de ter sido completado ou não)
    // Isso permite reiniciar manualmente mesmo após completar
    isActive: computedIsActive,
    currentStep: state.currentStep,
    showChecklist: !isLoading && !isCompleted && state.showChecklist,
    isLoading,
    tourKey, // Key para forçar remontagem
    startOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    goToStep,
  };
}

