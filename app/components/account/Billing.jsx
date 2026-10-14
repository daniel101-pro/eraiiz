'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

function planActionLabel(plan, currentPlanId, isProcessing) {
  if (isProcessing) return '…';
  if (plan.id === currentPlanId) return 'Current';
  if (plan.amountNgn > 0 && currentPlanId === 'commission') return 'Upgrade';
  if (plan.amountNgn > 0) return 'Switch';
  return 'Downgrade';
}

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
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    const returnedPlan = params.get('plan');

    const finishReturn = async () => {
      if (params.get('billing') === 'success' && reference) {
        try {
          setIsLoading(true);
          const verified = await verifyPlanCheckout({
            reference,
            planId: returnedPlan,
          });
          setCurrentPlanId(verified.planId || returnedPlan || 'commission');
          setNextPaymentDate(verified.nextPaymentDate || null);
          showSuccess(`${verified.plan?.name || 'Plan'} is now active`);
        } catch (error) {
          showError(error.message || 'Could not confirm plan payment');
          await loadPlan();
        } finally {
          setIsLoading(false);
          window.history.replaceState({}, '', '/account?section=Billing');
        }
        return;
      }

      await loadPlan();
    };

    finishReturn();
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
    <div className="min-w-0 max-w-3xl space-y-8 text-green-950">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isLoading
            ? 'Loading plan…'
            : `${currentPlan.name} · ${currentPlan.commissionPercent}% commission${
                nextPaymentDate && currentPlanId !== 'commission'
                  ? ` · renews ${new Date(nextPaymentDate).toLocaleDateString()}`
                  : ''
              }`}
        </p>
        {!isLoading ? <PlanPerks planId={currentPlanId} /> : null}
      </div>

      <PayoutSetup user={user} />

      <section>
        <h2 className="text-base font-semibold">Change plan</h2>
        <div className="mt-3 divide-y divide-gray-200 border-y border-gray-200">
          {SELLER_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {plan.name}
                    {isCurrent ? <span className="ml-2 text-sm font-normal text-gray-500">Current</span> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {plan.priceLabel} · {plan.commissionPercent}% commission
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || Boolean(processingPlanId)}
                  className={`shrink-0 px-4 py-2 text-sm font-semibold ${
                    isCurrent
                      ? 'text-gray-400'
                      : 'bg-green-900 text-white hover:bg-green-800 disabled:bg-gray-300'
                  }`}
                >
                  {planActionLabel(plan, currentPlanId, isProcessing)}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Questions?{' '}
          <Link href="/contact" className="underline hover:text-green-950">
            Contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
