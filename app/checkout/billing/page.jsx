'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useCurrency } from '../../context/CurrencyContext';
import DualNavbarSell from '../../components/DualNavbarSell';
import { showError } from '../../utils/toast';

const fields = [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { name: 'address', label: 'Address', type: 'text', required: true, fullWidth: true },
  { name: 'city', label: 'City', type: 'text', required: true },
  { name: 'state', label: 'State', type: 'text', required: true },
  { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
];

export default function BillingPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const { billing, updateBilling } = useCheckout();
  const { formatPrice, convertPrice } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const missingField = fields.find((field) => field.required && !billing[field.name]?.trim());
    if (missingField) {
      showError(`Please enter your ${missingField.label.toLowerCase()}`);
      return;
    }

    setIsSubmitting(true);
    router.push('/checkout/payment');
  };

  const orderTotal = cartItems.reduce((total, item) => {
    return total + convertPrice(item.price, item.currency || 'NGN') * (item.quantity || 1);
  }, 0);

  return (
    <>
      <DualNavbarSell />

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-3xl mx-auto">
          <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Cart
          </Link>

          <h2 className="text-2xl font-semibold mb-2">Billing Address</h2>
          <p className="text-gray-600 mb-6">
            Order total: <span className="font-semibold text-green-700">{formatPrice(orderTotal)}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
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
