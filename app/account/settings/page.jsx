'use client';
import { useCurrency } from '../../context/CurrencyContext';

export default function AccountSettings() {
  const { selectedCurrency, setSelectedCurrency, detectedCountryName, currencyManual } = useCurrency();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Currency Preferences</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            {currencyManual
              ? 'Prices use the currency you chose.'
              : detectedCountryName
                ? `Prices are shown in ${selectedCurrency} based on ${detectedCountryName}. Change it anytime.`
                : 'Choose your preferred currency for displaying prices across Eraiiz.'}
          </p>
          <select
            value={selectedCurrency}
            onChange={(event) => setSelectedCurrency(event.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="INR">INR - Indian Rupee</option>
          </select>
        </div>
      </div>
    </div>
  );
}
