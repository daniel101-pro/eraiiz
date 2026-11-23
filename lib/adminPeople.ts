import { getAllSellerOrders, type SellerOrder } from '@/lib/sellerOrderStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';
import { listAdminMail } from '@/lib/adminMailStore';
import {
  parsePaystackMetadata,
  sellerOrdersFromPayment,
} from '@/lib/marketplaceOrders';
import { listCustomers, listTransactions } from '@/lib/paystack';
import { listDirectoryUsers } from '@/lib/userDirectoryStore';

import { backendAdminAuthHeader, resolveBackendAdminAuth } from '@/lib/backendAdminAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export { backendAdminAuthHeader, resolveBackendAdminAuth };

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

  const fromOrders = person.source === 'orders' || person.source === 'paystack' || person.source === 'backend-orders';
  map.set(key, {
    ...current,
    id: current.id || person.id,
    email: current.email || email,
    name: current.name && current.name !== current.id ? current.name : person.name || current.name,
    role: preferRole(current.role, person.role),
    orders: fromOrders ? current.orders + person.orders : Math.max(current.orders, person.orders),
    spend: fromOrders ? current.spend + person.spend : Math.max(current.spend, person.spend),
    plan: current.plan || person.plan,
    listings: Math.max(current.listings || 0, person.listings || 0),
    source: [...new Set([...(current.source || '').split('+'), person.source || ''].filter(Boolean))].join('+'),
  });
}

function preferRole(a: string, b: string) {
  const rank = (role: string) => {
    if (role === 'admin') return 3;
    if (role === 'seller') return 2;
    if (role === 'buyer' || role === 'user') return 1;
    return 0;
  };
  return rank(b) > rank(a) ? b : a || b || 'buyer';
}

function normalizeRole(raw: unknown) {
  const role = String(raw || '').trim().toLowerCase();
  if (!role || role === 'user' || role === 'customer' || role === 'shopper' || role === 'pending') {
    return 'buyer';
  }
  if (role === 'supplier' || role === 'vendor') return 'seller';
  return role;
}

function normalizeUser(raw: Record<string, unknown>, source: string): AdminPerson | null {
  const id = String(raw._id || raw.id || raw.userId || raw.email || '').trim();
  const email = String(raw.email || raw.userEmail || '').trim().toLowerCase();
  if (!id && !email) return null;
  return {
    id: id || email,
    email,
    name: String(raw.name || raw.fullName || raw.username || raw.businessName || email.split('@')[0] || id),
    role: normalizeRole(raw.role || raw.userRole || raw.type),
    orders: Number(raw.orders || raw.orderCount || raw.totalOrders || 0),
    spend: Number(raw.spend || raw.totalSpend || raw.lifetimeValue || raw.totalSpent || 0),
    plan: raw.plan ? String(raw.plan) : undefined,
    source,
  };
}

function extractArray(data: unknown, depth = 0): unknown[] {
  if (!data || depth > 3) return [];
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  for (const key of [
    'users',
    'people',
    'customers',
    'buyers',
    'sellers',
    'accounts',
    'data',
    'results',
    'items',
    'docs',
    'rows',
    'list',
    'records',
  ]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = extractArray(value, depth + 1);
      if (nested.length) return nested;
    }
  }
  return [];
}

async function fetchJson(url: string, authHeader: string) {
  try {
    const response = await fetch(url, {
      headers: authHeader ? { Authorization: authHeader } : {},
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : 'fetch failed',
    };
  }
}

function orderFromBackend(raw: Record<string, unknown>): SellerOrder | null {
  const id = String(raw._id || raw.id || raw.paymentReference || raw.reference || '');
  if (!id) return null;
  const billing = (raw.billingAddress || raw.billing || {}) as Record<string, string>;
  const buyerEmail = String(
    billing.email || raw.buyerEmail || (raw.buyer as { email?: string } | undefined)?.email || ''
  ).toLowerCase();
  const buyerName = String(
    billing.fullName ||
      raw.buyerName ||
      (raw.buyer as { name?: string } | undefined)?.name ||
      buyerEmail.split('@')[0] ||
      'Customer'
  );
  const amount = Number(
    raw.amountNgn || raw.amount || raw.total || raw.price || raw.totalAmount || 0
  );
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items =
    itemsRaw.length > 0
      ? itemsRaw.map((item) => {
          const row = (item || {}) as Record<string, unknown>;
          return {
            productId: String(row.productId || row._id || ''),
            name: String(row.name || row.product || 'Item'),
            quantity: Number(row.quantity || 1),
            selectedSize: row.selectedSize ? String(row.selectedSize) : undefined,
            price: Number(row.price || 0),
          };
        })
      : [
          {
            productId: String(raw.productId || ''),
            name: String(raw.product || raw.name || 'Order'),
            quantity: Number(raw.quantity || 1),
            selectedSize: raw.selectedSize ? String(raw.selectedSize) : undefined,
            price: amount,
          },
        ];

  return {
    _id: id,
    sellerId: String(raw.sellerId || raw.seller || ''),
    reference: String(raw.paymentReference || raw.reference || id),
    status:
      String(raw.status || 'pending').toLowerCase() === 'delivered'
        ? 'delivered'
        : String(raw.status || '').toLowerCase() === 'shipped'
          ? 'shipped'
          : String(raw.status || '').toLowerCase() === 'cancelled'
            ? 'cancelled'
            : 'pending',
    createdAt: String(raw.createdAt || raw.paidAt || new Date().toISOString()),
    buyer: {
      name: buyerName,
      email: buyerEmail,
      phone: billing.phone || (typeof raw.phone === 'string' ? raw.phone : undefined),
    },
    shippingAddress: {
      fullName: buyerName,
      address: String(billing.address || billing.houseAddress || ''),
      city: String(billing.city || ''),
      state: String(billing.state || ''),
      postalCode: String(billing.postalCode || billing.postalAddress || ''),
      phone: billing.phone,
    },
    items,
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    amountNgn: amount,
  };
}

async function collectBackendOrders(authHeader: string) {
  const orders: SellerOrder[] = [];
  const warnings: string[] = [];
  const paths = [
    '/api/admin/orders',
    '/api/admin/orders?limit=500',
    '/api/orders/all',
    '/api/orders?all=true',
  ];

  for (const path of paths) {
    const result = await fetchJson(`${API_URL}${path}`, authHeader);
    if (!result.ok) {
      warnings.push(`${path} → ${result.status || result.error || 'failed'}`);
      continue;
    }
    const list = extractArray(result.body);
    const ordersKey =
      result.body && typeof result.body === 'object' && Array.isArray((result.body as { orders?: unknown[] }).orders)
        ? ((result.body as { orders: unknown[] }).orders as unknown[])
        : list;
    for (const item of ordersKey) {
      if (!item || typeof item !== 'object') continue;
      const mapped = orderFromBackend(item as Record<string, unknown>);
      if (mapped) orders.push(mapped);
    }
    if (orders.length) break;
  }

  return { orders, warnings };
}

async function collectBackendUsers(authHeader: string, ranks: Record<string, string>) {
  const people = new Map<string, AdminPerson>();
  const warnings: string[] = [];
  const sources: string[] = [];
  const auth = backendAdminAuthHeader(authHeader);

  const basePaths = [
    '/api/admin/users',
    '/api/admin/customers',
    '/api/admin/buyers',
  ];

  for (const base of basePaths) {
    let gotAny = false;
    for (let page = 1; page <= 30; page += 1) {
      const candidates = [
        page === 1 ? base : null,
        `${base}?page=${page}&limit=100`,
        `${base}?page=${page}&perPage=100`,
        `${base}?skip=${(page - 1) * 100}&limit=100`,
      ].filter(Boolean) as string[];

      let pageCount = 0;
      for (const path of candidates) {
        const result = await fetchJson(`${API_URL}${path}`, auth);
        if (!result.ok) {
          if (page === 1) warnings.push(`${path} → ${result.status || result.error || 'failed'}`);
          continue;
        }
        const list = extractArray(result.body);
        if (!list.length) continue;
        gotAny = true;
        pageCount = list.length;
        sources.push(path);
        for (const item of list) {
          if (!item || typeof item !== 'object') continue;
          const person = normalizeUser(item as Record<string, unknown>, 'backend');
          if (!person) continue;
          if (person.role === 'seller' && !person.plan) person.plan = ranks[person.id] || 'commission';
          upsert(people, person);
        }
        break;
      }

      if (!gotAny || pageCount < 50) break;
    }
    if (people.size) break;
  }

  if (!people.size) {
    warnings.push(
      'backend users empty — set BACKEND_ADMIN_TOKEN to a backend admin JWT, or give this account role=admin on Render'
    );
  }

  return { people, warnings, sources: [...new Set(sources)], authMode: auth.startsWith('Bearer ') ? 'token' : 'none' };
}

async function collectPaystackPeopleAndOrders() {
  const people = new Map<string, AdminPerson>();
  const orders: SellerOrder[] = [];
  const warnings: string[] = [];

  try {
    const customers = await listCustomers({ maxPages: 30 });
    for (const customer of customers) {
      const email = String(customer.email || '').trim().toLowerCase();
      if (!email) continue;
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || email.split('@')[0];
      upsert(people, {
        id: String(customer.customer_code || customer.id || email),
        email,
        name,
        role: 'buyer',
        orders: 0,
        spend: 0,
        source: 'paystack-customers',
      });
    }
  } catch (error) {
    warnings.push(`paystack-customers → ${error instanceof Error ? error.message : 'failed'}`);
  }

  try {
    const transactions = await listTransactions({ status: 'success', maxPages: 10 });
    for (const tx of transactions) {
      const meta = parsePaystackMetadata(tx.metadata);
      if (meta.type === 'seller_plan' || meta.planId) continue;

      const email = String(
        (meta.buyerEmail as string) ||
          (meta.billing as { email?: string } | undefined)?.email ||
          tx.customer?.email ||
          ''
      )
        .trim()
        .toLowerCase();
      const amount = Number(meta.amountNgn || (tx.amount || 0) / 100);
      const name = String(
        (meta.billing as { fullName?: string } | undefined)?.fullName || email.split('@')[0] || 'Customer'
      );

      if (email) {
        upsert(people, {
          id: email,
          email,
          name,
          role: 'buyer',
          orders: 1,
          spend: amount,
          source: 'paystack',
        });
      }

      const sellerIds = Array.isArray(meta.sellerIds)
        ? meta.sellerIds.map((id) => String(id))
        : [];
      const fromPayment = sellerOrdersFromPayment({
        reference: tx.reference,
        amountKobo: tx.amount,
        paidAt: tx.paid_at,
        metadata: meta,
        customerEmail: email,
        sellerIds: sellerIds.length ? sellerIds : email ? ['marketplace'] : [],
      });

      if (fromPayment.length) {
        orders.push(...fromPayment);
      } else if (email) {
        orders.push({
          _id: `paystack_${tx.reference}`,
          sellerId: sellerIds[0] || 'marketplace',
          reference: tx.reference,
          status: 'pending',
          createdAt: tx.paid_at || new Date().toISOString(),
          buyer: { name, email },
          shippingAddress: {
            fullName: name,
            address: '',
            city: '',
            state: '',
            postalCode: '',
          },
          items: [{ name: 'Order', quantity: 1, price: amount }],
          quantity: 1,
          amountNgn: amount,
        });
      }
    }
  } catch (error) {
    warnings.push(`paystack → ${error instanceof Error ? error.message : 'failed'}`);
  }

  return { people, orders, warnings };
}

async function collectCatalogSellers(ranks: Record<string, string>) {
  const people = new Map<string, AdminPerson>();
  const warnings: string[] = [];

  try {
    const listRes = await fetch(`${API_URL}/api/products`, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    const payload = listRes.ok ? await listRes.json().catch(() => null) : null;
    const products = extractArray(payload);
    const sellerListings = new Map<string, number>();
    const sellerMeta = new Map<string, { name?: string; email?: string }>();

    for (const item of products) {
      if (!item || typeof item !== 'object') continue;
      const product = item as Record<string, unknown>;
      const sellerObj =
        product.seller && typeof product.seller === 'object'
          ? (product.seller as Record<string, unknown>)
          : null;
      const sellerId = String(
        product.sellerId || sellerObj?._id || sellerObj?.id || product.userId || ''
      );
      if (!sellerId) continue;
      sellerListings.set(sellerId, (sellerListings.get(sellerId) || 0) + 1);
      if (sellerObj) {
        sellerMeta.set(sellerId, {
          name: String(sellerObj.name || sellerObj.businessName || ''),
          email: String(sellerObj.email || '').toLowerCase(),
        });
      }
    }

    await Promise.all(
      [...sellerListings.keys()].slice(0, 80).map(async (sellerId) => {
        const cached = sellerMeta.get(sellerId);
        if (cached?.email || cached?.name) {
          upsert(people, {
            id: sellerId,
            email: cached.email || '',
            name: cached.name || sellerId,
            role: 'seller',
            orders: 0,
            spend: 0,
            listings: sellerListings.get(sellerId) || 0,
            plan: ranks[sellerId] || 'commission',
            source: 'catalog',
          });
          return;
        }
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
          // ignore individual seller lookup failures
        }
      })
    );
  } catch (error) {
    warnings.push(`catalog → ${error instanceof Error ? error.message : 'failed'}`);
  }

  return { people, warnings };
}

export async function collectAdminPeople(authHeader: string) {
  const people = new Map<string, AdminPerson>();
  const ranks = await getAllSellerPlanRanks();
  const sources: string[] = [];
  const warnings: string[] = [];
  const orderMap = new Map<string, SellerOrder>();
  const adminAuth = await resolveBackendAdminAuth(authHeader);

  const [backendUsers, backendOrders, paystack, catalog, localOrders, directory] = await Promise.all([
    collectBackendUsers(adminAuth, ranks),
    collectBackendOrders(adminAuth),
    collectPaystackPeopleAndOrders(),
    collectCatalogSellers(ranks),
    getAllSellerOrders(),
    listDirectoryUsers().catch(() => []),
  ]);

  for (const person of backendUsers.people.values()) upsert(people, person);
  if (backendUsers.sources.length) sources.push(...backendUsers.sources);
  warnings.push(...backendUsers.warnings);

  for (const person of paystack.people.values()) upsert(people, person);
  if (paystack.people.size) sources.push('paystack');
  warnings.push(...paystack.warnings);

  for (const person of catalog.people.values()) upsert(people, person);
  if (catalog.people.size) sources.push('catalog');
  warnings.push(...catalog.warnings);

  for (const user of directory) {
    upsert(people, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      orders: 0,
      spend: 0,
      source: 'directory',
    });
  }
  if (directory.length) sources.push('directory');

  for (const order of [...backendOrders.orders, ...paystack.orders, ...localOrders]) {
    if (!order?._id) continue;
    orderMap.set(order._id, order);
  }
  if (backendOrders.orders.length) sources.push('backend-orders');
  if (localOrders.length) sources.push('orders');
  warnings.push(...backendOrders.warnings);

  for (const order of orderMap.values()) {
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
    if (order.sellerId && order.sellerId !== 'marketplace') {
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

  return {
    people: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sources: [...new Set(sources)],
    warnings: [...new Set(warnings)].slice(0, 12),
    orders: [...orderMap.values()].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ),
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

export function isUserRole(role: string) {
  const value = normalizeRole(role);
  return value !== 'seller' && value !== 'admin';
}

export async function buildPersonActivity(
  person: AdminPerson,
  orders: Awaited<ReturnType<typeof getAllSellerOrders>>
) {
  const buyerOrders = orders.filter(
    (order) =>
      String(order.buyer?.email || '').toLowerCase() === person.email.toLowerCase() ||
      (person.email &&
        String(order.buyer?.email || '')
          .toLowerCase()
          .includes(person.email.toLowerCase()))
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
