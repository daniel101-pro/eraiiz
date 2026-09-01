import { promises as fs } from 'fs';
import path from 'path';
import {
  encodeSellerMarker,
  listSubaccounts,
  parseSellerMarker,
  type PaystackSubaccount,
  updateSubaccount,
} from '@/lib/paystack';

export interface SellerPayoutRecord {
  userId: string;
  subaccountCode: string;
  accountName: string;
  businessName: string;
  bankCode: string;
  accountNumber: string;
  updatedAt: string;
}

export interface SellerIdentity {
  ids: string[];
  email?: string;
  name?: string;
}

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'seller-payouts.json')
  : path.join(process.cwd(), 'data', 'seller-payouts.json');

async function readStore(): Promise<Record<string, SellerPayoutRecord>> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, SellerPayoutRecord>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, SellerPayoutRecord>) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
}

export function recordFromSubaccount(
  subaccount: PaystackSubaccount,
  fallbackId: string
): SellerPayoutRecord {
  return {
    userId: fallbackId,
    subaccountCode: subaccount.subaccount_code,
    accountName: subaccount.business_name,
    businessName: subaccount.business_name,
    bankCode: subaccount.settlement_bank,
    accountNumber: subaccount.account_number,
    updatedAt: new Date().toISOString(),
  };
}

export async function saveSellerPayout(
  record: SellerPayoutRecord,
  extraIds: string[] = []
) {
  const store = await readStore();
  for (const id of uniqueIds([record.userId, ...extraIds])) {
    store[id] = { ...record, userId: id };
  }
  await writeStore(store);
}

export async function getSellerPayout(userId: string) {
  const store = await readStore();
  return store[userId] ?? null;
}

export async function getSellerPayoutByIds(ids: string[]) {
  const store = await readStore();
  for (const id of uniqueIds(ids)) {
    if (store[id]) return store[id];
  }
  return null;
}

function identityMatches(subaccount: PaystackSubaccount, identity: SellerIdentity) {
  const marker = parseSellerMarker(subaccount);
  const wantedIds = new Set(uniqueIds(identity.ids));
  const wantedEmail = identity.email?.trim().toLowerCase();

  if (marker.sellerIds.some((id) => wantedIds.has(id))) return true;
  if (wantedEmail && marker.email?.trim().toLowerCase() === wantedEmail) return true;
  if (
    wantedEmail &&
    subaccount.primary_contact_email?.trim().toLowerCase() === wantedEmail
  ) {
    return true;
  }
  if (
    identity.name &&
    (subaccount.description || '').toLowerCase().includes('eraiiz') &&
    subaccount.business_name?.trim().toLowerCase() === identity.name.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

export async function findPaystackSubaccountForSeller(
  identity: SellerIdentity
): Promise<PaystackSubaccount | null> {
  const ids = uniqueIds(identity.ids);
  if (ids.length === 0 && !identity.email) return null;

  try {
    const subaccounts = await listSubaccounts();
    const exact = subaccounts.find((subaccount) => identityMatches(subaccount, identity));
    if (exact) return exact;

    const legacy = subaccounts.filter((subaccount) =>
      (subaccount.description || '').toLowerCase().includes('eraiiz')
    );

    if (identity.email) {
      const byEmail = legacy.find(
        (subaccount) =>
          subaccount.primary_contact_email?.trim().toLowerCase() ===
          identity.email?.trim().toLowerCase()
      );
      if (byEmail) return byEmail;
    }

    if (legacy.length === 1 && ids.length > 0) {
      return legacy[0];
    }
  } catch (error) {
    console.error('Failed to list Paystack subaccounts', error);
  }

  return null;
}

export async function attachSellerIdentityToSubaccount(
  subaccount: PaystackSubaccount,
  identity: SellerIdentity
) {
  const marker = parseSellerMarker(subaccount);
  const sellerIds = uniqueIds([...marker.sellerIds, ...identity.ids]);
  const email = identity.email || marker.email || subaccount.primary_contact_email;

  try {
    return await updateSubaccount(subaccount.subaccount_code, {
      description: encodeSellerMarker(sellerIds, email),
      primaryContactEmail: email,
      metadata: {
        eraiiz: true,
        sellerId: sellerIds[0],
        sellerIds,
        email,
      },
    });
  } catch (error) {
    console.error('Failed to attach seller identity to subaccount', error);
    return subaccount;
  }
}

export function decodeAuthToken(authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const segment = token.split('.')[1];
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
      id?: string;
      userId?: string;
      _id?: string;
      sub?: string;
      email?: string;
    };
  } catch {
    return null;
  }
}

export function getUserIdFromAuthHeader(authHeader?: string | null) {
  const payload = decodeAuthToken(authHeader);
  if (!payload) return null;
  return String(payload.id || payload.userId || payload._id || payload.sub || '') || null;
}

export function getIdentityFromAuthHeader(authHeader?: string | null): SellerIdentity {
  const payload = decodeAuthToken(authHeader);
  if (!payload) return { ids: [] };

  return {
    ids: uniqueIds([payload.id, payload.userId, payload._id, payload.sub]),
    email: payload.email,
    name: undefined,
  };
}

export function payoutStorageKey(userId: string) {
  return `eraiiz_payout_${userId}`;
}
