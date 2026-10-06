import { promises as fs } from 'fs';
import path from 'path';
import { initialTimeline, type TrackingEvent } from '@/lib/tracking';

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
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  trackingStatus?: string;
  estimatedDelivery?: string;
  timeline?: TrackingEvent[];
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
  const withTimeline: SellerOrder = {
    ...order,
    timeline: order.timeline?.length ? order.timeline : initialTimeline(order.createdAt),
  };
  const keys = uniqueIds([...sellerKeys, withTimeline.buyer?.email ? `buyer:${withTimeline.buyer.email}` : '']);
  if (keys.length === 0) return withTimeline;

  const store = await readStore();
  for (const key of keys) {
    const existing = store[key] || [];
    store[key] = [withTimeline, ...existing.filter((item) => item._id !== withTimeline._id)].slice(0, 200);
  }
  await writeStore(store);
  return withTimeline;
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

export async function getBuyerOrders(buyerKeys: Array<string | null | undefined>) {
  const keys = uniqueIds(buyerKeys);
  const emails = keys.filter((key) => key.includes('@'));
  const store = await readStore();
  const merged = new Map<string, SellerOrder>();
  const emailSet = new Set(emails);

  for (const email of emails) {
    for (const item of store[`buyer:${email}`] || []) {
      merged.set(item._id, item);
    }
  }

  for (const list of Object.values(store)) {
    for (const item of list || []) {
      if (emailSet.has(normalizeKey(item.buyer?.email || ''))) {
        merged.set(item._id, item);
      }
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(orderId: string) {
  const store = await readStore();
  for (const list of Object.values(store)) {
    const match = (list || []).find((item) => item._id === orderId);
    if (match) return match;
  }
  return null;
}

export async function updateSellerOrder(
  sellerKeys: Array<string | null | undefined>,
  orderId: string,
  patch: Partial<
    Pick<
      SellerOrder,
      'status' | 'trackingNumber' | 'courierName' | 'trackingUrl' | 'trackingStatus' | 'estimatedDelivery' | 'timeline' | 'shippedAt' | 'deliveredAt'
    >
  >
) {
  const keys = uniqueIds(sellerKeys);
  const keySet = new Set(keys);
  const store = await readStore();
  const current = await getOrderById(orderId);
  if (!current) return null;

  const owned =
    keySet.has(normalizeKey(current.sellerId)) ||
    keys.some((key) => (store[key] || []).some((item) => item._id === orderId));
  if (!owned) return null;

  const updated: SellerOrder = { ...current, ...patch };

  for (const key of Object.keys(store)) {
    store[key] = (store[key] || []).map((item) => (item._id === orderId ? updated : item));
  }

  const indexKeys = uniqueIds([updated.sellerId, updated.buyer?.email ? `buyer:${updated.buyer.email}` : '']);
  for (const key of indexKeys) {
    const existing = store[key] || [];
    store[key] = [updated, ...existing.filter((item) => item._id !== orderId)].slice(0, 200);
  }

  await writeStore(store);
  return updated;
}

export async function updateSellerOrderStatus(
  sellerKeys: Array<string | null | undefined>,
  orderId: string,
  status: SellerOrder['status']
) {
  return updateSellerOrder(sellerKeys, orderId, { status });
}
