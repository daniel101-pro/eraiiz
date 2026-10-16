import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllSellerOrders } from '@/lib/sellerOrderStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const orders = await getAllSellerOrders();
  const ranks = await getAllSellerPlanRanks();
  const people = new Map<
    string,
    { id: string; email: string; name: string; role: string; orders: number; spend: number; plan?: string }
  >();

  for (const order of orders) {
    const email = String(order.buyer?.email || '').toLowerCase();
    if (email) {
      const current = people.get(email) || {
        id: email,
        email,
        name: order.buyer?.name || email,
        role: 'buyer',
        orders: 0,
        spend: 0,
      };
      current.orders += 1;
      current.spend += Number(order.amountNgn || 0);
      people.set(email, current);
    }

    if (order.sellerId) {
      const key = `seller:${order.sellerId}`;
      const current = people.get(key) || {
        id: order.sellerId,
        email: '',
        name: order.sellerId,
        role: 'seller',
        orders: 0,
        spend: 0,
        plan: ranks[order.sellerId] || 'commission',
      };
      current.orders += 1;
      people.set(key, current);
    }
  }

  try {
    const response = await fetch(`${API_URL}/api/products`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.products || [];
      for (const item of list) {
        const seller = item.seller || {};
        const email = String(seller.email || '').toLowerCase();
        const id = String(seller._id || seller.id || item.sellerId || email);
        if (!id) continue;
        const key = email || `seller:${id}`;
        const current = people.get(key) || {
          id,
          email,
          name: String(seller.name || id),
          role: 'seller',
          orders: 0,
          spend: 0,
          plan: ranks[id] || 'commission',
        };
        current.name = current.name || seller.name || id;
        current.email = current.email || email;
        people.set(key, current);
      }
    }
  } catch {
    // local order data is enough
  }

  const list = [...people.values()].filter((person) =>
    q ? [person.name, person.email, person.role, person.id].join(' ').toLowerCase().includes(q) : true
  );

  return NextResponse.json({ people: list });
}
