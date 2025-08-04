'use client';

import { DollarSign, CheckCircle, Rocket, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    id: 'commission',
    name: 'Pay-as-you-sell',
    price: '10-15% per sale',
    description: 'No upfront cost. We only earn when you do.',
    features: [
      'Unlimited product listings',
      'Standard analytics',
      'Basic support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Subscription',
    price: '$49 / mo',
    description: 'Boost visibility with premium placement & deeper insights.',
    features: [
      'Priority search placement',
      'Enhanced analytics dashboard',
      'Marketing boosts & featured spots',
      'Email / chat support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Subscription',
    price: '$149 / mo',
    description: 'For established eco-brands that want maximum reach.',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Early access to new features',
      'Social & influencer shoutouts',
      'Monthly strategy session',
    ],
  },
];

export default function Billing() {
  const [selected, setSelected] = useState('commission');

  const handleSelect = (id) => setSelected(id);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" /> Billing & Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-xl p-6 transition hover:shadow-lg cursor-pointer ${
                selected === plan.id ? 'border-green-500' : 'border-gray-200'
              }`}
              onClick={() => handleSelect(plan.id)}
            >
              {selected === plan.id && (
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
                    <LayoutGrid className="h-3 w-3 text-green-600" /> {feat}
                  </li>
                ))}
              </ul>

              {selected === plan.id ? (
                <button className="mt-6 w-full py-2 bg-green-600 text-white rounded-lg font-medium shadow hover:bg-green-700 transition-colors">
                  Current Plan
                </button>
              ) : (
                <button className="mt-6 w-full py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors">
                  Choose Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing FAQs</h3>
        <ul className="space-y-3 text-sm text-gray-700 list-disc list-inside">
          <li>No hidden fees – you can switch or cancel subscription plans anytime.</li>
          <li>Commission is automatically deducted before payouts. Subscription fees are billed monthly.</li>
          <li>Need custom enterprise features? Contact us at <span className="font-medium">projecterraiz@gmail.com</span>.</li>
        </ul>
      </div>
    </div>
  );
} 