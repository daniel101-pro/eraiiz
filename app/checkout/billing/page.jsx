'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useCurrency } from '../../context/CurrencyContext';
import DualNavbarSell from '../../components/DualNavbarSell';
import { showError } from '../../utils/toast';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';

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

export default function BillingPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const { billing, updateBilling } = useCheckout();
  const { formatPrice, convertPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const knownFields = useMemo(
    () => fields.filter((field) => hasValue(billing[field.name])),
    [billing]
  );
  const missingFields = useMemo(
    () => fields.filter((field) => !hasValue(billing[field.name])),
    [billing]
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    if (cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems.length, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateBilling({ [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const missingField = fields.find((field) => field.required && !hasValue(billing[field.name]));
    if (missingField) {
      showError(`Please enter your ${missingField.label.toLowerCase()}`);
      return;
    }

    setIsSubmitting(true);
    router.push('/checkout/payment');
  };

  const orderTotal = cartItems.reduce((total, item) => {
    return total + convertPrice(getListingPrice(item), getProductCurrency(item)) * (item.quantity || 1);
  }, 0);

  return (
    <>
      <DualNavbarSell />

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-3xl mx-auto">
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Cart
          </Link>

          <h2 className="text-2xl font-semibold mb-2">
            {missingFields.length === 0 ? 'Confirm billing details' : 'Billing details'}
          </h2>
          <p className="text-gray-600 mb-6">
            Order total: <span className="font-semibold text-green-700">{formatPrice(orderTotal)}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
            {knownFields.length > 0 && (
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-green-900">Using your account</p>
                    <p className="text-xs text-green-800 mt-1">
                      We already have these details, so you don’t need to enter them again.
                    </p>
                  </div>
                  <Link
                    href="/account"
                    className="text-xs font-medium text-green-800 underline underline-offset-2 whitespace-nowrap"
                  >
                    Change in account
                  </Link>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {knownFields.map((field) => (
                    <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                      <dt className="text-gray-500">{field.label}</dt>
                      <dd className="font-medium text-gray-900">{billing[field.name]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {missingFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {missingFields.map((field) => (
                  <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={billing[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Your personal information is complete. Continue to payment when you’re ready.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
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
