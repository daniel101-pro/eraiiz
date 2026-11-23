import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllSellerOrders } from '@/lib/sellerOrderStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';
import { secureAdminJson } from '@/lib/adminSecurity';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

type Person = {
  id: string;
  email: string;
  name: string;
  role: string;
  orders: number;
  spend: number;
  plan?: string;
  source?: string;
};

function upsert(
  map: Map<string, Person>,
  person: Person
) {
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
    source: [...new Set([...(current.source || '').split('+'), person.source || ''].filter(Boolean))].join('+'),
  });
}

function normalizeUser(raw: Record<string, unknown>, source: string): Person | null {
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

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const people = new Map<string, Person>();
  const ranks = await getAllSellerPlanRanks();
  const sources: string[] = [];

  // 1) Backend admin users (primary)
  for (const path of ['/api/admin/users', '/api/admin/users?limit=200', '/api/users?role=all']) {
    try {
      const data = await fetchJson(`${API_URL}${path}`, authHeader);
      if (!data) continue;
      const list = Array.isArray(data)
        ? data
        : data.users || data.people || data.data || data.results || [];
      if (!Array.isArray(list) || list.length === 0) continue;
      sources.push(path);
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const person = normalizeUser(item as Record<string, unknown>, 'backend');
        if (person) {
          if (person.role === 'seller' && !person.plan) {
            person.plan = ranks[person.id] || 'commission';
          }
          upsert(people, person);
        }
      }
      break;
    } catch {
      // try next path
    }
  }

  // 2) Local order ledger buyers/sellers
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

  // 3) Catalog sellers via public product payloads
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
          if (sellerId) sellerIds.add(sellerId);
        } catch {
          // ignore one product failure
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
              plan: ranks[sellerId] || 'commission',
              source: 'catalog',
            });
            return;
          }
          const seller = await response.json();
          const person = normalizeUser(seller as Record<string, unknown>, 'catalog');
          if (person) {
            person.role = 'seller';
            person.plan = ranks[person.id] || person.plan || 'commission';
            upsert(people, person);
          }
        } catch {
          // ignore
        }
      })
    );
  } catch {
    // catalog enrichment optional
  }

  const list = [...people.values()]
    .filter((person) =>
      q ? [person.name, person.email, person.role, person.id].join(' ').toLowerCase().includes(q) : true
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return secureAdminJson({
    people: list,
    meta: {
      count: list.length,
      sources,
      generatedAt: new Date().toISOString(),
    },
  });
}
