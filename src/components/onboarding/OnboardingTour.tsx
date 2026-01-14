import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding, type OnboardingStep } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TourStep {
  id: OnboardingStep;
  title: string;
  description: string;
  target?: string; // ID do elemento a destacar
  route?: string; // Rota para navegar
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao AgendaPro! 🎉',
    description: 'Vamos te guiar pelos primeiros passos para configurar sua clínica. Este tutorial leva apenas 2 minutos!',
    position: 'bottom',
  },
  {
    id: 'configuracoes',
    title: '1. Configure sua clínica',
    description: 'Comece configurando seus horários de funcionamento e cadastrando os procedimentos que você oferece.',
    target: 'nav-configuracoes',
    route: '/configuracoes',
    position: 'right',
  },
  {
    id: 'clientes',
    title: '2. Cadastre seus clientes',
    description: 'Adicione seus clientes para começar a agendar consultas. Você pode importar dados ou cadastrar manualmente.',
    target: 'nav-clientes',
    route: '/clientes',
    position: 'right',
  },
  {
    id: 'agenda',
    title: '3. Crie seu primeiro agendamento',
    description: 'Agora você pode criar agendamentos! Selecione o cliente, procedimento, data e horário.',
    target: 'nav-agenda',
    route: '/agenda',
    position: 'right',
  },
  {
    id: 'dashboard',
    title: '4. Acompanhe seu Dashboard',
    description: 'Aqui você vê um resumo do dia, estatísticas do mês e seus próximos agendamentos.',
    target: 'nav-dashboard',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'relatorios',
    title: '5. Visualize seus relatórios',
    description: 'Acompanhe relatórios detalhados de procedimentos, clientes e horários para tomar decisões estratégicas.',
    target: 'nav-relatorios',
    route: '/relatorios',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Tudo pronto! 🚀',
    description: 'Você já conhece o básico! Explore o sistema e descubra todas as funcionalidades. Você pode ver este tutorial novamente nas Configurações.',
    position: 'bottom',
  },
];

export function OnboardingTour() {
  const { isActive, currentStep, nextStep, closeTour, skipOnboarding, completeOnboarding, goToStep, isLoading } = useOnboarding();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const currentStepIndex = tourSteps.findIndex(step => step.id === currentStep);
  const currentStepData = currentStepIndex >= 0 ? tourSteps[currentStepIndex] : null;
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Recalcular targetRect quando o step mudar
  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const targetElement = currentStepData.target 
        ? document.getElementById(currentStepData.target)
        : null;
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    // Scroll para o elemento alvo após um pequeno delay
    const scrollToTarget = () => {
      const targetElement = currentStepData.target 
        ? document.getElementById(currentStepData.target)
        : null;
      
      if (targetElement) {
        // Tentar scroll suave, com fallback para instantâneo
        try {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch (e) {
          targetElement.scrollIntoView({ block: 'center', inline: 'nearest' });
        }
        // Atualizar rect após scroll
        setTimeout(() => {
          updateTargetRect();
        }, 100);
      }
    };

    // Atualizar rect imediatamente
    updateTargetRect();

    // Delay maior se precisou navegar para garantir que a página carregou
    const delay = currentStepData.route && currentStepData.route !== window.location.pathname ? 800 : 400;
    const timeoutId = setTimeout(scrollToTarget, delay);
    
    // Atualizar rect periodicamente para garantir que está correto (a cada 50ms para ser mais responsivo)
    const intervalId = setInterval(() => {
      updateTargetRect();
    }, 50);
    
    // Também atualizar quando a janela for redimensionada ou quando houver scroll
    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isActive, currentStep, currentStepData]);

  // Obter o elemento alvo
  const targetElement = currentStepData?.target 
    ? document.getElementById(currentStepData.target)
    : null;

  // Destacar a aba com borda e efeitos visuais
  useEffect(() => {
    if (targetElement && isActive) {
      const originalZIndex = targetElement.style.zIndex;
      const originalPosition = targetElement.style.position;
      const originalBorder = targetElement.style.border;
      const originalBoxShadow = targetElement.style.boxShadow;
      const originalOutline = targetElement.style.outline;
      const originalTransition = targetElement.style.transition;
      const originalBorderRadius = targetElement.style.borderRadius;
      
      // Z-index maior no mobile para ficar acima do overlay (z-60)
      targetElement.style.zIndex = isMobile ? '61' : '102';
      targetElement.style.position = 'relative';
      
      // Adicionar borda destacada e sombra forte para indicar que se refere a ela
      targetElement.style.border = '3px solid hsl(var(--primary))';
      targetElement.style.boxShadow = '0 0 0 6px hsl(var(--primary) / 0.3), 0 0 0 10px hsl(var(--primary) / 0.2), 0 0 30px hsl(var(--primary) / 0.6), 0 8px 16px rgba(0, 0, 0, 0.3)';
      targetElement.style.outline = 'none';
      targetElement.style.borderRadius = '8px'; // Garantir bordas arredondadas
      targetElement.style.transition = 'all 0.3s ease'; // Transição suave
      
      // No mobile, também aumentar z-index do sidebar (SheetContent)
      let sidebarElement: HTMLElement | null = null;
      if (isMobile) {
        sidebarElement = document.querySelector('[role="dialog"]') as HTMLElement;
        if (sidebarElement) {
          const originalSidebarZ = sidebarElement.style.zIndex;
          sidebarElement.style.zIndex = '61';
          return () => {
            targetElement.style.zIndex = originalZIndex;
            targetElement.style.position = originalPosition;
            targetElement.style.border = originalBorder;
            targetElement.style.boxShadow = originalBoxShadow;
            targetElement.style.outline = originalOutline;
            targetElement.style.borderRadius = originalBorderRadius;
            targetElement.style.transition = originalTransition;
            if (sidebarElement) {
              sidebarElement.style.zIndex = originalSidebarZ;
            }
          };
        }
      }
      
      return () => {
        targetElement.style.zIndex = originalZIndex;
        targetElement.style.position = originalPosition;
        targetElement.style.border = originalBorder;
        targetElement.style.boxShadow = originalBoxShadow;
        targetElement.style.outline = originalOutline;
        targetElement.style.borderRadius = originalBorderRadius;
        targetElement.style.transition = originalTransition;
      };
    }
  }, [targetElement, isActive, currentStep, isMobile]);

  // Não renderizar nada enquanto está carregando ou se não estiver ativo
  if (isLoading || !isActive || !currentStepData) return null;

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStepIndex + 1];
      if (nextStepData.route) {
        // Se tem rota, usar goToStep que já atualiza o step e navega
        goToStep(nextStepData.id, nextStepData.route);
      } else {
        // Se não tem rota, apenas atualizar o step
        nextStep(nextStepData.id);
      }
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    try {
      if (currentStepIndex > 0) {
        const prevStepData = tourSteps[currentStepIndex - 1];
        if (prevStepData.route) {
          goToStep(prevStepData.id, prevStepData.route);
        } else {
          nextStep(prevStepData.id);
        }
      }
    } catch (error) {
      console.error('Erro ao voltar no tour:', error);
      // Em caso de erro, apenas volta o step sem navegar
      if (currentStepIndex > 0) {
        nextStep(tourSteps[currentStepIndex - 1].id);
      }
    }
  };

  return (
    <>
      {/* Overlay escuro com buraco */}
      {(() => {
        // Recalcular targetRect para o overlay também
        const overlayTargetElement = currentStepData.target 
          ? document.getElementById(currentStepData.target)
          : null;
        const overlayTargetRect = overlayTargetElement?.getBoundingClientRect() || targetRect;
        
        if (!overlayTargetRect) return null;
        
        // Padding maior no mobile para destacar melhor a aba
        const padding = isMobile ? 12 : 8;
        
        const left = Math.max(0, overlayTargetRect.left - padding);
        const top = Math.max(0, overlayTargetRect.top - padding);
        const right = Math.min(window.innerWidth, overlayTargetRect.right + padding);
        const bottom = Math.min(window.innerHeight, overlayTargetRect.bottom + padding);
        
        // No mobile, usar abordagem diferente: overlay completo + elemento sobre a aba
        if (isMobile) {
          return (
            <>
              {/* Overlay completo cobrindo tudo */}
              <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 60,
                }}
                onClick={closeTour}
                onTouchStart={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-tour-tooltip]') || overlayTargetElement?.contains(target)) {
                    e.stopPropagation();
                  }
                }}
              />
              {/* Elemento que "corta" o overlay sobre a aba - usando cor do sidebar */}
              <div
                className="fixed bg-sidebar"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${right - left}px`,
                  height: `${bottom - top}px`,
                  zIndex: 61,
                  pointerEvents: 'none', // Não interceptar eventos
                }}
              />
            </>
          );
        }
        
        // Desktop: usar clipPath
        const clipPath = `polygon(
          0% 0%,
          0% 100%,
          ${left}px 100%,
          ${left}px ${top}px,
          ${right}px ${top}px,
          ${right}px ${bottom}px,
          ${left}px ${bottom}px,
          ${left}px 100%,
          100% 100%,
          100% 0%
        )`;
        
        return (
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{
              clipPath: clipPath,
              WebkitClipPath: clipPath,
              pointerEvents: 'auto',
              zIndex: 100,
            }}
            onClick={closeTour}
            onTouchStart={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-tour-tooltip]') || overlayTargetElement?.contains(target)) {
                e.stopPropagation();
              }
            }}
          />
        );
      })()}
      {!targetRect && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeTour}
          style={{ 
            pointerEvents: 'auto',
            zIndex: isMobile ? 60 : 100,
          }}
        />
      )}

      {/* Tooltip do passo atual */}
      {(() => {
        // Recalcular targetRect aqui também para garantir que está atualizado
        const currentTargetElement = currentStepData.target 
          ? document.getElementById(currentStepData.target)
          : null;
        const currentTargetRect = currentTargetElement?.getBoundingClientRect() || targetRect;
        
        // Calcular posicionamento inteligente baseado na posição do elemento
        let tooltipStyle: React.CSSProperties = {};
        
        // Verificar se é um passo de navegação (target começa com 'nav-')
        const isNavStep = currentStepData.target?.startsWith('nav-') ?? false;
        
        // Usar o rect mais recente (calculado agora ou do estado)
        const rectToUse = currentTargetRect || targetRect;
        
        if (rectToUse && currentStepData.position === 'right') {
          // No mobile, quando destacando navegação, posicionar tooltip fixo no centro inferior
          if (isMobile && isNavStep) {
            // Posição fixa no mobile - centralizado na parte inferior da tela
            tooltipStyle = {
              left: '50%',
              bottom: '24px',
              transform: 'translateX(-50%)',
              maxWidth: `${Math.min(window.innerWidth - 32, 320)}px`,
            };
          } else if (isMobile) {
            // Mobile mas não é navegação - posicionar ao lado direito
            tooltipStyle = {
              left: `${Math.max(16, Math.min(rectToUse.right + 16, window.innerWidth - 16))}px`,
              top: `${rectToUse.bottom + 16}px`,
              maxWidth: `${window.innerWidth - 32}px`,
            };
          } else {
            // Desktop: lógica original
            const isNearTop = rectToUse.top < window.innerHeight * 0.2;
            const isNearBottom = rectToUse.bottom > window.innerHeight * 0.8;
            
            if (isNearTop) {
              tooltipStyle = {
                left: `${Math.min(rectToUse.right + 24, window.innerWidth - 500)}px`,
                top: `${rectToUse.bottom + 16}px`,
                maxWidth: '480px',
              };
            } else if (isNearBottom) {
              tooltipStyle = {
                left: `${Math.min(rectToUse.right + 24, window.innerWidth - 500)}px`,
                bottom: `${window.innerHeight - rectToUse.top + 16}px`,
                maxWidth: '480px',
              };
            } else {
              tooltipStyle = {
                left: `${Math.min(rectToUse.right + 24, window.innerWidth - 500)}px`,
                top: `${rectToUse.top + rectToUse.height / 2}px`,
                transform: 'translateY(-50%)',
                maxWidth: '480px',
              };
            }
          }
                  } else if (rectToUse && currentStepData.position === 'left') {
          if (isMobile && isNavStep) {
            // Posição fixa no mobile - centralizado na parte inferior da tela
            tooltipStyle = {
              left: '50%',
              bottom: '24px',
              transform: 'translateX(-50%)',
              maxWidth: `${Math.min(window.innerWidth - 32, 320)}px`,
            };
          } else if (isMobile) {
            // Mobile mas não é navegação
            tooltipStyle = {
              right: `${Math.max(16, window.innerWidth - targetRect.left + 16)}px`,
              top: `${targetRect.bottom + 16}px`,
              maxWidth: `${window.innerWidth - 32}px`,
            };
          } else {
            // Desktop: lógica original
            const isNearTop = targetRect.top < window.innerHeight * 0.2;
            const isNearBottom = targetRect.bottom > window.innerHeight * 0.8;
            
            if (isNearTop) {
              tooltipStyle = {
                right: `${window.innerWidth - targetRect.left + 24}px`,
                top: `${targetRect.bottom + 16}px`,
                maxWidth: '480px',
              };
            } else if (isNearBottom) {
              tooltipStyle = {
                right: `${window.innerWidth - targetRect.left + 24}px`,
                bottom: `${window.innerHeight - targetRect.top + 16}px`,
                maxWidth: '480px',
              };
            } else {
              tooltipStyle = {
                right: `${window.innerWidth - targetRect.left + 24}px`,
                top: `${targetRect.top + targetRect.height / 2}px`,
                transform: 'translateY(-50%)',
                maxWidth: '480px',
              };
            }
          }
                  } else if (rectToUse && currentStepData.position === 'top') {
                    tooltipStyle = {
                      left: isMobile 
                        ? '50%'
                        : `${Math.max(24, Math.min(rectToUse.left + rectToUse.width / 2 - 240, window.innerWidth - 504))}px`,
                      bottom: `${window.innerHeight - rectToUse.top + 24}px`,
                      transform: isMobile ? 'translate(-50%, 0)' : 'translateX(-50%)',
                      maxWidth: isMobile ? `${window.innerWidth - 32}px` : '480px',
                    };
                  } else {
                    // Sem target ou position bottom - centralizar
                    tooltipStyle = {
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      maxWidth: isMobile ? `${window.innerWidth - 32}px` : '480px',
                    };
                  }

        return (
          <div
            data-tour-tooltip
            className={cn(
              "fixed bg-card border-2 border-primary rounded-lg shadow-2xl animate-in fade-in zoom-in-95",
              isMobile ? "p-5 mx-4 max-w-[calc(100vw-2rem)] min-w-[320px]" : "p-6 z-[70]"
            )}
            style={{
              ...tooltipStyle,
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              // Tooltip sempre acima do overlay
              zIndex: 101,
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-4">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className={cn(
                  "font-bold text-foreground mb-2 sm:mb-2",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  {currentStepData.title}
                </h3>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs leading-relaxed" : "text-sm leading-relaxed"
                )}>
                  {currentStepData.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0",
                  isMobile ? "h-5 w-5" : "h-6 w-6"
                )}
                onClick={closeTour}
                title="Fechar"
              >
                <X className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </Button>
            </div>

            <div className={cn(
              "flex items-center justify-between",
              isMobile ? "mt-4 flex-col gap-2" : "mt-6"
            )}>
              <div className={cn(
                "flex items-center gap-2",
                isMobile ? "w-full justify-between mb-1" : ""
              )}>
                <span className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {currentStepIndex + 1} de {tourSteps.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipOnboarding}
                  className={cn(
                    "text-muted-foreground hover:text-destructive",
                    isMobile ? "text-[10px] px-2 h-6" : "text-xs"
                  )}
                >
                  Pular tutorial
                </Button>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                isMobile ? "w-full" : ""
              )}>
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className={cn(
                      "gap-1",
                      isMobile ? "flex-1 text-xs h-8 px-2" : "gap-2"
                    )}
                  >
                    <ArrowLeft className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    Anterior
                  </Button>
                )}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  className={cn(
                    "gradient-primary gap-1",
                    isMobile ? "flex-1 text-xs h-8 px-2" : "gap-2"
                  )}
                  size="sm"
                  type="button"
                >
                  {currentStepIndex === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                  <ArrowRight className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

