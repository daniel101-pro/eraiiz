'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import PayoutSetup from '../seller/PayoutSetup';
import PlanPerks from '../seller/PlanPerks';
import CrazyLoader from '../CrazyLoader';
import {
  cancelSellerPlan,
  fetchSellerPlan,
  initializePlanCheckout,
  openPaystackCheckout,
  verifyPlanCheckout,
} from '../../services/paymentService';
import { showError, showSuccess } from '../../utils/toast';
import { SELLER_PLANS } from '@/lib/sellerPlans';

const billingFaqs = [
  {
    q: 'When does my plan change?',
    a: 'Growth and Pro activate after Paystack confirms payment. Commission drops on the next sale.',
  },
  {
    q: 'What commission do I pay?',
    a: 'Pay-as-you-sell is 10% per sale. Growth is 8%. Pro is 5%.',
  },
  {
    q: 'Can I go back to Pay-as-you-sell?',
    a: 'Yes. Paid billing stops renewing and new sales use 10% commission.',
  },
];

function planActionLabel(plan, currentPlanId, isProcessing) {
  if (isProcessing) return 'Processing…';
  if (plan.id === currentPlanId) return 'Current plan';
  if (plan.amountNgn > 0 && currentPlanId === 'commission') return `Upgrade · ${plan.priceLabel}`;
  if (plan.amountNgn > 0) return `Switch · ${plan.priceLabel}`;
  return 'Switch to Pay-as-you-sell';
}

export default function Billing({ user }) {
  const [currentPlanId, setCurrentPlanId] = useState('commission');
  const [nextPaymentDate, setNextPaymentDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

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
    <div className="space-y-16 bg-white text-green-950">
      <div>
        <p className="text-sm font-medium text-green-800">Seller</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Payouts, plan, and commission. Paid plans activate after payment succeeds.
        </p>
      </div>

      <PayoutSetup user={user} />

      <section>
        <h2 className="text-lg font-semibold">Plan</h2>
        {isLoading ? (
          <CrazyLoader />
        ) : (
          <>
            <div className="mt-4 border border-gray-200 px-4 py-4">
              <p className="text-sm text-gray-500">Current</p>
              <p className="mt-1 text-xl font-semibold">{currentPlan.name}</p>
              <p className="mt-1 text-sm text-gray-600">
                {currentPlan.commissionPercent}% commission
                {nextPaymentDate && currentPlanId !== 'commission' ? (
                  <> · Next billing {new Date(nextPaymentDate).toLocaleDateString()}</>
                ) : null}
              </p>
            </div>

            <div className="mt-6">
              <PlanPerks planId={currentPlanId} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {SELLER_PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isProcessing = processingPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`border p-5 ${isCurrent ? 'border-green-900' : 'border-gray-200'}`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {isCurrent ? 'Current' : plan.amountNgn > 0 ? 'Upgrade' : 'Free'}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                    <p className="mt-4 text-base font-semibold">{plan.priceLabel}</p>
                    <p className="text-sm text-gray-500">{plan.commissionPercent}% per sale</p>

                    <ul className="mt-4 space-y-2 text-sm text-gray-700">
                      {plan.features.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || Boolean(processingPlanId)}
                      className={`mt-6 w-full px-4 py-3 text-sm font-semibold ${
                        isCurrent
                          ? 'border border-gray-200 text-gray-400'
                          : 'bg-green-900 text-white hover:bg-green-800 disabled:bg-gray-300'
                      }`}
                    >
                      {planActionLabel(plan, currentPlanId, isProcessing)}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Questions</h2>
        <div className="mt-4 border-t border-gray-200">
          {billingFaqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div key={faq.q} className="border-b border-gray-200">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-base font-medium">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? <p className="pb-4 text-sm leading-relaxed text-gray-600">{faq.a}</p> : null}
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-gray-600">
          Need a custom plan?{' '}
          <Link href="/contact" className="font-medium text-green-900 underline hover:text-green-950">
            Contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
