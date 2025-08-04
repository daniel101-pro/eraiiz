'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/toast';

export default function AccountSettings() {
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get user's preferred currency from localStorage or API
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = async (newCurrency) => {
    setIsLoading(true);
    try {
      // Update currency in backend
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/user/currency`, {
        currency: newCurrency
      });
      
      // Update local storage
      localStorage.setItem('preferredCurrency', newCurrency);
      setCurrency(newCurrency);
      showSuccess('Currency preference updated');
    } catch (error) {
      console.error('Error updating currency:', error);
      showError('Failed to update currency preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Currency Preferences</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            Choose your preferred currency for displaying prices across Eraiiz.
          </p>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            {/* Add more currencies as needed */}
          </select>
          {isLoading && (
            <p className="text-sm text-gray-500">Updating currency preference...</p>
          )}
        </div>
      </div>
      
      {/* Add other account settings sections here */}
    </div>
  );
} 