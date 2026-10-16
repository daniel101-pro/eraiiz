import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllSellerOrders } from '@/lib/sellerOrderStore';
import { adminMailCounts } from '@/lib/adminMailStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const [orders, mail, ranks] = await Promise.all([
    getAllSellerOrders(),
    adminMailCounts(),
    getAllSellerPlanRanks(),
  ]);

  let listings = 0;
  try {
    const response = await fetch(`${API_URL}/api/products`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.products || [];
      listings = list.length;
    }
  } catch {
    listings = 0;
  }

  const revenue = orders.reduce((sum, order) => sum + Number(order.amountNgn || 0), 0);
  const sellers = new Set(orders.map((order) => order.sellerId).filter(Boolean));
  const paidPlans = Object.values(ranks).filter((plan) => plan === 'growth' || plan === 'pro').length;

  return NextResponse.json({
    orders: orders.length,
    revenue,
    unread: mail.unread,
    support: mail.support,
    reports: mail.reports,
    listings,
    sellers: sellers.size,
    paidPlans,
    recent: orders.slice(0, 6).map((order) => ({
      id: order._id,
      reference: order.reference,
      buyer: order.buyer?.name || order.buyer?.email,
      amount: order.amountNgn,
      status: order.status,
      createdAt: order.createdAt,
    })),
  });
}
