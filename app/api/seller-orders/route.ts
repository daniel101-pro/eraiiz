import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { expandIdentityKeys } from '@/lib/accountIdentity';
import { sellerOrdersFromPaystack } from '@/lib/marketplaceOrders';
import {
  addSellerOrder,
  getSellerOrders,
  updateSellerOrder,
  type SellerOrder,
} from '@/lib/sellerOrderStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function mergeOrders(...lists: SellerOrder[][]) {
  const merged = new Map<string, SellerOrder>();
  for (const list of lists) {
    for (const item of list) {
      if (!item?._id) continue;
      if (!merged.has(item._id)) merged.set(item._id, item);
    }
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function fromBackendOrder(order: Record<string, unknown>, fallbackSellerId: string): SellerOrder | null {
  const sellerId = String(order.sellerId || fallbackSellerId || '');
  if (!sellerId) return null;
  const billing = (order.billingAddress || {}) as Record<string, string>;
  const name = String(order.product || order.name || 'Product');
  const quantity = Number(order.quantity || 1);
  return {
    _id: String(order._id || `sale_${order.paymentReference || name}`),
    sellerId,
    reference: String(order.paymentReference || order._id || ''),
    status: String(order.status || 'pending').toLowerCase() === 'delivered'
      ? 'delivered'
      : String(order.status || '').toLowerCase() === 'shipped'
        ? 'shipped'
        : 'pending',
    createdAt: String(order.createdAt || new Date().toISOString()),
    buyer: {
      name: String(billing.fullName || order.buyerName || 'Customer'),
      email: String(billing.email || order.buyerEmail || ''),
      phone: billing.phone,
    },
    shippingAddress: {
      fullName: String(billing.fullName || ''),
      address: String(billing.address || billing.houseAddress || ''),
      city: String(billing.city || ''),
      state: String(billing.state || ''),
      postalCode: String(billing.postalCode || billing.postalAddress || ''),
      phone: billing.phone,
    },
    items: [
      {
        productId: String(order.productId || ''),
        name,
        quantity,
        selectedSize: String(order.selectedSize || ''),
        price: Number(order.price || 0),
      },
    ],
    quantity,
    amountNgn: Number(order.price || 0),
  };
}

async function backendSellerOrders(authHeader: string, keys: string[]) {
  const keySet = new Set(keys);
  const urls = [
    `${API_URL}/api/orders`,
    `${API_URL}/api/seller/orders`,
    `${API_URL}/api/orders/seller`,
  ];
  const found: SellerOrder[] = [];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: authHeader },
        timeout: 8000,
      });
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : payload?.orders || payload?.data || [];
      if (!Array.isArray(list)) continue;
      for (const raw of list) {
        const sellerId = String(raw?.sellerId || '');
        const isBuyerOrdersEndpoint = url.endsWith('/api/orders');
        if (isBuyerOrdersEndpoint && (!sellerId || !keySet.has(sellerId))) {
          continue;
        }
        const mapped = fromBackendOrder(raw, keys[0]);
        if (mapped) found.push(mapped);
      }
      if (found.length) break;
    } catch {
      // try the next endpoint
    }
  }

  return found;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandIdentityKeys(authHeader);
  const stored = await getSellerOrders(keys);
  const storedIds = new Set(stored.map((order) => order._id));
  const fromPaystack = await sellerOrdersFromPaystack(keys).catch((error) => {
    console.error('Failed to recover seller orders from Paystack', error);
    return [] as SellerOrder[];
  });

  for (const order of fromPaystack) {
    if (storedIds.has(order._id)) continue;
    try {
      await addSellerOrder([order.sellerId, ...keys], order);
      storedIds.add(order._id);
    } catch (error) {
      console.error('Failed to persist recovered seller order', error);
    }
  }

  const fromBackend = await backendSellerOrders(authHeader, keys);
  const freshStored = await getSellerOrders(keys);
  const orders = mergeOrders(freshStored, fromPaystack, fromBackend);

  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const keys = await expandIdentityKeys(authHeader);
  const items = Array.isArray(body.items) ? body.items : [];
  const quantity = items.reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 1), 0);
  const order: SellerOrder = {
    _id: String(body._id || `sale_${Date.now()}`),
    sellerId: keys[0],
    reference: String(body.reference || ''),
    status: 'pending',
    createdAt: new Date().toISOString(),
    buyer: {
      name: String(body.buyer?.name || body.billing?.fullName || 'Customer'),
      email: String(body.buyer?.email || body.billing?.email || ''),
      phone: body.buyer?.phone || body.billing?.phone,
    },
    shippingAddress: {
      fullName: String(body.billing?.fullName || body.shippingAddress?.fullName || ''),
      address: String(body.billing?.address || body.shippingAddress?.address || ''),
      city: String(body.billing?.city || body.shippingAddress?.city || ''),
      state: String(body.billing?.state || body.shippingAddress?.state || ''),
      postalCode: String(body.billing?.postalCode || body.shippingAddress?.postalCode || ''),
      phone: body.billing?.phone || body.shippingAddress?.phone,
    },
    items: items.map((item: Record<string, unknown>) => ({
      productId: String(item.productId || item._id || ''),
      name: String(item.name || 'Product'),
      quantity: Number(item.quantity || 1),
      selectedSize: item.selectedSize ? String(item.selectedSize) : undefined,
      price: Number(item.price || 0),
      currency: item.currency ? String(item.currency) : undefined,
    })),
    quantity,
    amountNgn: Number(body.amountNgn || 0),
  };

  await addSellerOrder(keys, order);
  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body?._id || '');
  const status = body?.status as SellerOrder['status'] | undefined;
  if (!id) {
    return NextResponse.json({ message: 'Order id is required' }, { status: 400 });
  }

  const keys = await expandIdentityKeys(authHeader);
  const updated = await updateSellerOrder(keys, id, {
    ...(status ? { status } : {}),
    ...(body.trackingNumber ? { trackingNumber: String(body.trackingNumber) } : {}),
    ...(body.courierName ? { courierName: String(body.courierName) } : {}),
  });
  return NextResponse.json(updated || { _id: id, status });
}
