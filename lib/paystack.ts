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
  subaccount_code: string;
  business_name: string;
  account_number: string;
  settlement_bank: string;
  percentage_charge: number;
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
  };
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

export async function createSubaccount(input: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
}): Promise<PaystackSubaccount> {
  return paystackRequest<PaystackSubaccount>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: input.businessName,
      settlement_bank: input.bankCode,
      account_number: input.accountNumber,
      percentage_charge: PLATFORM_COMMISSION_PERCENT,
      description: `Eraiiz seller subaccount for ${input.businessName}`,
    }),
  });
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
