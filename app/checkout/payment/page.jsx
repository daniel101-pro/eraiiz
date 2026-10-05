'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DualNavbarSell from '../../components/DualNavbarSell';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  initializeCheckout,
  openPaystackCheckout,
  verifyCheckout,
} from '../../services/paymentService';
import { showError } from '../../utils/toast';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';
import { buyerOrderNotice, persistInboxItem } from '../../utils/notificationFeed';
import { saveLastOrder } from '../../utils/lastOrder';

export default function PaymentPage() {
  const router = useRouter();
  const { cartItems, enrichedCartItems } = useCart();
  const { billing } = useCheckout();
  const { formatPrice, convertPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentInit, setPaymentInit] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const checkoutItems = enrichedCartItems.length > 0 ? enrichedCartItems : cartItems;

  useEffect(() => {
    if (isCompleting) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    if (checkoutItems.length === 0) {
      router.push('/cart');
      return;
    }

    if (!billing.email || !billing.fullName) {
      router.push('/checkout/billing');
    }
  }, [billing.email, billing.fullName, checkoutItems.length, isCompleting, router]);

  const orderTotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => {
      return total + convertPrice(getListingPrice(item), getProductCurrency(item)) * (item.quantity || 1);
    }, 0);
  }, [checkoutItems, convertPrice]);

  const payloadItems = useMemo(
    () =>
      checkoutItems.map((item) => ({
        _id: item._id,
        name: item.name,
        price: getListingPrice(item),
        currency: getProductCurrency(item),
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize,
        sellerId: item.sellerId,
      })),
    [checkoutItems, convertPrice]
  );

  const handlePay = async () => {
    try {
      setIsProcessing(true);

      const initialized = await initializeCheckout({
        items: payloadItems,
        billing,
        callbackUrl: `${window.location.origin}/checkout/success`,
      });

      setPaymentInit(initialized);
      sessionStorage.setItem('eraiiz_last_checkout_items', JSON.stringify(payloadItems));
      saveLastOrder({
        billing,
        items: payloadItems,
        reference: initialized.reference,
        amount: initialized.amount,
      });

      await openPaystackCheckout({
        publicKey: initialized.publicKey,
        email: initialized.email,
        amountKobo: initialized.amountKobo,
        reference: initialized.reference,
        accessCode: initialized.accessCode,
        onSuccess: (transaction) => {
          const orderReference = transaction.reference || initialized.reference;
          setIsCompleting(true);
          saveLastOrder({
            billing,
            items: payloadItems,
            reference: orderReference,
            amount: initialized.amount,
          });
          persistInboxItem(buyerOrderNotice({ reference: orderReference, items: payloadItems }));
          router.replace(`/checkout/success?reference=${orderReference}&status=success`);
          verifyCheckout({
            reference: orderReference,
            items: payloadItems,
            billing,
          }).catch(() => {});
        },
        onCancel: () => {
          setIsProcessing(false);
          showError('Payment cancelled');
        },
      });
    } catch (error) {
      setIsProcessing(false);
      showError(error.message || 'Unable to start payment');
    }
  };

  return (
    <>
      <DualNavbarSell />

      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-3xl mx-auto">
          <Link href="/checkout/billing" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            ← Back to Billing
          </Link>

          <h2 className="text-2xl font-semibold mb-6">Pay with Paystack</h2>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Items</span>
                <span>{checkoutItems.length}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery address</span>
                <span className="text-right max-w-xs">
                  {billing.fullName}, {billing.city}, {billing.state}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
                <span>Total due</span>
                <span>{formatPrice(paymentInit?.amount || orderTotal)}</span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="font-medium text-gray-900 mb-1">Card, bank transfer, and USSD</p>
              <p className="text-sm text-gray-600">
                You&apos;ll complete payment securely on Paystack. We do not store card details on Eraiiz.
              </p>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-60"
            >
              {isProcessing ? 'Opening Paystack...' : `Pay ${formatPrice(paymentInit?.amount || orderTotal)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
