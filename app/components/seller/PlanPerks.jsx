'use client';

import Link from 'next/link';
import { getPlanBenefits } from '@/lib/planBenefits';
import { getSellerPlan } from '@/lib/sellerPlans';

export default function PlanPerks({ planId }) {
  const benefits = getPlanBenefits(planId);
  const plan = getSellerPlan(planId);

  if (benefits.plan === 'commission') {
    return (
      <p className="text-sm text-gray-600">
        Listings show in standard order. Analytics stay basic. Sales are charged at {benefits.commissionPercent}% commission.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-gray-200 pt-6">
      <p className="text-sm text-gray-600">
        {plan.name} is active. Checkout commission is {benefits.commissionPercent}%. Featured placement and analytics are on.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {benefits.prioritySupport ? (
          <a href="mailto:projecterraiz@gmail.com?subject=Eraiiz%20Priority%20Support" className="underline hover:text-green-950">
            Priority support
          </a>
        ) : null}
        {benefits.accountManager ? (
          <a href="mailto:projecterraiz@gmail.com?subject=Pro%20Account%20Manager" className="underline hover:text-green-950">
            Account manager
          </a>
        ) : null}
        {benefits.strategySession ? (
          <a href="mailto:projecterraiz@gmail.com?subject=Monthly%20Strategy%20Session" className="underline hover:text-green-950">
            Strategy session
          </a>
        ) : null}
        {benefits.shoutouts ? (
          <a href="mailto:projecterraiz@gmail.com?subject=Influencer%20Shoutout%20Request" className="underline hover:text-green-950">
            Shoutouts
          </a>
        ) : null}
        <Link href="/account?section=Sales" className="underline hover:text-green-950">
          Sales analytics
        </Link>
      </div>
    </div>
  );
}
