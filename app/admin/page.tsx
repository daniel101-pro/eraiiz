'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '../components/admin/adminApi';

type Overview = {
  orders: number;
  revenue: number;
  unread: number;
  reports: number;
  listings: number;
  sellers: number;
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
      <div className="flex h-[50vh] items-center justify-center">
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
    <div className="p-4 md:p-6">
      <h1 className="hidden text-base font-semibold md:block">Overview</h1>
      <div className="grid grid-cols-2 gap-2 md:mt-6 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="border border-gray-200 bg-white p-3 md:p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight md:mt-2 md:text-xl">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 border border-gray-200 bg-white md:mt-8">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-green-800">
            All
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500">Empty</p>
        ) : (
          <ul>
            {data.recent.map((order) => (
              <li key={order.id} className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.reference || order.id}</p>
                  <p className="truncate text-gray-500">{order.buyer}</p>
                </div>
                <div className="shrink-0 text-right">
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
