'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { normalizeCurrencyCode } from '@/lib/productCurrency';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  // Save currency preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferredCurrency', selectedCurrency);
  }, [selectedCurrency]);

  // Fetch exchange rates on mount and every hour
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const data = await response.json();
        setExchangeRates(data.rates);
        setLastUpdated(new Date().toISOString());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback rates if API fails
        const fallbackRates = {
          USD: 1,
          NGN: 800,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110,
          CHF: 0.92,
          CAD: 1.25,
          AUD: 1.35,
          CNY: 6.45,
          INR: 75
        };
        setExchangeRates(fallbackRates);
        setLoading(false);
      }
    };

    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  // Convert price from any currency to selected currency
  const convertPrice = useCallback((price, fromCurrency = 'NGN') => {
    const numericPrice = Number(price);
    if (!exchangeRates || !numericPrice || Number.isNaN(numericPrice)) return numericPrice || 0;

    const sourceCurrency = normalizeCurrencyCode(fromCurrency) || 'NGN';
    const targetCurrency = normalizeCurrencyCode(selectedCurrency) || 'NGN';

    if (sourceCurrency === targetCurrency) return numericPrice;

    if (!exchangeRates[sourceCurrency] || !exchangeRates[targetCurrency]) {
      return numericPrice;
    }

    const priceInUSD = sourceCurrency === 'USD'
      ? numericPrice
      : numericPrice / exchangeRates[sourceCurrency];

    if (targetCurrency === 'USD') return Number(priceInUSD.toFixed(2));

    const convertedPrice = priceInUSD * exchangeRates[targetCurrency];
    return Number(convertedPrice.toFixed(2));
  }, [exchangeRates, selectedCurrency]);

  // Convert price with explicit from/to currencies
  const convertPriceExplicit = useCallback((price, fromCurrency, toCurrency) => {
    const numericPrice = Number(price);
    if (!exchangeRates || !numericPrice || Number.isNaN(numericPrice)) return numericPrice || 0;

    const sourceCurrency = normalizeCurrencyCode(fromCurrency) || 'NGN';
    const targetCurrency = normalizeCurrencyCode(toCurrency) || 'NGN';

    if (sourceCurrency === targetCurrency) return numericPrice;

    if (!exchangeRates[sourceCurrency] || !exchangeRates[targetCurrency]) {
      return numericPrice;
    }

    const priceInUSD = sourceCurrency === 'USD'
      ? numericPrice
      : numericPrice / exchangeRates[sourceCurrency];

    const convertedPrice = priceInUSD * exchangeRates[targetCurrency];
    return Number(convertedPrice.toFixed(2));
  }, [exchangeRates]);

  // Get currency info
  const getCurrencyInfo = (currencyCode = selectedCurrency) => {
    const currencies = {
      NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
      USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
      EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
      GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
      JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
      CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
      CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
      AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
      CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
      INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    };
    return currencies[currencyCode] || currencies.NGN;
  };

  // Format price with currency symbol
  const formatPrice = (price, currencyCode = selectedCurrency) => {
    const { symbol } = getCurrencyInfo(currencyCode);
    
    // Handle different formatting for different currencies
    const formatOptions = {
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    };

    const formattedNumber = price.toLocaleString(undefined, formatOptions);
    return `${symbol}${formattedNumber}`;
  };

  const value = {
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    convertPriceExplicit,
    formatPrice,
    getCurrencyInfo,
    exchangeRates,
    lastUpdated,
    loading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 