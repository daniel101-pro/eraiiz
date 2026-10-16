import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllSellerOrders, updateSellerOrder } from '@/lib/sellerOrderStore';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const orders = await getAllSellerOrders();
  const filtered = q
    ? orders.filter((order) =>
        [order.reference, order.buyer?.name, order.buyer?.email, order.sellerId, order.status]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : orders;

  return NextResponse.json({
    orders: filtered.map((order) => ({
      id: order._id,
      reference: order.reference,
      status: order.status,
      createdAt: order.createdAt,
      amount: order.amountNgn,
      buyer: order.buyer,
      sellerId: order.sellerId,
      items: order.items,
      trackingNumber: order.trackingNumber || '',
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.id || '');
  const status = body.status;
  if (!orderId || !['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return NextResponse.json({ message: 'Valid id and status required' }, { status: 400 });
  }

  const current = (await getAllSellerOrders()).find((order) => order._id === orderId);
  if (!current) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

  const updated = await updateSellerOrder([current.sellerId], orderId, { status });
  return NextResponse.json(updated);
}
