'use client';

import Link from 'next/link';
import { getPlanBenefits } from '@/lib/planBenefits';

export default function PlanPerks({ planId }) {
  const benefits = getPlanBenefits(planId);

  if (benefits.plan === 'commission') return null;

  const links = [
    benefits.prioritySupport && {
      href: 'mailto:projecterraiz@gmail.com?subject=Eraiiz%20Priority%20Support',
      label: 'Support',
    },
    benefits.accountManager && {
      href: 'mailto:projecterraiz@gmail.com?subject=Pro%20Account%20Manager',
      label: 'Manager',
    },
    benefits.strategySession && {
      href: 'mailto:projecterraiz@gmail.com?subject=Monthly%20Strategy%20Session',
      label: 'Strategy',
    },
    benefits.shoutouts && {
      href: 'mailto:projecterraiz@gmail.com?subject=Influencer%20Shoutout%20Request',
      label: 'Shoutouts',
    },
    { href: '/account?section=Sales', label: 'Analytics', internal: true },
  ].filter(Boolean);

  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((link) =>
        link.internal ? (
          <Link key={link.label} href={link.href} className="underline hover:text-green-950">
            {link.label}
          </Link>
        ) : (
          <a key={link.label} href={link.href} className="underline hover:text-green-950">
            {link.label}
          </a>
        )
      )}
    </p>
  );
}
