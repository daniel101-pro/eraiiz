'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

export function CheckoutProvider({ children }) {
  const [billing, setBilling] = useState(defaultBilling);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.billing) {
          setBilling(parsed.billing);
        }
      } else {
        const user = localStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setBilling((prev) => ({
            ...prev,
            fullName: parsedUser.name || prev.fullName,
            email: parsedUser.email || prev.email,
            phone: parsedUser.phone || prev.phone,
            state: parsedUser.state || prev.state,
            address: parsedUser.billingAddress?.houseAddress || prev.address,
            city: parsedUser.billingAddress?.city || prev.city,
            postalCode: parsedUser.billingAddress?.postalAddress || prev.postalCode,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to restore checkout state', error);
    } finally {
      setIsReady(true);
    }
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
