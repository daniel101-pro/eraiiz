'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DualNavbarSell from '../../components/DualNavbarSell';
import { useCheckout } from '../../context/CheckoutContext';
import { verifyCheckout } from '../../services/paymentService';
import { showError } from '../../utils/toast';

export default function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, clearCheckout } = useCheckout();
  const [status, setStatus] = useState('loading');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    const paymentReference =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      searchParams.get('ref');
    const presetStatus = searchParams.get('status');

    if (!paymentReference) {
      setStatus('missing');
      return;
    }

    setReference(paymentReference);

    if (presetStatus === 'success') {
      setStatus('success');
      clearCheckout();
      sessionStorage.removeItem('eraiiz_last_checkout_items');
      return;
    }

    const storedItems = sessionStorage.getItem('eraiiz_last_checkout_items');
    const items = storedItems ? JSON.parse(storedItems) : [];

    verifyCheckout({
      reference: paymentReference,
      items,
      billing,
    })
      .then((result) => {
        setAmount(result.payment?.amountNgn ?? null);
        setStatus('success');
        clearCheckout();
        sessionStorage.removeItem('eraiiz_last_checkout_items');
      })
      .catch((error) => {
        showError(error.message || 'Could not verify payment');
        setStatus('failed');
      });
  }, [billing, clearCheckout, searchParams]);

  return (
    <>
      <DualNavbarSell />

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              <h1 className="text-2xl font-semibold mb-2">Confirming your payment</h1>
              <p className="text-gray-600">Please wait while we verify your Paystack transaction.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl">
                ✓
              </div>
              <h1 className="text-2xl font-semibold mb-2">Payment successful</h1>
              <p className="text-gray-600 mb-4">
                Reference: <span className="font-medium">{reference}</span>
              </p>
              {amount !== null && (
                <p className="text-gray-600 mb-6">Amount paid: ₦{amount.toLocaleString()}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/account" className="px-5 py-3 rounded-md bg-green-600 text-white hover:bg-green-700">
                  View Orders
                </Link>
                <Link href="/" className="px-5 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Continue Shopping
                </Link>
              </div>
            </>
          )}

          {(status === 'failed' || status === 'missing') && (
            <>
              <h1 className="text-2xl font-semibold mb-2">Payment not confirmed</h1>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t verify this payment yet. If you were charged, contact support with your reference.
              </p>
              <button
                onClick={() => router.push('/checkout/payment')}
                className="px-5 py-3 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
