import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import {
  disableSubscription,
  listSubscriptions,
  type PaystackSubscription,
} from '@/lib/paystack';
import { getSellerPlan, type SellerPlanId } from '@/lib/sellerPlans';
import type { SellerIdentity } from '@/lib/sellerPayoutStore';

export interface SellerSubscriptionRecord {
  userId: string;
  planId: SellerPlanId;
  email?: string;
  subscriptionCode?: string;
  emailToken?: string;
  customerCode?: string;
  nextPaymentDate?: string;
  reference?: string;
  updatedAt: string;
}

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'seller-subscriptions.json')
  : path.join(process.cwd(), 'data', 'seller-subscriptions.json');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function readStore(): Promise<Record<string, SellerSubscriptionRecord>> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, SellerSubscriptionRecord>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, SellerSubscriptionRecord>) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
}

function planIdFromPaystackPlan(plan?: PaystackSubscription['plan']): SellerPlanId | null {
  const name = typeof plan === 'string' ? plan : plan?.name || '';
  if (name.toLowerCase().includes('pro')) return 'pro';
  if (name.toLowerCase().includes('growth')) return 'growth';
  return null;
}

export async function saveSellerSubscription(
  record: SellerSubscriptionRecord,
  extraIds: string[] = []
) {
  const store = await readStore();
  for (const id of uniqueIds([record.userId, ...extraIds])) {
    store[id] = { ...record, userId: id };
  }
  await writeStore(store);
}

export async function getSellerSubscription(userId: string) {
  const store = await readStore();
  return store[userId] ?? null;
}

export async function getAllSellerPlanRanks(): Promise<Record<string, SellerPlanId>> {
  const store = await readStore();
  const ranks: Record<string, SellerPlanId> = {};
  for (const [id, record] of Object.entries(store)) {
    ranks[id] = record.planId || 'commission';
  }
  return ranks;
}

export async function getSellerSubscriptionByIds(ids: string[]) {
  const store = await readStore();
  for (const id of uniqueIds(ids)) {
    if (store[id]) return store[id];
  }
  return null;
}

export async function persistSubscriptionOnBackend(
  authHeader: string,
  record: SellerSubscriptionRecord
) {
  await axios.patch(
    `${API_URL}/api/users/me`,
    {
      sellerPlan: record.planId,
      sellerPlanSubscriptionCode: record.subscriptionCode,
      sellerPlanNextPaymentDate: record.nextPaymentDate,
      sellerPlanEmailToken: record.emailToken,
    },
    {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
}

export function subscriptionFromUser(user: Record<string, unknown> | null | undefined) {
  if (!user) return null;
  const nested = user.sellerSubscription as Record<string, unknown> | undefined;
  const planId = (user.sellerPlan || nested?.planId) as SellerPlanId | undefined;
  if (!planId) return null;

  return {
    planId,
    subscriptionCode:
      (user.sellerPlanSubscriptionCode as string | undefined) ||
      (nested?.subscriptionCode as string | undefined),
    nextPaymentDate:
      (user.sellerPlanNextPaymentDate as string | undefined) ||
      (nested?.nextPaymentDate as string | undefined),
    emailToken:
      (user.sellerPlanEmailToken as string | undefined) ||
      (nested?.emailToken as string | undefined),
  };
}

export async function findActivePaystackSubscription(email?: string) {
  if (!email) return null;

  try {
    const subscriptions = await listSubscriptions();
    const active = subscriptions.filter((item) => {
      const status = (item.status || '').toLowerCase();
      const matchesEmail =
        item.customer?.email?.trim().toLowerCase() === email.trim().toLowerCase();
      return matchesEmail && (status === 'active' || status === 'non-renewing');
    });

    const pro = active.find((item) => planIdFromPaystackPlan(item.plan) === 'pro');
    const growth = active.find((item) => planIdFromPaystackPlan(item.plan) === 'growth');
    return pro || growth || null;
  } catch (error) {
    console.error('Failed to list Paystack subscriptions', error);
    return null;
  }
}

export async function resolveSellerSubscription(input: {
  identity: SellerIdentity;
  authHeader?: string;
}): Promise<SellerSubscriptionRecord> {
  const { identity, authHeader } = input;
  const fallbackId = identity.ids[0] || 'unknown';

  let record =
    (await getSellerSubscriptionByIds(identity.ids)) ||
    ({
      userId: fallbackId,
      planId: 'commission',
      email: identity.email,
      updatedAt: new Date().toISOString(),
    } satisfies SellerSubscriptionRecord);

  if (authHeader) {
    try {
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: authHeader },
        timeout: 15000,
      });
      const fromUser = subscriptionFromUser(response.data);
      identity.email = identity.email || (response.data?.email as string | undefined);
      identity.ids = uniqueIds([
        ...identity.ids,
        response.data?._id as string,
        response.data?.id as string,
      ]);
      if (fromUser?.planId) {
        record = {
          ...record,
          ...fromUser,
          userId: fallbackId,
          email: identity.email,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to read seller plan from backend', error);
    }
  }

  const paystackSub = await findActivePaystackSubscription(identity.email);
  if (paystackSub) {
    const planId = planIdFromPaystackPlan(paystackSub.plan) || record.planId;
    record = {
      ...record,
      planId,
      subscriptionCode: paystackSub.subscription_code || record.subscriptionCode,
      emailToken: paystackSub.email_token || record.emailToken,
      customerCode: paystackSub.customer?.customer_code || record.customerCode,
      nextPaymentDate: paystackSub.next_payment_date || record.nextPaymentDate,
      updatedAt: new Date().toISOString(),
    };
  } else if (record.planId !== 'commission' && !record.subscriptionCode) {
    const plan = getSellerPlan(record.planId);
    if (plan.amountNgn > 0 && record.nextPaymentDate) {
      const stillActive = new Date(record.nextPaymentDate).getTime() > Date.now();
      if (!stillActive) {
        record = {
          ...record,
          planId: 'commission',
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  await saveSellerSubscription(record, identity.ids);
  return record;
}

export async function cancelSellerSubscription(record: SellerSubscriptionRecord) {
  if (record.subscriptionCode && record.emailToken) {
    try {
      await disableSubscription(record.subscriptionCode, record.emailToken);
    } catch (error) {
      console.error('Failed to disable Paystack subscription', error);
    }
  }

  return {
    ...record,
    planId: 'commission' as const,
    subscriptionCode: undefined,
    emailToken: undefined,
    nextPaymentDate: undefined,
    updatedAt: new Date().toISOString(),
  };
}
