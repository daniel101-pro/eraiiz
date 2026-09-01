'use client';

import { useEffect, useState } from 'react';
import { Building2, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import {
  createSellerSubaccount,
  fetchBanks,
  fetchPayoutDetails,
} from '../../services/paymentService';
import { showError, showSuccess } from '../../utils/toast';

export default function PayoutSetup({ user }) {
  const [banks, setBanks] = useState([]);
  const [existing, setExisting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: user?.name || '',
    bankCode: '',
    accountNumber: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [bankList, payoutDetails] = await Promise.all([
          fetchBanks(),
          fetchPayoutDetails(),
        ]);
        setBanks(bankList);
        setExisting(payoutDetails?.subaccountCode ? payoutDetails : null);
        if (payoutDetails?.businessName) {
          setForm((prev) => ({
            ...prev,
            businessName: payoutDetails.businessName,
            bankCode: payoutDetails.bankCode || prev.bankCode,
            accountNumber: payoutDetails.accountNumber || prev.accountNumber,
          }));
        }
      } catch (error) {
        showError(error.message || 'Failed to load payout setup');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.name]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.businessName || !form.bankCode || !form.accountNumber) {
      showError('Please complete all payout fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createSellerSubaccount(form);
      setExisting({
        subaccountCode: result.subaccountCode,
        accountName: result.accountName,
        businessName: result.businessName,
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
      });
      showSuccess('Payout account connected with Paystack');
    } catch (error) {
      showError(error.message || 'Failed to connect payout account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading payout setup...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-green-600" />
        Paystack Payout Setup
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Connect the corporate bank account where your marketplace earnings should be settled.
        Paystack will split each sale automatically and send your share directly to this account.
      </p>

      {existing?.subaccountCode ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Payout account connected</p>
              <p className="text-sm text-green-800 mt-1">
                {existing.businessName} · {existing.accountName}
              </p>
              <p className="text-sm text-green-800">
                Account ending in {String(existing.accountNumber).slice(-4)}
              </p>
              <p className="text-xs text-green-700 mt-2">
                Subaccount: {existing.subaccountCode}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="10-digit account number"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Connecting account...' : 'Connect payout account'}
          </button>
        </form>
      )}
    </div>
  );
}
