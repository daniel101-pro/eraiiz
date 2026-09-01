import crypto from 'crypto';
import {
  paystackSecretKey,
  PLATFORM_COMMISSION_PERCENT,
} from './paymentConfig';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });

  const payload = (await response.json()) as PaystackResponse<T>;

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Paystack request failed');
  }

  return payload.data;
}

export interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  active: boolean;
}

export interface PaystackSubaccount {
  id?: number;
  subaccount_code: string;
  business_name: string;
  account_number: string;
  settlement_bank: string;
  percentage_charge: number;
  description?: string;
  primary_contact_email?: string;
  metadata?: Record<string, unknown> | string | null;
}

export interface PaystackSplitSubaccount {
  subaccount: string;
  share: number;
}

export interface InitializeTransactionInput {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  splitSubaccounts?: PaystackSplitSubaccount[];
  plan?: string;
}

export interface InitializedTransaction {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifiedTransaction {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email?: string;
    customer_code?: string;
  };
  plan?: string | { plan_code?: string; name?: string } | null;
}

export async function listBanks(): Promise<PaystackBank[]> {
  return paystackRequest<PaystackBank[]>('/bank?currency=NGN');
}

export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; account_number: string }> {
  return paystackRequest(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
}

export function encodeSellerMarker(sellerIds: string[], email?: string) {
  const ids = [...new Set(sellerIds.map((id) => String(id).trim()).filter(Boolean))];
  return `eraiiz-seller|ids:${ids.join(',')}|email:${email || ''}`;
}

export function parseSellerMarker(subaccount: PaystackSubaccount): {
  sellerIds: string[];
  email?: string;
} {
  const sellerIds = new Set<string>();
  let email: string | undefined;

  const description = subaccount.description || '';
  const idsMatch = description.match(/ids:([^|]*)/);
  if (idsMatch?.[1]) {
    idsMatch[1].split(',').filter(Boolean).forEach((id) => sellerIds.add(id));
  }
  const emailMatch = description.match(/email:([^\s|]*)/);
  if (emailMatch?.[1]) {
    email = emailMatch[1];
  }

  const metadata =
    typeof subaccount.metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(subaccount.metadata) as Record<string, unknown>;
          } catch {
            return {};
          }
        })()
      : subaccount.metadata || {};

  const metaIds = metadata.sellerIds;
  if (Array.isArray(metaIds)) {
    metaIds.forEach((id) => sellerIds.add(String(id)));
  }
  if (typeof metadata.sellerId === 'string') {
    sellerIds.add(metadata.sellerId);
  }
  if (typeof metadata.email === 'string') {
    email = email || metadata.email;
  }

  if (subaccount.primary_contact_email) {
    email = email || subaccount.primary_contact_email;
  }

  return { sellerIds: [...sellerIds], email };
}

export async function listSubaccounts(): Promise<PaystackSubaccount[]> {
  const results: PaystackSubaccount[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const batch = await paystackRequest<PaystackSubaccount[]>(
      `/subaccount?perPage=50&page=${page}`
    );
    const items = Array.isArray(batch) ? batch : [];
    results.push(...items);
    if (items.length < 50) break;
  }

  return results;
}

export async function updateSubaccount(
  code: string,
  input: {
    description?: string;
    primaryContactEmail?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<PaystackSubaccount> {
  return paystackRequest<PaystackSubaccount>(`/subaccount/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify({
      description: input.description,
      primary_contact_email: input.primaryContactEmail,
      metadata: input.metadata,
    }),
  });
}

export async function createSubaccount(input: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  sellerIds?: string[];
  email?: string;
}): Promise<PaystackSubaccount> {
  const sellerIds = input.sellerIds || [];
  const body = {
    business_name: input.businessName,
    settlement_bank: input.bankCode,
    account_number: input.accountNumber,
    percentage_charge: PLATFORM_COMMISSION_PERCENT,
    description: encodeSellerMarker(sellerIds, input.email),
    primary_contact_email: input.email,
    metadata: {
      eraiiz: true,
      sellerId: sellerIds[0],
      sellerIds,
      email: input.email,
    },
  };

  try {
    return await paystackRequest<PaystackSubaccount>('/subaccount', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch {
    const { metadata: _metadata, ...withoutMetadata } = body;
    return paystackRequest<PaystackSubaccount>('/subaccount', {
      method: 'POST',
      body: JSON.stringify(withoutMetadata),
    });
  }
}

export async function initializeTransaction(
  input: InitializeTransactionInput
): Promise<InitializedTransaction> {
  const body: Record<string, unknown> = {
    email: input.email,
    amount: input.amountKobo,
    reference: input.reference,
    callback_url: input.callbackUrl,
    metadata: input.metadata,
    currency: 'NGN',
  };

  if (input.splitSubaccounts && input.splitSubaccounts.length > 0) {
    body.split = {
      type: 'flat',
      bearer_type: 'account',
      subaccounts: input.splitSubaccounts,
    };
  } else if (input.subaccount) {
    body.subaccount = input.subaccount;
  }

  if (input.plan) {
    body.plan = input.plan;
  }

  return paystackRequest<InitializedTransaction>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyTransaction(
  reference: string
): Promise<VerifiedTransaction> {
  return paystackRequest<VerifiedTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!paystackSecretKey || !signature) return false;

  const hash = crypto
    .createHmac('sha512', paystackSecretKey)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}

export interface PaystackPlan {
  name: string;
  plan_code: string;
  amount: number;
  interval: string;
}

export interface PaystackSubscription {
  status: string;
  subscription_code?: string;
  email_token?: string;
  next_payment_date?: string;
  customer?: {
    email?: string;
    customer_code?: string;
  };
  plan?: PaystackPlan | string;
}

export async function listPlans(): Promise<PaystackPlan[]> {
  const data = await paystackRequest<PaystackPlan[]>('/plan?perPage=50');
  return Array.isArray(data) ? data : [];
}

export async function createPlan(input: {
  name: string;
  amountKobo: number;
  interval?: string;
}): Promise<PaystackPlan> {
  return paystackRequest<PaystackPlan>('/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      amount: input.amountKobo,
      interval: input.interval || 'monthly',
      currency: 'NGN',
    }),
  });
}

export async function ensurePlan(name: string, amountKobo: number): Promise<PaystackPlan> {
  const existing = (await listPlans()).find(
    (plan) => plan.name === name && Number(plan.amount) === amountKobo
  );
  if (existing) return existing;

  try {
    return await createPlan({ name, amountKobo, interval: 'monthly' });
  } catch (error) {
    const fallback = (await listPlans()).find((plan) => plan.name === name);
    if (fallback) return fallback;
    throw error;
  }
}

export async function listSubscriptions(email?: string): Promise<PaystackSubscription[]> {
  const results: PaystackSubscription[] = [];

  for (let page = 1; page <= 5; page += 1) {
    const query = email
      ? `/subscription?perPage=50&page=${page}&customer=${encodeURIComponent(email)}`
      : `/subscription?perPage=50&page=${page}`;
    const batch = await paystackRequest<PaystackSubscription[]>(query);
    const items = Array.isArray(batch) ? batch : [];
    results.push(...items);
    if (items.length < 50) break;
  }

  return results;
}

export async function disableSubscription(code: string, emailToken: string) {
  return paystackRequest('/subscription/disable', {
    method: 'POST',
    body: JSON.stringify({
      code,
      token: emailToken,
    }),
  });
}
