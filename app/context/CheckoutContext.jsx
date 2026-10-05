'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getValidAccessToken } from '../utils/auth';

const STORAGE_KEY = 'eraiiz_checkout';

const defaultBilling = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
};

const CheckoutContext = createContext(null);

function mapUserToBilling(user) {
  if (!user) return {};

  return {
    fullName: user.name || user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    state: user.state || '',
    address: user.billingAddress?.houseAddress || user.address || '',
    city: user.billingAddress?.city || '',
    postalCode: user.billingAddress?.postalAddress || user.postalCode || '',
  };
}

function mergeBilling(base, profile) {
  const next = { ...defaultBilling, ...base };
  const fromProfile = mapUserToBilling(profile);

  Object.keys(defaultBilling).forEach((key) => {
    if (!String(next[key] || '').trim() && fromProfile[key]) {
      next[key] = fromProfile[key];
    }
  });

  return next;
}

export function CheckoutProvider({ children }) {
  const [billing, setBilling] = useState(defaultBilling);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      let billingState = { ...defaultBilling };

      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.billing) {
            billingState = { ...defaultBilling, ...parsed.billing };
          }
        }
      } catch (error) {
        console.error('Failed to restore checkout state', error);
      }

      try {
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');
        billingState = mergeBilling(billingState, localUser);
      } catch (error) {
        console.error('Failed to read saved account', error);
      }

      try {
        const token = await getValidAccessToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (token && apiUrl) {
          const res = await fetch(`${apiUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          });
          if (res.ok) {
            const user = await res.json();
            localStorage.setItem('user', JSON.stringify(user));
            billingState = mergeBilling(billingState, user);
          }
        }
      } catch (error) {
        console.error('Failed to load account for checkout', error);
      }

      setBilling(billingState);
      setIsReady(true);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ billing }));
  }, [billing, isReady]);

  const value = useMemo(
    () => ({
      billing,
      setBilling,
      updateBilling: (updates) => setBilling((prev) => ({ ...prev, ...updates })),
      clearCheckout: () => {
        setBilling(defaultBilling);
        sessionStorage.removeItem(STORAGE_KEY);
      },
      isReady,
    }),
    [billing, isReady]
  );

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
