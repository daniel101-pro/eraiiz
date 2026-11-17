'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getValidAccessToken } from '../utils/auth';
import { profileFromUser } from '@/lib/accountProfile';
import { applyProfileOverlay, cacheMergedUser } from '@/lib/profileOverlay';

const STORAGE_KEY = 'eraiiz_checkout';

const defaultBilling = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const CheckoutContext = createContext(null);

export function mapUserToBilling(user) {
  if (!user) return {};
  const merged = applyProfileOverlay(user) || user;
  const profile = profileFromUser(merged);

  return {
    fullName: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    state: profile.state || '',
    address: profile.houseAddress || '',
    city: profile.city || '',
    postalCode: profile.postalAddress || '',
    country: profile.country || '',
  };
}

export function isBillingComplete(billing) {
  if (!billing) return false;
  return ['fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'].every((key) =>
    Boolean(String(billing[key] || '').trim())
  );
}

function applyProfile(base, profile) {
  const next = { ...defaultBilling, ...base };
  const fromProfile = mapUserToBilling(profile);

  Object.keys(defaultBilling).forEach((key) => {
    const profileValue = String(fromProfile[key] || '').trim();
    if (profileValue) next[key] = profileValue;
  });

  return next;
}

function readSessionBilling() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed?.billing && typeof parsed.billing === 'object' ? parsed.billing : {};
  } catch {
    return {};
  }
}

function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function CheckoutProvider({ children }) {
  const [billing, setBilling] = useState(defaultBilling);
  const [isReady, setIsReady] = useState(false);

  const hydrateFromAccount = useCallback(async () => {
    let billingState = { ...defaultBilling, ...readSessionBilling() };
    billingState = applyProfile(billingState, readLocalUser());

    try {
      const token = await getValidAccessToken();
      if (token) {
        // Use same-origin profile route so accountProfile + cookie extras merge in.
        const res = await fetch('/api/account/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const profile = data?.user && typeof data.user === 'object' ? data.user : data;
          cacheMergedUser(profile);
          billingState = applyProfile(billingState, profile);
        }
      }
    } catch (error) {
      console.error('Failed to load account for checkout', error);
    }

    setBilling(billingState);
    setIsReady(true);
    return billingState;
  }, []);

  useEffect(() => {
    hydrateFromAccount();

    const onAccountUpdated = () => {
      const localUser = readLocalUser();
      setBilling((prev) => applyProfile(prev, localUser));
    };

    const onStorage = (event) => {
      if (event.key === 'user' || (event.key && event.key.startsWith('eraiiz_profile_overlay:'))) {
        onAccountUpdated();
      }
    };

    window.addEventListener('eraiiz:account-updated', onAccountUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('eraiiz:account-updated', onAccountUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [hydrateFromAccount]);

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
      refreshBillingFromAccount: hydrateFromAccount,
      isBillingComplete: () => isBillingComplete(billing),
      isReady,
    }),
    [billing, hydrateFromAccount, isReady]
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
