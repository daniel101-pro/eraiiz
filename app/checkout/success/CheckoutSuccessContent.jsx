'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { Check, MapPin, Package, Phone, Mail } from 'lucide-react';
import DualNavbarSell from '../../components/DualNavbarSell';
import { useCheckout } from '../../context/CheckoutContext';
import { useCurrency } from '../../context/CurrencyContext';
import { verifyCheckout } from '../../services/paymentService';
import { showError } from '../../utils/toast';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';

const LAST_ORDER_KEY = 'eraiiz_last_order';

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveLastOrder(order) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export default function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, clearCheckout } = useCheckout();
  const { formatPrice, convertPrice } = useCurrency();
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const handledRef = useRef(false);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (handledRef.current) return;

    const paymentReference =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      searchParams.get('ref');
    const presetStatus = searchParams.get('status');
    const existing = readLastOrder();

    if (!paymentReference && !existing) {
      setStatus('missing');
      return;
    }

    if (presetStatus === 'success' || existing?.reference) {
      handledRef.current = true;
      const nextOrder = {
        reference: paymentReference || existing?.reference || '',
        amount: existing?.amount ?? null,
        billing: existing?.billing || billing,
        items: existing?.items || [],
      };
      saveLastOrder(nextOrder);
      setOrder(nextOrder);
      setStatus('success');
      clearCheckout();
      sessionStorage.removeItem('eraiiz_last_checkout_items');
      return;
    }

    const storedItems = sessionStorage.getItem('eraiiz_last_checkout_items');
    const items = storedItems ? JSON.parse(storedItems) : existing?.items || [];

    handledRef.current = true;
    verifyCheckout({
      reference: paymentReference,
      items,
      billing,
    })
      .then((result) => {
        const nextOrder = {
          reference: paymentReference,
          amount: result.payment?.amountNgn ?? existing?.amount ?? null,
          billing: existing?.billing || billing,
          items,
        };
        saveLastOrder(nextOrder);
        setOrder(nextOrder);
        setStatus('success');
        clearCheckout();
        sessionStorage.removeItem('eraiiz_last_checkout_items');
      })
      .catch((error) => {
        handledRef.current = false;
        showError(error.message || 'Could not verify payment');
        setStatus('failed');
      });
  }, [billing, clearCheckout, searchParams]);

  const formattedTotal = useMemo(() => {
    if (order?.amount == null) return null;
    return formatPrice(convertPrice(order.amount, 'NGN'));
  }, [convertPrice, formatPrice, order?.amount]);

  const address = order?.billing || {};
  const hasAddress = Boolean(address.fullName || address.address || address.city);

  return (
    <>
      <DualNavbarSell />

      {status === 'success' && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={180}
          recycle={false}
          gravity={0.12}
          colors={['#16a34a', '#22c55e', '#86efac', '#bbf7d0', '#facc15']}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
        <div className="container mx-auto px-4 py-8 pt-32">
          <div className="max-w-2xl mx-auto">
            {status === 'loading' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
                <div className="mx-auto mb-4 w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                <h1 className="text-2xl font-semibold mb-2">Confirming your payment</h1>
                <p className="text-gray-600">Just a moment.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    className="mx-auto mb-5 w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center"
                  >
                    <Check className="w-10 h-10" strokeWidth={2.5} />
                  </motion.div>
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">You&apos;re all set</h1>
                  <p className="text-gray-600">
                    Your order is confirmed. We&apos;ll get it ready for delivery.
                  </p>
                  {order?.reference && (
                    <p className="mt-4 text-sm text-gray-500">
                      Reference <span className="font-medium text-gray-800">{order.reference}</span>
                    </p>
                  )}
                  {formattedTotal && (
                    <p className="mt-1 text-lg font-semibold text-green-700">{formattedTotal}</p>
                  )}
                </motion.div>

                {hasAddress && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Delivering to</h2>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-800 leading-relaxed">
                      {address.fullName && <p className="font-medium text-gray-900">{address.fullName}</p>}
                      {address.address && <p>{address.address}</p>}
                      <p>
                        {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
                      </p>
                      <div className="mt-3 space-y-1 text-gray-600">
                        {address.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {address.phone}
                          </p>
                        )}
                        {address.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {address.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {order?.items?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Order items</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <li key={`${item._id}-${item.selectedSize}`} className="py-3 flex justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Qty {item.quantity || 1}
                              {item.selectedSize ? ` · Size ${item.selectedSize}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {formatPrice(
                              convertPrice(getListingPrice(item), getProductCurrency(item)) * (item.quantity || 1)
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/account?section=Orders"
                    className="flex-1 text-center px-5 py-3 rounded-2xl bg-green-600 text-white hover:bg-green-700 font-medium"
                  >
                    View orders
                  </Link>
                  <Link
                    href="/for-you"
                    className="flex-1 text-center px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            )}

            {(status === 'failed' || status === 'missing') && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <h1 className="text-2xl font-semibold mb-2">Payment not confirmed</h1>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t confirm this payment yet. If you were charged, check Orders or try again.
                </p>
                <button
                  onClick={() => router.push('/checkout/payment')}
                  className="px-5 py-3 rounded-2xl bg-green-600 text-white hover:bg-green-700"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
