import { promises as fs } from 'fs';
import path from 'path';
import Stripe from 'stripe';

export type SuppressedProduct = {
  id: string;
  name?: string;
  at: string;
  by?: string;
  reason?: string;
};

const TMP_PATH = path.join('/tmp', 'eraiiz-suppressed-products.json');
const LOCAL_PATH = path.join(process.cwd(), 'data', 'suppressed-products.json');
const STRIPE_EMAIL = 'product-suppressions@eraiiz.internal';
const META_PREFIX = 's';

let memoryIds: Set<string> | null = null;
let memoryAt = 0;

function envSuppressedIds() {
  return String(process.env.SUPPRESSED_PRODUCT_IDS || '')
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key);
}

async function readJsonFile(filePath: string): Promise<SuppressedProduct[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        id: String(row?.id || '').trim(),
        name: row?.name ? String(row.name) : undefined,
        at: String(row?.at || new Date().toISOString()),
        by: row?.by ? String(row.by) : undefined,
        reason: row?.reason ? String(row.reason) : undefined,
      }))
      .filter((row) => row.id);
  } catch {
    return [];
  }
}

async function writeJsonFile(filePath: string, rows: SuppressedProduct[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(rows.slice(0, 5000), null, 2), 'utf8');
}

function packIds(ids: string[]) {
  const unique = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  const metadata: Record<string, string> = {};
  let chunk: string[] = [];
  let index = 0;

  const flush = () => {
    if (!chunk.length) return;
    metadata[`${META_PREFIX}${index}`] = chunk.join(',');
    index += 1;
    chunk = [];
  };

  for (const id of unique) {
    const next = chunk.length ? `${chunk.join(',')},${id}` : id;
    if (next.length > 490) {
      flush();
      chunk = [id];
    } else {
      chunk.push(id);
    }
  }
  flush();
  return metadata;
}

function unpackMetadata(metadata: Record<string, string> | null | undefined) {
  const ids: string[] = [];
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!key.startsWith(META_PREFIX) || !value) continue;
    ids.push(...value.split(',').map((part) => part.trim()).filter(Boolean));
  }
  return [...new Set(ids)];
}

async function loadStripeIds(): Promise<string[]> {
  const stripe = getStripe();
  if (!stripe) return [];
  try {
    const existing = await stripe.customers.list({ email: STRIPE_EMAIL, limit: 1 });
    const customer = existing.data[0];
    if (!customer) return [];
    return unpackMetadata(customer.metadata);
  } catch {
    return [];
  }
}

async function saveStripeIds(ids: string[]) {
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const existing = await stripe.customers.list({ email: STRIPE_EMAIL, limit: 1 });
    const metadata = packIds(ids);
    // Clear old chunk keys first by overwriting with empty then set — Stripe replaces whole metadata on update if we pass full object
    if (existing.data[0]) {
      const cleared: Record<string, string> = {};
      for (const key of Object.keys(existing.data[0].metadata || {})) {
        if (key.startsWith(META_PREFIX)) cleared[key] = '';
      }
      await stripe.customers.update(existing.data[0].id, {
        metadata: { ...cleared, ...metadata },
      });
    } else {
      await stripe.customers.create({
        email: STRIPE_EMAIL,
        name: 'Eraiiz suppressed products',
        metadata,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function listSuppressedProducts(): Promise<SuppressedProduct[]> {
  if (memoryIds && Date.now() - memoryAt < 15_000) {
    return [...memoryIds].map((id) => ({ id, at: new Date(memoryAt).toISOString() }));
  }

  const [localRows, tmpRows, stripeIds] = await Promise.all([
    readJsonFile(LOCAL_PATH),
    readJsonFile(TMP_PATH),
    loadStripeIds(),
  ]);

  const map = new Map<string, SuppressedProduct>();
  for (const id of envSuppressedIds()) {
    map.set(id, { id, at: new Date(0).toISOString(), reason: 'env' });
  }
  for (const id of stripeIds) {
    map.set(id, { id, at: new Date().toISOString(), reason: 'stripe' });
  }
  for (const row of [...localRows, ...tmpRows]) {
    map.set(row.id, row);
  }

  memoryIds = new Set([...map.keys()]);
  memoryAt = Date.now();
  return [...map.values()];
}

export async function suppressedProductIdSet() {
  const rows = await listSuppressedProducts();
  return new Set(rows.map((row) => row.id));
}

export async function isProductSuppressed(id: string) {
  if (!id) return false;
  const set = await suppressedProductIdSet();
  return set.has(String(id));
}

export async function suppressProduct(input: {
  id: string;
  name?: string;
  by?: string;
  reason?: string;
}) {
  const id = String(input.id || '').trim();
  if (!id) return null;

  const next: SuppressedProduct = {
    id,
    name: input.name,
    at: new Date().toISOString(),
    by: input.by,
    reason: input.reason || 'admin-delete',
  };

  const existing = await listSuppressedProducts();
  const ids = [...new Set([id, ...existing.map((row) => row.id)])];
  const rows = [
    next,
    ...existing.filter((row) => row.id !== id && row.reason !== 'env' && row.reason !== 'stripe'),
  ];

  memoryIds = new Set(ids);
  memoryAt = Date.now();

  await Promise.all([
    writeJsonFile(TMP_PATH, rows).catch(() => undefined),
    writeJsonFile(LOCAL_PATH, rows).catch(() => undefined),
    saveStripeIds(ids),
  ]);

  return next;
}

export function filterSuppressedProducts<T extends { _id?: unknown; id?: unknown }>(
  products: T[],
  suppressed: Set<string>
) {
  if (!suppressed.size) return products;
  return products.filter((item) => {
    const productId = String(item?._id || item?.id || '');
    return productId && !suppressed.has(productId);
  });
}
