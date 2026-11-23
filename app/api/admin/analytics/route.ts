import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllSellerOrders } from '@/lib/sellerOrderStore';
import { adminMailCounts } from '@/lib/adminMailStore';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';
import { secureAdminJson } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const [orders, mail, ranks] = await Promise.all([
    getAllSellerOrders(),
    adminMailCounts(),
    getAllSellerPlanRanks(),
  ]);

  const byDay = new Map<string, { orders: number; revenue: number }>();
  const byStatus = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const order of orders) {
    const day = String(order.createdAt || '').slice(0, 10) || 'unknown';
    const bucket = byDay.get(day) || { orders: 0, revenue: 0 };
    bucket.orders += 1;
    bucket.revenue += Number(order.amountNgn || 0);
    byDay.set(day, bucket);

    const status = String(order.status || 'unknown');
    byStatus.set(status, (byStatus.get(status) || 0) + 1);

    for (const item of order.items || []) {
      const key = String((item as { category?: string; name?: string }).category || 'Uncategorized');
      byCategory.set(key, (byCategory.get(key) || 0) + Number((item as { quantity?: number }).quantity || 1));
    }
  }

  const timeline = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, value]) => ({ date, ...value }));

  const revenue = orders.reduce((sum, order) => sum + Number(order.amountNgn || 0), 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const delivered = byStatus.get('delivered') || 0;
  const cancelled = byStatus.get('cancelled') || 0;

  return secureAdminJson({
    kpis: {
      orders: orders.length,
      revenue,
      aov,
      conversionProxy: orders.length ? delivered / orders.length : 0,
      cancelRate: orders.length ? cancelled / orders.length : 0,
      unreadMail: mail.unread,
      reports: mail.reports,
      paidPlans: Object.values(ranks).filter((plan) => plan === 'growth' || plan === 'pro').length,
      sellers: new Set(orders.map((order) => order.sellerId).filter(Boolean)).size,
    },
    timeline,
    status: [...byStatus.entries()].map(([name, value]) => ({ name, value })),
    categories: [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value })),
  });
}
