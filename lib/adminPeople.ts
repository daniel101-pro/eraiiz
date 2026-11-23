import { getAllSellerOrders } from '@/lib/sellerOrderStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';
import { listAdminMail } from '@/lib/adminMailStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export type AdminPerson = {
  id: string;
  email: string;
  name: string;
  role: string;
  orders: number;
  spend: number;
  plan?: string;
  source?: string;
  listings?: number;
};

function upsert(map: Map<string, AdminPerson>, person: AdminPerson) {
  const email = String(person.email || '').trim().toLowerCase();
  const key = email || `${person.role}:${person.id}`;
  if (!key || key.endsWith(':')) return;

  const current = map.get(key);
  if (!current) {
    map.set(key, { ...person, email, id: person.id || email });
    return;
  }

  const fromOrders = person.source === 'orders';
  map.set(key, {
    ...current,
    id: current.id || person.id,
    email: current.email || email,
    name: current.name && current.name !== current.id ? current.name : person.name || current.name,
    role: current.role === 'admin' ? current.role : person.role || current.role,
    orders: fromOrders ? current.orders + person.orders : Math.max(current.orders, person.orders),
    spend: fromOrders ? current.spend + person.spend : Math.max(current.spend, person.spend),
    plan: current.plan || person.plan,
    listings: Math.max(current.listings || 0, person.listings || 0),
    source: [...new Set([...(current.source || '').split('+'), person.source || ''].filter(Boolean))].join('+'),
  });
}

function normalizeUser(raw: Record<string, unknown>, source: string): AdminPerson | null {
  const id = String(raw._id || raw.id || raw.userId || raw.email || '').trim();
  const email = String(raw.email || '').trim().toLowerCase();
  if (!id && !email) return null;
  return {
    id: id || email,
    email,
    name: String(raw.name || raw.fullName || raw.username || email.split('@')[0] || id),
    role: String(raw.role || 'buyer').toLowerCase(),
    orders: Number(raw.orders || raw.orderCount || 0),
    spend: Number(raw.spend || raw.totalSpend || raw.lifetimeValue || 0),
    plan: raw.plan ? String(raw.plan) : undefined,
    source,
  };
}

async function fetchJson(url: string, authHeader: string) {
  const response = await fetch(url, {
    headers: { Authorization: authHeader },
    signal: AbortSignal.timeout(12000),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

export async function collectAdminPeople(authHeader: string) {
  const people = new Map<string, AdminPerson>();
  const ranks = await getAllSellerPlanRanks();
  const sources: string[] = [];

  for (const path of ['/api/admin/users', '/api/admin/users?limit=200', '/api/users?role=all']) {
    try {
      const data = await fetchJson(`${API_URL}${path}`, authHeader);
      if (!data) continue;
      const list = Array.isArray(data)
        ? data
        : data.users || data.people || data.data || data.results || [];
      if (!Array.isArray(list) || !list.length) continue;
      sources.push(path);
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const person = normalizeUser(item as Record<string, unknown>, 'backend');
        if (!person) continue;
        if (person.role === 'seller' && !person.plan) person.plan = ranks[person.id] || 'commission';
        upsert(people, person);
      }
      break;
    } catch {
      // try next
    }
  }

  const orders = await getAllSellerOrders();
  if (orders.length) sources.push('orders');
  for (const order of orders) {
    const email = String(order.buyer?.email || '').toLowerCase();
    if (email) {
      upsert(people, {
        id: email,
        email,
        name: order.buyer?.name || email,
        role: 'buyer',
        orders: 1,
        spend: Number(order.amountNgn || 0),
        source: 'orders',
      });
    }
    if (order.sellerId) {
      upsert(people, {
        id: order.sellerId,
        email: '',
        name: order.sellerId,
        role: 'seller',
        orders: 1,
        spend: 0,
        plan: ranks[order.sellerId] || 'commission',
        source: 'orders',
      });
    }
  }

  try {
    const listRes = await fetch(`${API_URL}/api/products/random`, {
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    const random = listRes.ok ? await listRes.json().catch(() => []) : [];
    const productIds = (Array.isArray(random) ? random : [])
      .map((item: { _id?: string; id?: string }) => String(item._id || item.id || ''))
      .filter(Boolean)
      .slice(0, 40);

    const sellerListings = new Map<string, number>();
    const sellerIds = new Set<string>();

    await Promise.all(
      productIds.map(async (productId: string) => {
        try {
          const response = await fetch(`${API_URL}/api/products/${productId}/public`, {
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
          });
          if (!response.ok) return;
          const product = await response.json();
          const sellerId = String(product.sellerId || product.seller?._id || '');
          if (!sellerId) return;
          sellerIds.add(sellerId);
          sellerListings.set(sellerId, (sellerListings.get(sellerId) || 0) + 1);
        } catch {
          // ignore
        }
      })
    );

    if (sellerIds.size) sources.push('catalog');
    await Promise.all(
      [...sellerIds].map(async (sellerId) => {
        try {
          const response = await fetch(`${API_URL}/api/users/seller/${sellerId}`, {
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
          });
          if (!response.ok) {
            upsert(people, {
              id: sellerId,
              email: '',
              name: sellerId,
              role: 'seller',
              orders: 0,
              spend: 0,
              listings: sellerListings.get(sellerId) || 0,
              plan: ranks[sellerId] || 'commission',
              source: 'catalog',
            });
            return;
          }
          const seller = await response.json();
          const person = normalizeUser(seller as Record<string, unknown>, 'catalog');
          if (!person) return;
          person.role = 'seller';
          person.plan = ranks[person.id] || person.plan || 'commission';
          person.listings = sellerListings.get(sellerId) || 0;
          upsert(people, person);
        } catch {
          // ignore
        }
      })
    );
  } catch {
    // optional
  }

  return {
    people: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sources,
    orders,
  };
}

export function matchesPerson(person: AdminPerson, idOrEmail: string) {
  const needle = String(idOrEmail || '').trim().toLowerCase();
  if (!needle) return false;
  return (
    person.id.toLowerCase() === needle ||
    person.email.toLowerCase() === needle ||
    `seller:${person.id}`.toLowerCase() === needle
  );
}

export async function buildPersonActivity(person: AdminPerson, orders: Awaited<ReturnType<typeof getAllSellerOrders>>) {
  const buyerOrders = orders.filter(
    (order) =>
      String(order.buyer?.email || '').toLowerCase() === person.email.toLowerCase() ||
      String(order.buyer?.name || '').toLowerCase() === person.name.toLowerCase()
  );
  const sellerOrders = orders.filter((order) => String(order.sellerId || '') === person.id);

  const mail = await listAdminMail('inbox', person.email || person.name);
  const relatedMail = mail.filter(
    (item) =>
      item.fromEmail === person.email ||
      item.toEmail === person.email ||
      item.threadId === person.email
  );

  const timeline = [
    ...buyerOrders.map((order) => ({
      id: `buy-${order._id}`,
      at: order.createdAt,
      type: 'purchase' as const,
      title: `Bought · ${order.reference || order._id}`,
      detail: `${order.status} · ₦${Number(order.amountNgn || 0).toLocaleString()} · ${(order.items || []).map((item) => item.name).join(', ')}`,
    })),
    ...sellerOrders.map((order) => ({
      id: `sell-${order._id}`,
      at: order.createdAt,
      type: 'sale' as const,
      title: `Sale · ${order.reference || order._id}`,
      detail: `${order.status} · buyer ${order.buyer?.name || order.buyer?.email || '—'} · ₦${Number(order.amountNgn || 0).toLocaleString()}`,
    })),
    ...relatedMail.map((item) => ({
      id: `mail-${item.id}`,
      at: item.createdAt,
      type: 'mail' as const,
      title: `${item.folder} · ${item.subject}`,
      detail: item.text.slice(0, 180),
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    person,
    stats: {
      purchases: buyerOrders.length,
      sales: sellerOrders.length,
      spend: buyerOrders.reduce((sum, order) => sum + Number(order.amountNgn || 0), 0),
      revenue: sellerOrders.reduce((sum, order) => sum + Number(order.amountNgn || 0), 0),
      listings: person.listings || 0,
      mail: relatedMail.length,
      plan: person.plan || null,
    },
    purchases: buyerOrders.map((order) => ({
      id: order._id,
      reference: order.reference,
      status: order.status,
      amount: order.amountNgn,
      createdAt: order.createdAt,
      items: order.items,
    })),
    sales: sellerOrders.map((order) => ({
      id: order._id,
      reference: order.reference,
      status: order.status,
      amount: order.amountNgn,
      createdAt: order.createdAt,
      buyer: order.buyer,
      items: order.items,
    })),
    mail: relatedMail.slice(0, 30),
    timeline: timeline.slice(0, 100),
  };
}
