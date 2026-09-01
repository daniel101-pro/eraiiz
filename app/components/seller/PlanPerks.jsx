'use client';

import { Calendar, Headphones, Megaphone, Sparkles, Star, UserRound } from 'lucide-react';
import { getPlanBenefits } from '@/lib/planBenefits';
import { getSellerPlan } from '@/lib/sellerPlans';

export default function PlanPerks({ planId }) {
  const benefits = getPlanBenefits(planId);
  const plan = getSellerPlan(planId);

  if (benefits.plan === 'commission') {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        You are on <span className="font-medium">{plan.name}</span>. Listings appear in standard order,
        analytics stay basic, and sales are charged at {benefits.commissionPercent}% commission.
        Upgrade to unlock featured placement, deeper analytics, and lower commission.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-4">
      <div>
        <p className="font-semibold text-green-900">{plan.name} perks are active</p>
        <p className="text-sm text-green-800">
          Checkout commission is {benefits.commissionPercent}%. Your products are boosted in search and marked as featured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {benefits.prioritySupport && (
          <a
            href="mailto:projecterraiz@gmail.com?subject=Eraiiz%20Priority%20Support"
            className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100 hover:border-green-300"
          >
            <Headphones className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Priority email / chat support</p>
              <p className="text-xs text-gray-600">Reach the Eraiiz team with priority handling.</p>
            </div>
          </a>
        )}

        {benefits.accountManager && (
          <a
            href="mailto:projecterraiz@gmail.com?subject=Pro%20Account%20Manager"
            className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100 hover:border-green-300"
          >
            <UserRound className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Dedicated account manager</p>
              <p className="text-xs text-gray-600">Your Pro manager can help with growth and listings.</p>
            </div>
          </a>
        )}

        {benefits.strategySession && (
          <a
            href="mailto:projecterraiz@gmail.com?subject=Monthly%20Strategy%20Session"
            className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100 hover:border-green-300"
          >
            <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Monthly strategy session</p>
              <p className="text-xs text-gray-600">Book your seller growth call this month.</p>
            </div>
          </a>
        )}

        {benefits.shoutouts && (
          <a
            href="mailto:projecterraiz@gmail.com?subject=Influencer%20Shoutout%20Request"
            className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100 hover:border-green-300"
          >
            <Megaphone className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Social & influencer shoutouts</p>
              <p className="text-xs text-gray-600">Request a featured mention for a product.</p>
            </div>
          </a>
        )}

        {benefits.earlyAccess && (
          <div className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Early access</p>
              <p className="text-xs text-gray-600">Pro sellers see new analytics and featured tools first.</p>
            </div>
          </div>
        )}

        {benefits.featuredSpot && (
          <div className="flex items-start gap-3 rounded-lg bg-white p-3 border border-green-100">
            <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Featured marketplace spots</p>
              <p className="text-xs text-gray-600">Your listings show a featured badge and rank higher.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
