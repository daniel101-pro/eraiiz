import type { SellerPlanId } from '@/lib/sellerPlans';

export function getPlanBenefits(planId?: SellerPlanId | string | null) {
  const plan = planId === 'pro' || planId === 'growth' ? planId : 'commission';

  return {
    plan,
    commissionPercent: plan === 'pro' ? 5 : plan === 'growth' ? 8 : 10,
    priorityPlacement: plan !== 'commission',
    featuredSpot: plan !== 'commission',
    enhancedAnalytics: plan !== 'commission',
    exportReports: plan !== 'commission',
    prioritySupport: plan !== 'commission',
    accountManager: plan === 'pro',
    earlyAccess: plan === 'pro',
    shoutouts: plan === 'pro',
    strategySession: plan === 'pro',
  };
}

export function planRankScore(planId?: string | null) {
  if (planId === 'pro') return 3;
  if (planId === 'growth') return 2;
  return 1;
}
