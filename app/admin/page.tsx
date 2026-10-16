'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '../components/admin/adminApi';

type Overview = {
  orders: number;
  revenue: number;
  unread: number;
  support: number;
  reports: number;
  listings: number;
  sellers: number;
  paidPlans: number;
  recent: Array<{
    id: string;
    reference: string;
    buyer: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/overview').then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-gray-200 border-t-green-950 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Orders', value: data.orders, href: '/admin/orders' },
    { label: 'Revenue', value: money(data.revenue), href: '/admin/orders' },
    { label: 'Unread', value: data.unread, href: '/admin/mail' },
    { label: 'Reports', value: data.reports, href: '/admin/mail?folder=reports' },
    { label: 'Listings', value: data.listings, href: '/admin/catalog' },
    { label: 'Sellers', value: data.sellers, href: '/admin/people' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-base font-semibold">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="border border-gray-200 bg-white p-4 hover:border-green-800">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-green-800 underline">
            All
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <ul>
            {data.recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm last:border-0">
                <div>
                  <p className="font-medium">{order.reference || order.id}</p>
                  <p className="text-gray-500">{order.buyer}</p>
                </div>
                <div className="text-right">
                  <p>{money(order.amount)}</p>
                  <p className="text-gray-500">{order.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
