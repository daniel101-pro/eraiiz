import { countryName } from '@/lib/geoLocation';

const STRIPE_BASE = 'https://api.stripe.com/v1';

export class StripeConnectError extends Error {
  userMessage: string;
  status: number;
  stripeMessage?: string;

  constructor(userMessage: string, status = 502, stripeMessage?: string) {
    super(userMessage);
    this.name = 'StripeConnectError';
    this.userMessage = userMessage;
    this.status = status;
    this.stripeMessage = stripeMessage;
  }
}

export function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

export function isStripeConfigured() {
  return Boolean(stripeSecretKey());
}

export function mapStripeError(raw?: string | null, country?: string): { message: string; status: number } {
  const text = String(raw || '');
  const lower = text.toLowerCase();
  const place = countryName(country);

  if (
    lower.includes('cannot be created by platforms') ||
    lower.includes('connected accounts in')
  ) {
    return {
      status: 400,
      message: place
        ? `Stripe payouts are not available for ${place} yet. Choose another country, or contact Eraiiz support.`
        : 'Stripe payouts are not available for this country yet. Choose another country, or contact Eraiiz support.',
    };
  }

  if (
    lower.includes('must be activated') ||
    lower.includes('activate your account') ||
    lower.includes('does not have the required permissions') ||
    lower.includes('connected_account_write') ||
    lower.includes('invalid api key')
  ) {
    return {
      status: 503,
      message: 'Payout setup is temporarily unavailable. Please try again later.',
    };
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      status: 429,
      message: 'Too many attempts. Wait a moment and try again.',
    };
  }

  return {
    status: 502,
    message: 'We could not set up payouts. Try again, or contact Eraiiz support if this keeps happening.',
  };
}

export function userFacingStripeError(error: unknown, country?: string) {
  if (error instanceof StripeConnectError) {
    if (country && error.status === 400) {
      return mapStripeError(error.stripeMessage, country);
    }
    return { message: error.userMessage, status: error.status };
  }
  const raw = error instanceof Error ? error.message : '';
  return mapStripeError(raw, country);
}

async function stripeRequest(path: string, init: RequestInit = {}) {
  const key = stripeSecretKey();
  if (!key) {
    throw new StripeConnectError('Payout setup is temporarily unavailable. Please try again later.', 503);
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
    const raw = String(data?.error?.message || 'Stripe request failed');
    console.error('Stripe API error', { path, status: response.status, message: raw, code: data?.error?.code });
    const mapped = mapStripeError(raw);
    throw new StripeConnectError(mapped.message, mapped.status, raw);
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
