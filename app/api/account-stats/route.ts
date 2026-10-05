import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { expandIdentityKeys } from '@/lib/accountIdentity';
import { sellerOrdersFromPaystack } from '@/lib/marketplaceOrders';
import { getSellerOrders } from '@/lib/sellerOrderStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandIdentityKeys(authHeader);
  const keySet = new Set(keys);
  const storedOrders = await getSellerOrders(keys);
  const fromPaystack = await sellerOrdersFromPaystack(keys).catch(() => []);
  const sellerOrders = [...storedOrders];
  const seen = new Set(storedOrders.map((order) => order._id));
  for (const order of fromPaystack) {
    if (seen.has(order._id)) continue;
    sellerOrders.push(order);
    seen.add(order._id);
  }

  let purchases: Array<Record<string, unknown>> = [];
  try {
    const response = await axios.get(`${API_URL}/api/orders`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });
    purchases = Array.isArray(response.data) ? response.data : [];
  } catch {
    purchases = [];
  }

  const ownSalesFromPurchases = purchases.filter((order) =>
    keySet.has(String(order.sellerId || ''))
  );

  const spent = purchases.reduce((sum, order) => sum + Number(order.price || 0), 0);
  const salesAmount = [...sellerOrders, ...ownSalesFromPurchases].reduce((sum, order) => {
    return sum + Number((order as { amountNgn?: number; price?: number }).amountNgn || (order as { price?: number }).price || 0);
  }, 0);

  const salesCount = new Set([
    ...sellerOrders.map((order) => order._id),
    ...ownSalesFromPurchases.map((order) => String(order._id || '')),
  ]).size;

  return NextResponse.json({
    purchases: purchases.length,
    spent,
    salesCount,
    salesAmount,
    toShip: sellerOrders.filter((order) => order.status === 'pending').length,
  });
}
