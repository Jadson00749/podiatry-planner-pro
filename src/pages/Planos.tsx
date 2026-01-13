import { AppLayout } from '@/components/AppLayout';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Rocket, ArrowRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        'Notificações in-app',
        'Lembrete WhatsApp (manual)',
        'Tema claro/escuro',
      ],
      excluded: [
        'Relatórios e gráficos',
        'Exportações (Excel/PDF)',
        'Anamnese do Paciente',
        'Backup e restauração',
      ],
    },
  },
  {
    id: 'professional' as const,
    name: 'Profissional',
    price: 'R$ 69',
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
        'Anamnese do Paciente',
        'Backup manual (JSON)',
        'Clientes (até 200)',
        'Procedimentos (até 20)',
      ],
      excluded: [
        'Exportações ilimitadas',
        'Backup automático',
        'Suporte prioritário',
      ],
    },
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 'R$ 129',
    period: '/mês',
    description: 'Máxima performance',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    features: {
      included: [
        'Tudo do plano Profissional',
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

  const handleUpgrade = (targetPlan: 'basic' | 'professional' | 'premium') => {
    // Abrir WhatsApp para contato
    const message = encodeURIComponent(
      `Olá! Gostaria de fazer upgrade para o plano ${PLANOS.find(p => p.id === targetPlan)?.name}.`
    );
    window.open(`https://wa.me/5516997242367?text=${message}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in w-full">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano ideal para sua clínica. Todos os planos incluem 15 dias grátis para testar.
          </p>
          
          {isTrial && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Badge variant="default" className="bg-primary">
                Plano Grátis Ativo
              </Badge>
              <span className="text-sm text-foreground">
                Você tem <strong>{trialDaysLeft} dias</strong> restantes para testar todas as funcionalidades
              </span>
            </div>
          )}
        </div>

        {/* Planos */}
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
                  'relative transition-all hover:shadow-lg',
                  plano.recommended && 'border-2 border-primary shadow-md',
                  isCurrentPlan && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {plano.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
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

                <CardHeader className={cn('text-center pb-4', plano.bgColor)}>
                  <div className={cn('mx-auto mb-4 p-3 rounded-full w-fit', plano.bgColor)}>
                    <Icon className={cn('h-8 w-8', plano.color)} />
                  </div>
                  <CardTitle className="text-2xl">{plano.name}</CardTitle>
                  <CardDescription>{plano.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plano.price}</span>
                    <span className="text-muted-foreground">{plano.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3 pt-5">
                    {plano.features.included.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                    {plano.features.excluded.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 opacity-50">
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
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

        {/* Informações Adicionais */}
        <div className="mt-12 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Dúvidas Frequentes
            </h2>
          </div>

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
        </div>
      </div>
    </AppLayout>
  );
}

