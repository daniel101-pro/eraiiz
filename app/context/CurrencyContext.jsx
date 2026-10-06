'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { normalizeCurrencyCode } from '@/lib/productCurrency';
import {
  countryName,
  currencyFromCountry,
  currencyFromLocale,
  parseGeoCookie,
} from '@/lib/geoLocation';

const CurrencyContext = createContext();
const MANUAL_KEY = 'eraiiz_currency_manual';
const PREFERRED_KEY = 'preferredCurrency';

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function initialFromBrowser(fallbackCurrency, fallbackCountry) {
  if (typeof window === 'undefined') {
    return {
      currency: fallbackCurrency || 'USD',
      country: fallbackCountry || '',
      manual: false,
    };
  }
  const manual = localStorage.getItem(MANUAL_KEY) === '1';
  if (manual) {
    return {
      currency: normalizeCurrencyCode(localStorage.getItem(PREFERRED_KEY)) || fallbackCurrency || 'USD',
      country: parseGeoCookie(readCookie('eraiiz_geo'))?.country || fallbackCountry || '',
      manual: true,
    };
  }
  const cookie = parseGeoCookie(readCookie('eraiiz_geo'));
  const localeCurrency = currencyFromLocale(navigator.language);
  return {
    currency:
      cookie?.currency ||
      fallbackCurrency ||
      localeCurrency ||
      'USD',
    country: cookie?.country || fallbackCountry || '',
    manual: false,
  };
}

export function CurrencyProvider({ children, initialCurrency = '', initialCountry = '' }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState(initialCurrency || 'USD');
  const [detectedCountry, setDetectedCountry] = useState(initialCountry || '');
  const [currencyManual, setCurrencyManual] = useState(false);
  const manualRef = useRef(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const started = initialFromBrowser(initialCurrency, initialCountry);
    setDetectedCountry(started.country || initialCountry || '');
    if (started.manual) {
      manualRef.current = true;
      setCurrencyManual(true);
      setSelectedCurrencyState(started.currency);
      return undefined;
    }
    if (started.currency) setSelectedCurrencyState(started.currency);

    let cancelled = false;
    const applyGeo = (country, currency) => {
      if (cancelled || manualRef.current) return;
      const nextCurrency = normalizeCurrencyCode(currency) || currencyFromCountry(country);
      if (country) setDetectedCountry(country);
      if (nextCurrency) setSelectedCurrencyState(nextCurrency);
    };

    fetch('/api/geo')
      .then((response) => (response.ok ? response.json() : null))
      .then(async (data) => {
        if (cancelled || manualRef.current) return;
        if (data?.country) {
          applyGeo(data.country, data.currency);
          return;
        }
        const ip = await fetch('https://ipwho.is/').then((response) => (response.ok ? response.json() : null)).catch(() => null);
        if (ip?.success !== false && ip?.country_code) {
          applyGeo(ip.country_code, currencyFromCountry(ip.country_code));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialCountry, initialCurrency]);

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
        const fallbackRates = {
          USD: 1,
          NGN: 1600,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110,
          CHF: 0.92,
          CAD: 1.25,
          AUD: 1.35,
          CNY: 6.45,
          INR: 75,
        };
        setExchangeRates(fallbackRates);
        setLoading(false);
      }
    };

    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 3600000);

    return () => clearInterval(interval);
  }, []);

  const setSelectedCurrency = useCallback((code) => {
    const next = normalizeCurrencyCode(code) || 'USD';
    setSelectedCurrencyState(next);
    setCurrencyManual(true);
    manualRef.current = true;
    try {
      localStorage.setItem(MANUAL_KEY, '1');
      localStorage.setItem(PREFERRED_KEY, next);
    } catch {
      // ignore
    }
  }, []);

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
    return currencies[currencyCode] || currencies.USD;
  };

  const formatPrice = (price, currencyCode = selectedCurrency) => {
    const { symbol } = getCurrencyInfo(currencyCode);
    const formatOptions = {
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    };
    const formattedNumber = Number(price || 0).toLocaleString(undefined, formatOptions);
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
    detectedCountry,
    detectedCountryName: countryName(detectedCountry),
    currencyManual,
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
