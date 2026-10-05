import type { SellerOrder } from '@/lib/sellerOrderStore';
import type { ValidatedCheckout } from '@/lib/checkout';
import {
  listSubaccounts,
  listTransactions,
  parseSellerMarker,
  verifyTransaction,
  type VerifiedTransaction,
} from '@/lib/paystack';

type OrderItemMeta = {
  productId?: string;
  name?: string;
  quantity?: number;
  selectedSize?: string;
  price?: number;
  sellerId?: string;
  id?: string;
  n?: string;
  q?: number;
  s?: string;
  p?: number;
  sid?: string;
};

function unique(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    ),
  ];
}

function normalizeKey(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
}

export function parsePaystackMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

export function buildOrderMetadata(checkout: ValidatedCheckout) {
  const sellerIds = unique(checkout.items.map((item) => item.sellerId));
  const sellerEmails = unique(checkout.sellerSplits.map((split) => split.email));

  return {
    type: 'eraiiz_order',
    buyerEmail: checkout.email,
    itemCount: checkout.items.length,
    sellerCount: sellerIds.length,
    sellerIds,
    sellerEmails,
    amountNgn: checkout.amountNgn,
    billing: {
      fullName: checkout.billing.fullName,
      email: checkout.billing.email,
      phone: checkout.billing.phone,
      address: checkout.billing.address,
      city: checkout.billing.city,
      state: checkout.billing.state,
      postalCode: checkout.billing.postalCode,
    },
    items: checkout.items.map((item) => ({
      id: item._id,
      n: String(item.name || 'Product').slice(0, 80),
      q: item.quantity || 1,
      s: item.selectedSize || undefined,
      p: item.price,
      sid: item.sellerId,
    })),
  };
}

function expandItems(meta: Record<string, unknown>): Array<{
  productId: string;
  name: string;
  quantity: number;
  selectedSize?: string;
  price: number;
  sellerId?: string;
}> {
  const raw = Array.isArray(meta.items) ? (meta.items as OrderItemMeta[]) : [];
  return raw.map((item) => ({
    productId: String(item.productId || item.id || ''),
    name: String(item.name || item.n || 'Product'),
    quantity: Number(item.quantity || item.q || 1),
    selectedSize: item.selectedSize || item.s || undefined,
    price: Number(item.price || item.p || 0),
    sellerId: item.sellerId || item.sid ? String(item.sellerId || item.sid) : undefined,
  }));
}

function billingFromMeta(meta: Record<string, unknown>) {
  const billing = (meta.billing && typeof meta.billing === 'object'
    ? meta.billing
    : {}) as Record<string, string>;
  return {
    fullName: String(billing.fullName || ''),
    email: String(billing.email || meta.buyerEmail || ''),
    phone: String(billing.phone || ''),
    address: String(billing.address || ''),
    city: String(billing.city || ''),
    state: String(billing.state || ''),
    postalCode: String(billing.postalCode || ''),
  };
}

function subaccountCodesFromTransaction(transaction: VerifiedTransaction) {
  const codes: string[] = [];
  const subaccount = transaction.subaccount;
  if (typeof subaccount === 'string') codes.push(subaccount);
  else if (subaccount?.subaccount_code) codes.push(subaccount.subaccount_code);

  const splitAccounts = transaction.split?.subaccounts || [];
  for (const entry of splitAccounts) {
    if (typeof entry === 'string') codes.push(entry);
    else if (entry?.subaccount) codes.push(entry.subaccount);
    else if (entry?.subaccount_code) codes.push(entry.subaccount_code);
  }

  return unique(codes);
}

export function sellerOrdersFromPayment(input: {
  reference: string;
  amountKobo?: number;
  paidAt?: string;
  metadata?: Record<string, unknown>;
  customerEmail?: string;
  sellerIds?: string[];
}): SellerOrder[] {
  const meta = input.metadata || {};
  if (meta.type === 'seller_plan' || meta.planId) return [];
  if (meta.type && meta.type !== 'eraiiz_order') return [];

  const items = expandItems(meta);
  const billing = billingFromMeta(meta);
  const sellerIds = unique([
    ...(Array.isArray(meta.sellerIds) ? meta.sellerIds.map((id) => String(id)) : []),
    ...items.map((item) => item.sellerId),
    ...(input.sellerIds || []),
  ]);

  if (!sellerIds.length) return [];

  const amountNgn = Number(meta.amountNgn || (input.amountKobo || 0) / 100);

  return sellerIds.map((sellerId) => {
    const sellerItems = items.filter((item) => String(item.sellerId) === String(sellerId));
    const useItems = sellerItems.length
      ? sellerItems
      : items.length
        ? items
        : [{ productId: '', name: 'Order', quantity: 1, price: amountNgn }];
    const quantity = useItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    const lineTotal = useItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    return {
      _id: `sale_${input.reference}_${sellerId}`,
      sellerId: String(sellerId),
      reference: input.reference,
      status: 'pending',
      createdAt: input.paidAt || new Date().toISOString(),
      buyer: {
        name: billing.fullName || 'Customer',
        email: billing.email || input.customerEmail || '',
        phone: billing.phone || undefined,
      },
      shippingAddress: {
        fullName: billing.fullName,
        address: billing.address,
        city: billing.city,
        state: billing.state,
        postalCode: billing.postalCode,
        phone: billing.phone || undefined,
      },
      items: useItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: Number(item.quantity || 1),
        selectedSize: item.selectedSize,
        price: Number(item.price || 0),
      })),
      quantity,
      amountNgn: lineTotal || amountNgn,
    };
  });
}

export async function sellerOrdersFromPaystack(keys: string[]): Promise<SellerOrder[]> {
  const keySet = new Set(keys.map(normalizeKey).filter(Boolean));
  if (!keySet.size) return [];

  let transactions: VerifiedTransaction[] = [];
  try {
    transactions = await listTransactions({ status: 'success', maxPages: 8 });
  } catch (error) {
    console.error('Failed to list Paystack transactions', error);
    return [];
  }

  let subaccountLookup = new Map<string, { ids: string[]; email?: string }>();
  try {
    const subaccounts = await listSubaccounts();
    subaccountLookup = new Map(
      subaccounts.map((subaccount) => {
        const marker = parseSellerMarker(subaccount);
        return [subaccount.subaccount_code, { ids: marker.sellerIds, email: marker.email }];
      })
    );
  } catch (error) {
    console.error('Failed to list Paystack subaccounts for order matching', error);
  }

  const found: SellerOrder[] = [];
  let hydrations = 0;

  for (const transaction of transactions) {
    let details = transaction;
    let metadata = parsePaystackMetadata(details.metadata);
    if (metadata.type === 'seller_plan' || metadata.planId) continue;

    const looksLikeOrder = Boolean(
      metadata.type === 'eraiiz_order' ||
        metadata.buyerEmail ||
        metadata.itemCount ||
        metadata.sellerCount
    );
    const paidAt = details.paid_at ? new Date(details.paid_at).getTime() : 0;
    const recent = !paidAt || Date.now() - paidAt < 14 * 24 * 60 * 60 * 1000;
    const missingSellerHint =
      !Array.isArray(metadata.sellerIds) &&
      !Array.isArray(metadata.items) &&
      subaccountCodesFromTransaction(details).length === 0;

    if (looksLikeOrder && missingSellerHint && recent && hydrations < 15) {
      try {
        details = await verifyTransaction(transaction.reference);
        metadata = parsePaystackMetadata(details.metadata);
        hydrations += 1;
      } catch (error) {
        console.error('Failed to hydrate Paystack transaction', transaction.reference, error);
      }
    }

    const fromSubaccounts: string[] = [];
    const fromSubaccountEmails: string[] = [];
    for (const code of subaccountCodesFromTransaction(details)) {
      const mapped = subaccountLookup.get(code);
      if (!mapped) continue;
      fromSubaccounts.push(...mapped.ids);
      if (mapped.email) fromSubaccountEmails.push(mapped.email);
    }

    const itemSellerIds = expandItems(metadata).map((item) => item.sellerId);
    const metaSellerIds = Array.isArray(metadata.sellerIds)
      ? metadata.sellerIds.map((id) => String(id))
      : [];
    const metaEmails = Array.isArray(metadata.sellerEmails)
      ? metadata.sellerEmails.map((email) => String(email))
      : [];

    const candidateIds = unique([...metaSellerIds, ...itemSellerIds, ...fromSubaccounts]);
    const candidateEmails = unique([...metaEmails, ...fromSubaccountEmails]);

    const matchedIds = candidateIds.filter((id) => keySet.has(normalizeKey(id)));
    const emailMatched = candidateEmails.some((email) => keySet.has(normalizeKey(email)));
    if (!matchedIds.length && !emailMatched) continue;

    const fallbackSellerId =
      matchedIds[0] || keys.find((key) => !String(key).includes('@')) || keys[0];

    found.push(
      ...sellerOrdersFromPayment({
        reference: details.reference,
        amountKobo: details.amount,
        paidAt: details.paid_at,
        metadata,
        customerEmail: details.customer?.email,
        sellerIds: matchedIds.length ? matchedIds : [fallbackSellerId],
      })
    );
  }

  const merged = new Map<string, SellerOrder>();
  for (const order of found) {
    if (!order?._id) continue;
    if (!merged.has(order._id)) merged.set(order._id, order);
  }
  return [...merged.values()];
}
