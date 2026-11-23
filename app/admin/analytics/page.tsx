'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Analytics = {
  kpis: {
    orders: number;
    revenue: number;
    aov: number;
    conversionProxy: number;
    cancelRate: number;
    unreadMail: number;
    reports: number;
    paidPlans: number;
    sellers: number;
  };
  timeline: Array<{ date: string; orders: number; revenue: number }>;
  status: Array<{ name: string; value: number }>;
  categories: Array<{ name: string; value: number }>;
};

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(n: number) {
  return `${Math.round((n || 0) * 100)}%`;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/analytics').then(setData).catch(() => setData(null));
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(1, ...(data?.timeline.map((row) => row.revenue) || [1])),
    [data]
  );

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-gray-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Revenue', value: money(data.kpis.revenue) },
    { label: 'Orders', value: data.kpis.orders },
    { label: 'AOV', value: money(data.kpis.aov) },
    { label: 'Delivered rate', value: pct(data.kpis.conversionProxy) },
    { label: 'Cancel rate', value: pct(data.kpis.cancelRate) },
    { label: 'Paid plans', value: data.kpis.paidPlans },
    { label: 'Active sellers', value: data.kpis.sellers },
    { label: 'Unread mail', value: data.kpis.unreadMail },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">Revenue, fulfillment, and catalog demand signals.</p>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Revenue timeline</h2>
          <div className="mt-4 flex h-44 items-end gap-1">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-gray-500">No order history yet</p>
            ) : (
              data.timeline.map((row) => (
                <div key={row.date} className="group relative flex-1">
                  <div
                    className="w-full rounded-t bg-emerald-600/80 transition group-hover:bg-emerald-700"
                    style={{ height: `${Math.max(6, (row.revenue / maxRevenue) * 100)}%` }}
                    title={`${row.date}: ${money(row.revenue)} · ${row.orders} orders`}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Order status mix</h2>
          <ul className="mt-4 space-y-3">
            {data.status.map((row) => {
              const total = data.status.reduce((sum, item) => sum + item.value, 0) || 1;
              return (
                <li key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-gray-700">{row.name}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(row.value / total) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Top demand categories</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {data.categories.length === 0 ? (
            <p className="text-sm text-gray-500">No category signal yet</p>
          ) : (
            data.categories.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="truncate text-gray-700">{row.name}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
