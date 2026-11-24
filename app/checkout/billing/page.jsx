'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { isBillingComplete, useCheckout } from '../../context/CheckoutContext';
import { useCurrency } from '../../context/CurrencyContext';
import DualNavbarSell from '../../components/DualNavbarSell';
import { showError } from '../../utils/toast';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';
import { hasUsableSession } from '../../utils/auth';

const fields = [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { name: 'address', label: 'Address', type: 'text', required: true, fullWidth: true },
  { name: 'city', label: 'City', type: 'text', required: true },
  { name: 'state', label: 'State', type: 'text', required: true },
  { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
];

const hasValue = (value) => Boolean(String(value || '').trim());

async function maybeJoinMailingList(billing) {
  if (!billing?.marketingOptIn || !billing?.email) return;
  try {
    await fetch('/api/mailing-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: billing.email,
        name: billing.fullName,
        phone: billing.phone,
        source: 'checkout',
        optedIn: true,
      }),
    });
  } catch {
    // checkout should still continue if marketing signup fails
  }
}

export default function BillingPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const { billing, updateBilling, refreshBillingFromAccount, isReady } = useCheckout();
  const { formatPrice, convertPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const skippedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const signedIn = hasUsableSession();
      setIsSignedIn(signedIn);

      if (cartItems.length === 0) {
        router.push('/cart');
        return;
      }

      const nextBilling = (await refreshBillingFromAccount?.()) || billing;
      if (cancelled) return;

      // Signed-in shoppers with a full saved address can skip to payment.
      if (signedIn && !skippedRef.current && isBillingComplete(nextBilling)) {
        skippedRef.current = true;
        router.replace('/checkout/payment');
        return;
      }

      setIsHydrating(false);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [cartItems.length, refreshBillingFromAccount, router]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    updateBilling({ [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const missingField = fields.find((field) => field.required && !hasValue(billing[field.name]));
    if (missingField) {
      showError(`Please enter your ${missingField.label.toLowerCase()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await maybeJoinMailingList(billing);

      const token = localStorage.getItem('accessToken');
      if (token) {
        const currentRes = await fetch('/api/account/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const currentData = await currentRes.json().catch(() => ({}));
        const current = currentData.profile || {};

        const profileUpdate = {
          ...current,
          name: billing.fullName || current.name,
          email: billing.email || current.email,
          phone: billing.phone || current.phone,
          state: billing.state || current.state,
          houseAddress: billing.address || current.houseAddress,
          city: billing.city || current.city,
          postalAddress: billing.postalCode || current.postalAddress,
        };

        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile: profileUpdate }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.user) {
          const { saveProfileLocally } = await import('@/lib/profileOverlay');
          saveProfileLocally(data.user, profileUpdate);
          window.dispatchEvent(new Event('eraiiz:account-updated'));
        }
      }
    } catch (error) {
      console.error('Failed to persist billing to account', error);
    }
    router.push('/checkout/payment');
  };

  const orderTotal = cartItems.reduce((total, item) => {
    return total + convertPrice(getListingPrice(item), getProductCurrency(item)) * (item.quantity || 1);
  }, 0);

  if (!isReady || isHydrating) {
    return (
      <>
        <DualNavbarSell />
        <div className="flex min-h-[50vh] items-center justify-center pt-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <DualNavbarSell />

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-3xl mx-auto">
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Cart
          </Link>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
              {isSignedIn ? 'Checkout' : 'Guest checkout'}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-gray-900">Billing details</h2>
            <p className="mt-1 text-gray-600">
              Order total:{' '}
              <span className="font-semibold text-green-700">{formatPrice(orderTotal)}</span>
            </p>
            {!isSignedIn ? (
              <p className="mt-2 text-sm text-gray-500">
                No account needed — fill in your details to pay.{' '}
                <Link
                  href={`/login?next=${encodeURIComponent('/checkout/billing')}`}
                  className="font-medium text-green-700 hover:underline"
                >
                  Sign in
                </Link>{' '}
                if you already shop with Eraiiz.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={billing[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-green-100 bg-green-50/70 px-4 py-3">
              <input
                type="checkbox"
                name="marketingOptIn"
                checked={Boolean(billing.marketingOptIn)}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Email me deals, drops, and eco promotions
                </span>
                <span className="mt-0.5 block text-xs text-gray-600">
                  Get early access to recycled finds and exclusive offers. Unsubscribe anytime.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {isSignedIn ? (
                <Link href="/account" className="text-sm text-green-700 hover:underline">
                  Update in account
                </Link>
              ) : (
                <Link
                  href={`/signup?next=${encodeURIComponent('/checkout/billing')}`}
                  className="text-sm text-gray-500 hover:text-green-700 hover:underline"
                >
                  Create an account after checkout
                </Link>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:opacity-60"
              >
                Continue to Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
