import { AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlanType } from '@/hooks/usePlan';
import { usePlan } from '@/hooks/usePlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: PlanType;
  showTrialInfo?: boolean;
}

const PLAN_NAMES: Record<PlanType, string> = {
  basic: 'Básico',
  professional: 'Profissional',
  premium: 'Premium',
};

export function UpgradePrompt({ 
  feature, 
  requiredPlan,
  showTrialInfo = true 
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const { isTrial, trialDaysLeft } = usePlan();

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-warning/20">
            <Lock className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Funcionalidade Premium</CardTitle>
            <CardDescription>
              {feature} está disponível no plano <strong>{PLAN_NAMES[requiredPlan]}</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrial && showTrialInfo && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">
              <strong>Você está em período de trial!</strong> Ainda restam <strong>{trialDaysLeft} dias</strong> para testar todas as funcionalidades.
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/planos')}
            className="gradient-primary flex-1"
          >
            Ver Planos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Abrir WhatsApp ou email para contato
              const message = encodeURIComponent(
                `Olá! Gostaria de fazer upgrade para o plano ${PLAN_NAMES[requiredPlan]} para ter acesso a ${feature}.`
              );
              window.open(`https://wa.me/5516997242367?text=${message}`, '_blank');
            }}
            className="flex-1"
          >
            Falar com Suporte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



