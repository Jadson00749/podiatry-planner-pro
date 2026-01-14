import { AppLayout } from '@/components/AppLayout';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, X, Crown, Zap, Rocket, ArrowRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

const PLANOS = [
  {
    id: 'basic' as const,
    name: 'Básico',
    price: 'R$ 35',
    period: '/mês',
    description: 'Ideal para começar',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    features: {
      included: [
        'Agendamentos ilimitados',
        'Gestão de clientes (até 50)',
        'Procedimentos (até 10)',
        'Controle financeiro básico',
        'Dashboard com estatísticas',
        'Anamnese: 1 template personalizado',
        'Notificações in-app',
        'Lembrete WhatsApp (manual)',
        'Tema claro/escuro',
      ],
      excluded: [
        'Relatórios e gráficos',
        'Exportações (PDF/Excel)',
        'Anamnese: Múltiplos templates',
        'Backup e restauração',
      ],
    },
  },
  {
    id: 'professional' as const,
    name: 'Profissional',
    price: 'R$ 59',
    period: '/mês',
    description: 'Mais popular',
    icon: Rocket,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    borderColor: 'border-teal-200 dark:border-teal-800',
    recommended: true,
    features: {
      included: [
        'Tudo do plano Básico',
        'Relatórios completos',
        'Gráficos avançados',
        'Exportações (10/mês)',
        'Anamnese: 3 templates personalizados',
        'Backup manual (JSON)',
        'Clientes (até 200)',
        'Procedimentos (até 20)',
      ],
      excluded: [
        'Anamnese: Templates ilimitados',
        'Exportações ilimitadas',
        'Backup automático',
        'Suporte prioritário',
      ],
    },
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 'R$ 89',
    period: '/mês',
    description: 'Máxima performance',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    features: {
      included: [
        'Tudo do plano Profissional',
        'Anamnese: Templates ilimitados',
        'Exportações ilimitadas',
        'Backup completo + restauração',
        'Clientes ilimitados',
        'Procedimentos ilimitados',
        'Suporte prioritário',
      ],
      excluded: [],
    },
  },
];

export default function Planos() {
  const { plan: currentPlan, isTrial, trialDaysLeft } = usePlan();
  const isMobile = useIsMobile();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleUpgrade = (targetPlan: 'basic' | 'professional' | 'premium') => {
    // Abrir WhatsApp para contato
    const message = encodeURIComponent(
      `Olá! Gostaria de fazer upgrade para o plano ${PLANOS.find(p => p.id === targetPlan)?.name}.`
    );
    window.open(`https://wa.me/5516997242367?text=${message}`, '_blank');
  };

  // Scroll inicial para o plano Professional (recomendado)
  useEffect(() => {
    if (!carouselApi) return;
    
    // Scroll para o Professional (índice 1) ao montar
    carouselApi.scrollTo(1, false);
  }, [carouselApi]);

  // Atualizar slide atual quando mudar
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    onSelect(); // Set inicial

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in w-full">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Escolha seu Plano
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Selecione o plano ideal para sua clínica. Todos os planos incluem 15 dias grátis para testar.
          </p>
          
          {isTrial && (
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Badge variant="default" className="bg-primary text-xs sm:text-sm">
                Plano Grátis Ativo
              </Badge>
              <span className="text-xs sm:text-sm text-foreground text-center">
                Você tem <strong>{trialDaysLeft} dias</strong> restantes
              </span>
            </div>
          )}
        </div>

        {/* Planos */}
        {isMobile ? (
          /* Carrossel Mobile */
          <div className="space-y-4">
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: 'start',
                loop: false,
              }}
              className="w-full max-w-[85%] mx-auto pt-6"
            >
              <CarouselContent className="-ml-2">
                {PLANOS.map((plano) => {
                  const Icon = plano.icon;
                  const isCurrentPlan = currentPlan === plano.id;
                  const isUpgrade = 
                    (currentPlan === 'basic' && plano.id !== 'basic') ||
                    (currentPlan === 'professional' && plano.id === 'premium');

                  return (
                    <CarouselItem key={plano.id} className="pl-2 basis-[90%]">
                      <Card
                        className={cn(
                          'relative transition-all h-full border border-border',
                          plano.recommended && 'border-2 border-primary shadow-md',
                          isCurrentPlan && 'ring-2 ring-primary ring-offset-2',
                          !plano.recommended && !isCurrentPlan && plano.id === 'premium' && 'border-2 border-primary shadow-md'
                        )}
                      >
                        {plano.recommended && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">
                              Mais Popular
                            </Badge>
                          </div>
                        )}

                        {!plano.recommended && !isCurrentPlan && plano.id === 'premium' && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-purple-600 text-white px-3 py-1 text-xs">
                              Completo
                            </Badge>
                          </div>
                        )}

                        {isCurrentPlan && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge variant="outline" className="bg-background text-xs px-2.5 py-1 border-2">
                              Seu Plano
                            </Badge>
                          </div>
                        )}

                        <CardHeader className={cn('text-center pb-2', plano.bgColor, plano.recommended || isCurrentPlan || plano.id === 'premium' ? 'pt-10' : 'pt-3')}>
                          <div className={cn('mx-auto mb-2 p-1.5 rounded-full w-fit', plano.bgColor)}>
                            <Icon className={cn('h-5 w-5', plano.color)} />
                          </div>
                          <CardTitle className="text-lg">{plano.name}</CardTitle>
                          <CardDescription className="text-xs">{plano.description}</CardDescription>
                          <div className="mt-2">
                            <span className="text-2xl font-bold text-foreground">{plano.price}</span>
                            <span className="text-sm text-muted-foreground">{plano.period}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="py-2 px-4 max-h-[260px] overflow-y-auto">
                          <ul className="space-y-1.5">
                            {plano.features.included.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-xs text-foreground">{feature}</span>
                              </li>
                            ))}
                            {plano.features.excluded.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 opacity-50">
                                <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <span className="text-xs text-muted-foreground line-through">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-1.5 pt-2 pb-4">
                          {isCurrentPlan ? (
                            <Button variant="outline" className="w-full text-sm h-9" disabled>
                              Plano Atual
                            </Button>
                          ) : isUpgrade ? (
                            <Button
                              onClick={() => handleUpgrade(plano.id)}
                              className="w-full gradient-primary text-sm h-9"
                            >
                              Fazer Upgrade
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUpgrade(plano.id)}
                              variant="outline"
                              className="w-full text-sm h-9"
                            >
                              Entrar em Contato
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const message = encodeURIComponent(
                                `Olá! Tenho dúvidas sobre o plano ${plano.name}.`
                              );
                              window.open(`https://wa.me/5516997242367?text=${message}`, '_blank');
                            }}
                            className="w-full text-xs h-8"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Falar com Suporte
                          </Button>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>

            {/* Indicadores de Paginação */}
            <div className="flex justify-center gap-1.5 mt-2">
              {PLANOS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    currentSlide === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  )}
                  aria-label={`Ir para plano ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid Desktop */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANOS.map((plano) => {
            const Icon = plano.icon;
            const isCurrentPlan = currentPlan === plano.id;
            const isUpgrade = 
              (currentPlan === 'basic' && plano.id !== 'basic') ||
              (currentPlan === 'professional' && plano.id === 'premium');

            return (
              <Card
                key={plano.id}
                className={cn(
                  'relative transition-all hover:shadow-lg border border-border',
                  plano.recommended && 'border-2 border-primary shadow-md',
                  isCurrentPlan && 'ring-2 ring-primary ring-offset-2',
                  !plano.recommended && !isCurrentPlan && plano.id === 'premium' && 'border-2 border-primary shadow-md'
                )}
              >
                {plano.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {!plano.recommended && !isCurrentPlan && plano.id === 'premium' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">
                      Completo
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="outline" className="bg-background">
                      Seu Plano
                    </Badge>
                  </div>
                )}

                <CardHeader className={cn('text-center pb-3', plano.bgColor)}>
                  <div className={cn('mx-auto mb-3 p-2 rounded-full w-fit', plano.bgColor)}>
                    <Icon className={cn('h-6 w-6', plano.color)} />
                  </div>
                  <CardTitle className="text-xl">{plano.name}</CardTitle>
                  <CardDescription className="text-sm">{plano.description}</CardDescription>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-foreground">{plano.price}</span>
                    <span className="text-muted-foreground">{plano.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <ul className="space-y-2 pt-3">
                    {plano.features.included.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                    {plano.features.excluded.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5 opacity-50">
                        <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      onClick={() => handleUpgrade(plano.id)}
                      className="w-full gradient-primary"
                    >
                      Fazer Upgrade
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plano.id)}
                      variant="outline"
                      className="w-full"
                    >
                      Entrar em Contato
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const message = encodeURIComponent(
                        `Olá! Tenho dúvidas sobre o plano ${plano.name}.`
                      );
                      window.open(`https://wa.me/5516997242367?text=${message}`, '_blank');
                    }}
                    className="w-full text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Falar com Suporte
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Dúvidas Frequentes
            </h2>
          </div>

          {isMobile ? (
            /* Accordion para Mobile */
            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Período Grátis
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Todos os novos usuários recebem 15 dias grátis para testar todas as funcionalidades, 
                  incluindo as do plano Premium. Após o período grátis, você escolhe o plano que melhor se adequa.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Como Fazer Upgrade?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Entre em contato conosco via WhatsApp ou email. O upgrade é ativado imediatamente 
                  após a confirmação do pagamento.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  Posso Mudar de Plano?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
                  As mudanças são aplicadas imediatamente.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  E se Precisar de Mais?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  Entre em contato conosco para planos personalizados ou funcionalidades específicas 
                  para sua clínica.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            /* Cards para Desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Período Grátis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Todos os novos usuários recebem 15 dias grátis para testar todas as funcionalidades, 
                    incluindo as do plano Premium. Após o período grátis, você escolhe o plano que melhor se adequa.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como Fazer Upgrade?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato conosco via WhatsApp ou email. O upgrade é ativado imediatamente 
                    após a confirmação do pagamento.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso Mudar de Plano?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
                    As mudanças são aplicadas imediatamente.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">E se Precisar de Mais?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato conosco para planos personalizados ou funcionalidades específicas 
                    para sua clínica.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

