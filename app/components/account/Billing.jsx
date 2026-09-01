'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, DollarSign, LayoutGrid, Loader2, Rocket } from 'lucide-react';
import PayoutSetup from '../seller/PayoutSetup';
import PlanPerks from '../seller/PlanPerks';
import {
  cancelSellerPlan,
  fetchSellerPlan,
  initializePlanCheckout,
  openPaystackCheckout,
  verifyPlanCheckout,
} from '../../services/paymentService';
import { showError, showSuccess } from '../../utils/toast';
import { SELLER_PLANS } from '@/lib/sellerPlans';

export default function Billing({ user }) {
  const [currentPlanId, setCurrentPlanId] = useState('commission');
  const [nextPaymentDate, setNextPaymentDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const loadPlan = async () => {
    try {
      const data = await fetchSellerPlan();
      setCurrentPlanId(data.planId || 'commission');
      setNextPaymentDate(data.nextPaymentDate || null);
      if (data.planId) {
        localStorage.setItem('eraiiz_seller_plan', JSON.stringify(data));
      }
    } catch (error) {
      showError(error.message || 'Failed to load billing plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [user?._id]);

  const handleSelectPlan = async (planId) => {
    if (planId === currentPlanId || processingPlanId) return;

    if (planId === 'commission') {
      const confirmed = window.confirm(
        'Switch back to Pay-as-you-sell? Your paid subscription will stop renewing and commission returns to 10%.'
      );
      if (!confirmed) return;

      try {
        setProcessingPlanId(planId);
        await cancelSellerPlan();
        setCurrentPlanId('commission');
        setNextPaymentDate(null);
        showSuccess('You are now on Pay-as-you-sell');
      } catch (error) {
        showError(error.message || 'Could not switch plans');
      } finally {
        setProcessingPlanId(null);
      }
      return;
    }

    try {
      setProcessingPlanId(planId);
      const initialized = await initializePlanCheckout({
        planId,
        email: user?.email,
      });

      await openPaystackCheckout({
        publicKey: initialized.publicKey,
        email: initialized.email,
        amountKobo: initialized.amountKobo,
        reference: initialized.reference,
        accessCode: initialized.accessCode,
        onSuccess: async (transaction) => {
          try {
            const verified = await verifyPlanCheckout({
              reference: transaction.reference || initialized.reference,
              planId,
            });
            setCurrentPlanId(verified.planId || planId);
            setNextPaymentDate(verified.nextPaymentDate || null);
            showSuccess(`${verified.plan?.name || 'Plan'} is now active`);
          } catch (error) {
            showError(error.message || 'Payment succeeded but plan activation failed');
          } finally {
            setProcessingPlanId(null);
          }
        },
        onCancel: () => {
          setProcessingPlanId(null);
          showError('Plan payment cancelled');
        },
      });
    } catch (error) {
      setProcessingPlanId(null);
      showError(error.message || 'Unable to start plan payment');
    }
  };

  const currentPlan = SELLER_PLANS.find((plan) => plan.id === currentPlanId) || SELLER_PLANS[0];

  return (
    <div className="space-y-8">
      <PayoutSetup user={user} />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" /> Billing & Plans
        </h2>
        {isLoading ? (
          <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan...
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-6">
            Current plan: <span className="font-medium text-gray-900">{currentPlan.name}</span>
            {nextPaymentDate && currentPlanId !== 'commission' && (
              <> · Next billing {new Date(nextPaymentDate).toLocaleDateString()}</>
            )}
          </p>
        )}

        <PlanPerks planId={currentPlanId} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {SELLER_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isProcessing = processingPlanId === plan.id;

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
                <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-4">
                  {plan.priceLabel}
                </p>

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
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={Boolean(processingPlanId)}
                    className="mt-6 w-full py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors disabled:opacity-60"
                  >
                    {isProcessing
                      ? 'Processing...'
                      : plan.amountNgn > 0
                        ? `Pay ${plan.priceLabel}`
                        : 'Switch to this plan'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing FAQs</h3>
        <ul className="space-y-3 text-sm text-gray-700 list-disc list-inside">
          <li>Growth and Pro are billed monthly through Paystack. Your plan only changes after payment succeeds.</li>
          <li>Paid plans lower your marketplace commission on each sale (Growth 8%, Pro 5%, Pay-as-you-sell 10%).</li>
          <li>You can switch back to Pay-as-you-sell anytime. The paid subscription will stop renewing.</li>
          <li>Need custom enterprise features? Contact us at <span className="font-medium">projecterraiz@gmail.com</span>.</li>
        </ul>
      </div>
    </div>
  );
}
