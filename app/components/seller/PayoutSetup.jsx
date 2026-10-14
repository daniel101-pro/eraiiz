'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle, CreditCard, Globe } from 'lucide-react';
import CrazyLoader from '../CrazyLoader';
import {
  createSellerSubaccount,
  fetchBanks,
  fetchPayoutDetails,
  startStripeConnect,
} from '../../services/paymentService';
import { showError, showSuccess } from '../../utils/toast';
import {
  ALL_PAYOUT_COUNTRIES,
  countryName,
  payoutProviderForCountry,
} from '@/lib/geoLocation';
import { useCurrency } from '../../context/CurrencyContext';

function isConnected(payout) {
  if (!payout) return false;
  if (payout.subaccountCode) return true;
  if (payout.stripeAccountId && payout.stripeDetailsSubmitted) return true;
  return false;
}

export default function PayoutSetup({ user }) {
  const { detectedCountry } = useCurrency();
  const [banks, setBanks] = useState([]);
  const [existing, setExisting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [country, setCountry] = useState('');
  const [form, setForm] = useState({
    businessName: user?.name || '',
    bankCode: '',
    accountNumber: '',
  });

  const provider = country ? payoutProviderForCountry(country) : null;

  useEffect(() => {
    const cached = typeof window !== 'undefined'
      ? (() => {
          try {
            const keys = Object.keys(localStorage).filter((key) => key.startsWith('eraiiz_payout_'));
            for (const key of keys) {
              const parsed = JSON.parse(localStorage.getItem(key) || 'null');
              if (isConnected(parsed) || parsed?.stripeAccountId) return parsed;
            }
            return null;
          } catch {
            return null;
          }
        })()
      : null;

    if (cached) {
      setExisting(cached);
      if (cached.country) setCountry(cached.country);
    }

    const load = async () => {
      try {
        const stripeParam = new URLSearchParams(window.location.search).get('stripe');
        const [payoutDetails, geo] = await Promise.all([
          fetchPayoutDetails(),
          fetch('/api/geo').then((response) => (response.ok ? response.json() : null)).catch(() => null),
        ]);

        if (payoutDetails) {
          setExisting(payoutDetails);
          if (payoutDetails.country) setCountry(payoutDetails.country);
          if (payoutDetails.businessName) {
            setForm((prev) => ({
              ...prev,
              businessName: payoutDetails.businessName,
              bankCode: payoutDetails.bankCode || prev.bankCode,
              accountNumber: payoutDetails.accountNumber || prev.accountNumber,
            }));
          }
        }

        const nextCountry = payoutDetails?.country || geo?.country || detectedCountry || '';
        if (nextCountry) setCountry((prev) => prev || nextCountry);

        if (stripeParam === 'return' || stripeParam === 'refresh') {
          const stripeStatus = await fetch('/api/payments/stripe/connect', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
            },
          }).then((response) => (response.ok ? response.json() : null)).catch(() => null);
          if (stripeStatus) {
            setExisting((prev) => ({ ...(prev || {}), ...stripeStatus }));
            if (stripeStatus.country) setCountry(stripeStatus.country);
          }
          if (stripeParam === 'refresh' && !stripeStatus?.connected) {
            setIsSubmitting(true);
            const started = await startStripeConnect(nextCountry || country || 'GB');
            if (started?.url) {
              window.location.assign(started.url);
              return;
            }
            setIsSubmitting(false);
          }
        }
      } catch (error) {
        showError(error.message || 'Failed to load payout setup');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.name, detectedCountry]);

  useEffect(() => {
    if (provider !== 'paystack' || !country) return undefined;
    let cancelled = false;
    fetchBanks(country)
      .then((bankList) => {
        if (!cancelled) setBanks(bankList);
      })
      .catch(() => {
        if (!cancelled) setBanks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, country]);

  const countryOptions = useMemo(() => {
    const selected = country && !ALL_PAYOUT_COUNTRIES.some((item) => item.code === country)
      ? [{ code: country, name: countryName(country) || country }, ...ALL_PAYOUT_COUNTRIES]
      : ALL_PAYOUT_COUNTRIES;
    return selected;
  }, [country]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaystackSubmit = async (event) => {
    event.preventDefault();

    if (!form.businessName || !form.bankCode || !form.accountNumber) {
      showError('Please complete all payout fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createSellerSubaccount({ ...form, country });
      setExisting({
        provider: 'paystack',
        country,
        subaccountCode: result.subaccountCode,
        accountName: result.accountName,
        businessName: result.businessName,
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
      });
      showSuccess('Payout account connected');
    } catch (error) {
      showError(error.message || 'Failed to connect payout account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeConnect = async () => {
    if (!country) {
      const message = 'Choose your country first';
      setSetupError(message);
      showError(message);
      return;
    }
    try {
      setSetupError('');
      setIsSubmitting(true);
      const result = await startStripeConnect(country);
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      const message = 'We could not open payout setup. Try again.';
      setSetupError(message);
      showError(message);
      setIsSubmitting(false);
    } catch (error) {
      const message =
        error.message || 'We could not set up payouts. Try again, or contact Eraiiz support.';
      setSetupError(message);
      showError(message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CrazyLoader title="Loading payouts" subtitle="Fetching your payout setup" />
    );
  }

  const connected = isConnected(existing);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {isSubmitting ? (
        <CrazyLoader
          fullscreen
          title={provider === 'paystack' ? 'Connecting bank' : 'Connecting Stripe'}
          subtitle="Do not close this tab"
        />
      ) : null}
      <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-green-600" />
        Payout setup
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose your country first. African sellers get paid with Paystack. Everyone else uses Stripe.
      </p>

      {connected ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Payout account connected</p>
              <p className="text-sm text-green-800 mt-1">
                {[
                  existing.country ? countryName(existing.country) : '',
                  existing.provider === 'stripe' ? 'Stripe' : 'Paystack',
                  existing.businessName || existing.accountName,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {existing.accountNumber ? (
                <p className="text-sm text-green-800">
                  Account ending in {String(existing.accountNumber).slice(-4)}
                </p>
              ) : existing.stripeAccountId ? (
                <p className="text-sm text-green-800 mt-1">
                  {existing.stripePayoutsEnabled
                    ? 'Stripe payouts are enabled.'
                    : 'Stripe account connected. Payouts turn on after Stripe finishes reviewing your details.'}
                </p>
              ) : (
                <p className="text-sm text-green-800 mt-1">
                  Your payout account is connected.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={country}
                onChange={(event) => {
                  setSetupError('');
                  setCountry(event.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Select country</option>
                {countryOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {provider && (
            <p className="text-sm text-gray-600">
              {provider === 'paystack'
                ? 'Paystack will be used for payouts in this country.'
                : 'Stripe will be used for payouts in this country.'}
            </p>
          )}

          {existing?.stripeAccountId && !existing?.stripeDetailsSubmitted && provider === 'stripe' && (
            <p className="text-sm text-amber-700">Finish Stripe onboarding to enable payouts.</p>
          )}

          {provider === 'paystack' && (
            <form onSubmit={handlePaystackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Registered business name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank
                </label>
                <select
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  maxLength={country === 'NG' ? 10 : 20}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder={country === 'NG' ? '10-digit account number' : 'Bank account number'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Connecting…' : 'Connect payout account'}
              </button>
            </form>
          )}

          {provider === 'stripe' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStripeConnect}
                className="w-full sm:w-auto px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Opening Stripe...' : existing?.stripeAccountId ? 'Continue Stripe setup' : 'Connect with Stripe'}
              </button>
              {setupError ? <p className="text-sm text-red-700">{setupError}</p> : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
