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

  const links = [
    benefits.prioritySupport && {
      href: 'mailto:projecterraiz@gmail.com?subject=Eraiiz%20Priority%20Support',
      label: 'Priority support',
    },
    benefits.accountManager && {
      href: 'mailto:projecterraiz@gmail.com?subject=Pro%20Account%20Manager',
      label: 'Account manager',
    },
    benefits.strategySession && {
      href: 'mailto:projecterraiz@gmail.com?subject=Monthly%20Strategy%20Session',
      label: 'Strategy session',
    },
    benefits.shoutouts && {
      href: 'mailto:projecterraiz@gmail.com?subject=Influencer%20Shoutout%20Request',
      label: 'Shoutouts',
    },
    { href: '/account?section=Sales', label: 'Sales analytics', internal: true },
  ].filter(Boolean);

  return (
    <div className="space-y-3 border-t border-gray-200 pt-6">
      <p className="text-sm text-gray-600">
        {plan.name} is active. Commission is {benefits.commissionPercent}%. Featured placement and analytics are on.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
        {links.map((link) =>
          link.internal ? (
            <Link key={link.label} href={link.href} className="text-sm underline hover:text-green-950">
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.href} className="text-sm underline hover:text-green-950">
              {link.label}
            </a>
          )
        )}
      </div>
    </div>
  );
}
