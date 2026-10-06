const STRIPE_BASE = 'https://api.stripe.com/v1';

export function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

export function isStripeConfigured() {
  return Boolean(stripeSecretKey());
}

async function stripeRequest(path: string, init: RequestInit = {}) {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error('Stripe is not configured');
  }

  const response = await fetch(`${STRIPE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Stripe request failed');
  }
  return data;
}

export type StripeConnectAccount = {
  id: string;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  charges_enabled?: boolean;
  country?: string;
  email?: string;
};

export async function createStripeConnectAccount(input: {
  country: string;
  email?: string;
  sellerId?: string;
}): Promise<StripeConnectAccount> {
  const params = new URLSearchParams({
    type: 'express',
    country: input.country,
    'capabilities[transfers][requested]': 'true',
    'metadata[eraiiz]': 'true',
  });
  if (input.email) params.set('email', input.email);
  if (input.sellerId) params.set('metadata[sellerId]', input.sellerId);
  return stripeRequest('/accounts', { method: 'POST', body: params });
}

export async function createStripeAccountLink(input: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const params = new URLSearchParams({
    account: input.accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: 'account_onboarding',
  });
  return stripeRequest('/account_links', { method: 'POST', body: params }) as Promise<{ url: string }>;
}

export async function retrieveStripeAccount(accountId: string): Promise<StripeConnectAccount> {
  return stripeRequest(`/accounts/${encodeURIComponent(accountId)}`);
}
