import { promises as fs } from 'fs';
import path from 'path';

export interface SellerOrderItem {
  productId?: string;
  name: string;
  quantity: number;
  selectedSize?: string;
  price?: number;
  currency?: string;
}

export interface SellerOrder {
  _id: string;
  sellerId: string;
  reference: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string;
  };
  items: SellerOrderItem[];
  quantity: number;
  amountNgn: number;
}

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'seller-orders.json')
  : path.join(process.cwd(), 'data', 'seller-orders.json');

type Store = Record<string, SellerOrder[]>;

function normalizeKey(id: string) {
  const value = String(id || '').trim();
  if (!value) return '';
  return value.includes('@') ? value.toLowerCase() : value;
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.map((id) => normalizeKey(String(id || ''))).filter(Boolean))];
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function addSellerOrder(
  sellerKeys: Array<string | null | undefined>,
  order: SellerOrder
) {
  const keys = uniqueIds(sellerKeys);
  if (keys.length === 0) return order;

  const store = await readStore();
  for (const key of keys) {
    const existing = store[key] || [];
    store[key] = [order, ...existing.filter((item) => item._id !== order._id)].slice(0, 200);
  }
  await writeStore(store);
  return order;
}

export async function getSellerOrders(sellerKeys: Array<string | null | undefined>) {
  const keys = uniqueIds(sellerKeys);
  const store = await readStore();
  const merged = new Map<string, SellerOrder>();

  for (const key of keys) {
    for (const item of store[key] || []) {
      merged.set(item._id, item);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateSellerOrderStatus(
  sellerKeys: Array<string | null | undefined>,
  orderId: string,
  status: SellerOrder['status']
) {
  const keys = uniqueIds(sellerKeys);
  const store = await readStore();
  let updated: SellerOrder | null = null;

  for (const key of keys) {
    store[key] = (store[key] || []).map((item) => {
      if (item._id !== orderId) return item;
      updated = { ...item, status };
      return updated;
    });
  }

  await writeStore(store);
  return updated;
}
