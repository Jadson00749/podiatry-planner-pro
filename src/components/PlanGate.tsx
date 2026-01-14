import { ReactNode } from 'react';
import { usePlan, PlanType } from '@/hooks/usePlan';
import { UpgradePrompt } from './UpgradePrompt';

interface PlanGateProps {
  requiredPlan: PlanType;
  feature: string;
  children: ReactNode;
  showUpgrade?: boolean;
  fallback?: ReactNode;
}

function checkPlanAccess(currentPlan: PlanType, requiredPlan: PlanType): boolean {
  const planHierarchy: Record<PlanType, number> = {
    basic: 1,
    professional: 2,
    premium: 3,
  };

  return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
}

export function PlanGate({ 
  requiredPlan, 
  feature, 
  children, 
  showUpgrade = true,
  fallback 
}: PlanGateProps) {
  const { plan, isTrial } = usePlan();
  
  const hasAccess = checkPlanAccess(plan, requiredPlan) || isTrial;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgrade) {
    return <UpgradePrompt feature={feature} requiredPlan={requiredPlan} />;
  }
  
  return null;
}



