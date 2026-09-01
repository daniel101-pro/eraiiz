'use client';

import { DollarSign, CheckCircle, Rocket, LayoutGrid, Sparkles } from 'lucide-react';
import PayoutSetup from '../seller/PayoutSetup';

const plans = [
  {
    id: 'commission',
    name: 'Pay-as-you-sell',
    price: '10% per sale',
    description: 'Default plan. No upfront cost — we only earn when you do.',
    features: [
      'Unlimited product listings',
      'Standard analytics',
      'Basic support',
    ],
    available: true,
  },
  {
    id: 'growth',
    name: 'Growth Subscription',
    price: '₦49,000 / mo',
    description: 'Premium placement and deeper seller insights.',
    features: [
      'Priority search placement',
      'Enhanced analytics dashboard',
      'Marketing boosts & featured spots',
      'Email / chat support',
    ],
    available: false,
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    price: '₦149,000 / mo',
    description: 'For established eco-brands that want maximum reach.',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Early access to new features',
      'Social & influencer shoutouts',
      'Monthly strategy session',
    ],
    available: false,
  },
];

export default function Billing({ user }) {
  const currentPlanId = 'commission';

  return (
    <div className="space-y-8">
      <PayoutSetup user={user} />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" /> Billing & Plans
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Your current plan is <span className="font-medium text-gray-900">Pay-as-you-sell</span>.
          Paid subscriptions are coming soon.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;

            return (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-6 transition ${
                  isCurrent ? 'border-green-500 shadow-sm' : 'border-gray-200'
                }`}
              >
                {isCurrent && (
                  <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-green-600" />
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {plan.name}
                  {plan.id === 'pro' && <Rocket className="h-4 w-4 text-purple-600" />}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-4">{plan.price}</p>

                <ul className="space-y-1 text-sm text-gray-700">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3 text-green-600 shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full py-2 bg-green-600 text-white rounded-lg font-medium opacity-90 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <a
                    href="mailto:projecterraiz@gmail.com?subject=Eraiiz%20Plan%20Upgrade%20Interest"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Coming Soon
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing FAQs</h3>
        <ul className="space-y-3 text-sm text-gray-700 list-disc list-inside">
          <li>Commission is automatically deducted during Paystack split payments at checkout.</li>
          <li>Paid subscription upgrades will require checkout before they become active.</li>
          <li>Need custom enterprise features? Contact us at <span className="font-medium">projecterraiz@gmail.com</span>.</li>
        </ul>
      </div>
    </div>
  );
}
