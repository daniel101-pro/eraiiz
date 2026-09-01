import { promises as fs } from 'fs';
import path from 'path';

export interface SellerPayoutRecord {
  userId: string;
  subaccountCode: string;
  accountName: string;
  businessName: string;
  bankCode: string;
  accountNumber: string;
  updatedAt: string;
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

export async function saveSellerPayout(record: SellerPayoutRecord) {
  const store = await readStore();
  store[record.userId] = record;
  await writeStore(store);
}

export async function getSellerPayout(userId: string) {
  const store = await readStore();
  return store[userId] ?? null;
}

export function getUserIdFromAuthHeader(authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const segment = token.split('.')[1];
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      Buffer.from(normalized, 'base64').toString('utf8')
    ) as { id?: string; userId?: string; _id?: string };

    return String(payload.id || payload.userId || payload._id || '') || null;
  } catch {
    return null;
  }
}

export function payoutStorageKey(userId: string) {
  return `eraiiz_payout_${userId}`;
}
