import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { expandIdentityKeys } from '@/lib/accountIdentity';
import { getBuyerOrders, type SellerOrder } from '@/lib/sellerOrderStore';
import { initialTimeline, trackingHeadline, type TrackingEvent } from '@/lib/tracking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function normalizeStatus(status?: string): SellerOrder['status'] {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'delivered') return 'delivered';
  if (value === 'shipped' || value === 'in_transit') return 'shipped';
  if (value === 'cancelled') return 'cancelled';
  return 'pending';
}

function toBuyerOrder(order: SellerOrder) {
  const status = normalizeStatus(order.status);
  const timeline: TrackingEvent[] = order.timeline?.length
    ? order.timeline
    : initialTimeline(order.createdAt);
  return {
    _id: order._id,
    product: order.items?.map((item) => item.name).filter(Boolean).join(', ') || 'Order',
    price: Number(order.amountNgn || 0),
    quantity: Number(order.quantity || 1),
    status,
    createdAt: order.createdAt,
    reference: order.reference,
    trackingNumber: order.trackingNumber || '',
    courierName: order.courierName || '',
    timeline,
    trackingLabel: trackingHeadline(status, order.trackingNumber),
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandIdentityKeys(authHeader);
  const stored = await getBuyerOrders(keys);
  const merged = new Map<string, ReturnType<typeof toBuyerOrder>>();

  for (const order of stored) {
    const mapped = toBuyerOrder(order);
    merged.set(mapped.reference || mapped._id, mapped);
    merged.set(mapped._id, mapped);
  }

  try {
    const response = await axios.get(`${API_URL}/api/orders`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });
    const list = Array.isArray(response.data) ? response.data : [];
    for (const raw of list) {
      const reference = String(raw.paymentReference || raw.reference || raw._id || '');
      const existing = merged.get(reference) || merged.get(String(raw._id || ''));
      if (existing) {
        if (!existing.product && raw.product) existing.product = String(raw.product);
        if (!existing.price && raw.price) existing.price = Number(raw.price);
        continue;
      }
      const status = normalizeStatus(raw.status);
      const createdAt = String(raw.createdAt || new Date().toISOString());
      merged.set(reference || String(raw._id), {
        _id: String(raw._id || reference),
        product: String(raw.product || 'Order'),
        price: Number(raw.price || 0),
        quantity: Number(raw.quantity || 1),
        status,
        createdAt,
        reference,
        trackingNumber: String(raw.trackingNumber || ''),
        courierName: String(raw.courierName || ''),
        timeline: initialTimeline(createdAt),
        trackingLabel: trackingHeadline(status, raw.trackingNumber),
      });
    }
  } catch {
    // store orders are enough if the backend order list is unavailable
  }

  const orders = [...new Map([...merged.values()].map((order) => [order._id, order])).values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ orders });
}
