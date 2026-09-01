export type SellerPlanId = 'commission' | 'growth' | 'pro';

export interface SellerPlan {
  id: SellerPlanId;
  name: string;
  priceLabel: string;
  amountNgn: number;
  interval: 'monthly' | null;
  commissionPercent: number;
  description: string;
  features: string[];
  paystackPlanName?: string;
}

export const SELLER_PLANS: SellerPlan[] = [
  {
    id: 'commission',
    name: 'Pay-as-you-sell',
    priceLabel: '10% per sale',
    amountNgn: 0,
    interval: null,
    commissionPercent: 10,
    description: 'No upfront cost. We only earn when you sell.',
    features: [
      'Unlimited product listings',
      'Standard analytics',
      'Basic support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Subscription',
    priceLabel: '₦49,000 / mo',
    amountNgn: 49000,
    interval: 'monthly',
    commissionPercent: 8,
    description: 'Boost visibility with premium placement and deeper insights.',
    features: [
      'Priority search placement',
      'Enhanced analytics dashboard',
      'Marketing boosts & featured spots',
      'Email / chat support',
      '8% commission per sale',
    ],
    paystackPlanName: 'Eraiiz Growth Monthly',
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    priceLabel: '₦149,000 / mo',
    amountNgn: 149000,
    interval: 'monthly',
    commissionPercent: 5,
    description: 'For established eco-brands that want maximum reach.',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Early access to new features',
      'Social & influencer shoutouts',
      'Monthly strategy session',
      '5% commission per sale',
    ],
    paystackPlanName: 'Eraiiz Pro Monthly',
  },
];

export function getSellerPlan(planId?: string | null): SellerPlan {
  return SELLER_PLANS.find((plan) => plan.id === planId) || SELLER_PLANS[0];
}

export function sellerShareForPlan(subtotal: number, planId?: string | null): number {
  const percent = getSellerPlan(planId).commissionPercent;
  return Math.round(subtotal - (subtotal * percent) / 100);
}

export function platformShareForPlan(subtotal: number, planId?: string | null): number {
  const percent = getSellerPlan(planId).commissionPercent;
  return Math.round((subtotal * percent) / 100);
}
