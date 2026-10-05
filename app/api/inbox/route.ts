import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getIdentityFromAuthHeader } from '@/lib/sellerPayoutStore';
import {
  addInboxNotification,
  clearInboxForUsers,
  getInboxForUsers,
  markInboxRead,
  type InboxNotification,
} from '@/lib/orderInboxStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function inboxKeys(authHeader: string | null) {
  const identity = getIdentityFromAuthHeader(authHeader);
  return [...identity.ids, identity.email];
}

function mergeNotifications(...lists: InboxNotification[][]) {
  const merged = new Map<string, InboxNotification>();
  for (const list of lists) {
    for (const item of list) {
      if (!item?._id || !item.message) continue;
      if (!merged.has(item._id)) merged.set(item._id, item);
    }
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

async function expandKeys(authHeader: string, keys: Array<string | null | undefined>) {
  try {
    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: authHeader },
      timeout: 4000,
    });
    const user = response.data || {};
    return [...keys, user._id, user.id, user.userId, user.email];
  } catch {
    return keys;
  }
}

async function notificationsFromOrders(authHeader: string): Promise<InboxNotification[]> {
  try {
    const response = await axios.get(`${API_URL}/api/orders`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });
    const orders = Array.isArray(response.data) ? response.data : [];
    return orders.slice(0, 25).map((order: Record<string, unknown>) => {
      const product = String(order.product || order.name || 'a product');
      return {
        _id: `order_${order._id || order.paymentReference || product}`,
        userId: String(order.userId || ''),
        type: 'order',
        title: 'Order confirmed',
        message: `Your order for ${product} is confirmed. You can track it from Orders.`,
        read: false,
        createdAt: String(order.createdAt || new Date().toISOString()),
        link: '/account?section=Orders',
        data: {
          paymentReference: order.paymentReference,
        },
      };
    });
  } catch {
    return [];
  }
}

async function notificationsFromSellerSales(authHeader: string): Promise<InboxNotification[]> {
  try {
    const response = await axios.get(`${API_URL}/api/sales/seller/shipments?period=30d`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });
    const payload = response.data;
    const list = Array.isArray(payload)
      ? payload
      : payload?.shipments || payload?.orders || payload?.recentOrders || [];
    if (!Array.isArray(list)) return [];

    return list.slice(0, 25).map((item: Record<string, unknown>) => {
      const name = String(item.product || item.productName || item.name || 'a product');
      const id = item._id || item.id || item.paymentReference || name;
      return {
        _id: `sale_${id}`,
        userId: String(item.sellerId || ''),
        type: 'order',
        title: 'New order',
        message: `You sold ${name}. Open Shipping to fulfill this order.`,
        read: false,
        createdAt: String(item.createdAt || item.date || new Date().toISOString()),
        link: '/account?section=Shipping',
        data: {
          paymentReference: item.paymentReference,
        },
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandKeys(authHeader, inboxKeys(authHeader));
  const stored = await getInboxForUsers(keys);
  const fromOrders = await notificationsFromOrders(authHeader);
  const fromSales = await notificationsFromSellerSales(authHeader);

  return NextResponse.json(mergeNotifications(stored, fromOrders, fromSales));
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const message = String(body?.message || '').trim();
  if (!message) {
    return NextResponse.json({ message: 'Message is required' }, { status: 400 });
  }

  const keys = await expandKeys(authHeader, inboxKeys(authHeader));
  const created = await addInboxNotification(keys, {
    _id: String(body._id || `inbox_${Date.now()}`),
    type: String(body.type || 'order'),
    title: body.title ? String(body.title) : undefined,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    link: body.link ? String(body.link) : undefined,
    data:
      body.data && typeof body.data === 'object'
        ? { paymentReference: body.data.paymentReference, itemCount: body.data.itemCount }
        : undefined,
  });

  return NextResponse.json(created);
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body?._id || '');
  if (!id) {
    return NextResponse.json({ message: 'Notification id is required' }, { status: 400 });
  }

  const keys = await expandKeys(authHeader, inboxKeys(authHeader));
  const updated = await markInboxRead(keys, id, body.read !== false);
  return NextResponse.json(updated || { _id: id, read: true });
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandKeys(authHeader, inboxKeys(authHeader));
  await clearInboxForUsers(keys);
  return NextResponse.json({ success: true });
}
