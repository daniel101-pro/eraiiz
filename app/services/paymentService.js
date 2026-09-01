const API_BASE = '';

function getStoredPayout() {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (!token || !user) return null;

    const parsedUser = JSON.parse(user);
    const userId = parsedUser._id || parsedUser.id;
    if (!userId) return null;

    const raw = localStorage.getItem(`eraiiz_payout_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storePayoutLocally(payout) {
  if (typeof window === 'undefined') return;

  try {
    const user = localStorage.getItem('user');
    if (!user) return;

    const parsedUser = JSON.parse(user);
    const userId = parsedUser._id || parsedUser.id;
    if (!userId) return;

    localStorage.setItem(`eraiiz_payout_${userId}`, JSON.stringify(payout));
  } catch (error) {
    console.error('Failed to cache payout details locally', error);
  }
}

async function paymentRequest(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Payment request failed');
  }

  return data;
}

export async function fetchBanks() {
  const data = await paymentRequest('/api/payments/banks');
  return data.banks || [];
}

export async function fetchPayoutDetails() {
  try {
    const data = await paymentRequest('/api/payments/subaccount');
    if (data?.subaccountCode) {
      storePayoutLocally(data);
      return data;
    }
  } catch (error) {
    const cached = getStoredPayout();
    if (cached?.subaccountCode) {
      return cached;
    }
    throw error;
  }

  const cached = getStoredPayout();
  return cached || { subaccountCode: null };
}

export async function createSellerSubaccount(payload) {
  const data = await paymentRequest('/api/payments/subaccount', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  storePayoutLocally({
    subaccountCode: data.subaccountCode,
    accountName: data.accountName,
    businessName: data.businessName,
    bankCode: payload.bankCode,
    accountNumber: payload.accountNumber,
  });

  return data;
}

export async function initializeCheckout({ items, billing, callbackUrl }) {
  return paymentRequest('/api/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({ items, billing, callbackUrl }),
  });
}

export async function verifyCheckout({ reference, items, billing }) {
  return paymentRequest('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, items, billing }),
  });
}

export function loadPaystackInline() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Paystack can only load in the browser'));
      return;
    }

    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }

    const existing = document.querySelector('script[data-paystack-inline="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    script.dataset.paystackInline = 'true';
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
}

export async function openPaystackCheckout({
  publicKey,
  email,
  amountKobo,
  reference,
  onSuccess,
  onCancel,
}) {
  const PaystackPop = await loadPaystackInline();
  const popup = new PaystackPop();

  popup.newTransaction({
    key: publicKey,
    email,
    amount: amountKobo,
    reference,
    onSuccess: (transaction) => onSuccess?.(transaction),
    onCancel: () => onCancel?.(),
  });
}
