'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Mail,
  Shield,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import { adminFetch } from '../components/admin/adminApi';

type Overview = {
  orders: number;
  revenue: number;
  unread: number;
  reports: number;
  listings: number;
  sellers: number;
  paidPlans?: number;
  recent: Array<{
    id: string;
    reference: string;
    buyer: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

type Health = {
  healthy: boolean;
  checks: Array<{ id: string; label: string; ok: boolean; ms?: number }>;
};

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

const QUICK = [
  { href: '/admin/orders', label: 'Update fulfillment', icon: ShoppingBag },
  { href: '/admin/mail?folder=reports', label: 'Triage reports', icon: AlertTriangle },
  { href: '/admin/catalog', label: 'Moderate listings', icon: Boxes },
  { href: '/admin/sellers', label: 'Review sellers', icon: Store },
  { href: '/admin/users', label: 'Track users', icon: Users },
  { href: '/admin/security', label: 'Security center', icon: Shield },
  { href: '/admin/health', label: 'System health', icon: Activity },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/overview').then(setData).catch(() => setData(null));
    adminFetch('/api/admin/health').then(setHealth).catch(() => setHealth(null));
  }, []);

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-gray-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Orders', value: data.orders, href: '/admin/orders' },
    { label: 'Revenue', value: money(data.revenue), href: '/admin/analytics' },
    { label: 'Unread mail', value: data.unread, href: '/admin/mail' },
    { label: 'Reports', value: data.reports, href: '/admin/mail?folder=reports' },
    { label: 'Listings', value: data.listings, href: '/admin/catalog' },
    { label: 'Sellers', value: data.sellers, href: '/admin/sellers' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Command center</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Operate orders, catalog, people, and security from one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/analytics" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:border-emerald-600">
            Analytics
          </Link>
          <Link href="/admin/security" className="rounded-lg bg-[#0b1220] px-3 py-2 text-sm font-medium text-white hover:bg-black">
            Security
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-gray-200 bg-white p-3 transition hover:border-emerald-500 md:p-4"
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight md:text-xl">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-emerald-800">
              All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="px-4 py-10 text-sm text-gray-500">No recent orders</p>
          ) : (
            <ul>
              {data.recent.map((order) => (
                <li key={order.id} className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.reference || order.id}</p>
                    <p className="truncate text-gray-500">{order.buyer}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{money(order.amount)}</p>
                    <p className="capitalize text-gray-500">{order.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">System pulse</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${health?.healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {health?.healthy ? 'Healthy' : 'Needs attention'}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {(health?.checks || []).slice(0, 5).map((check) => (
                <li key={check.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{check.label}</span>
                  <span className={check.ok ? 'text-emerald-700' : 'text-amber-700'}>
                    {check.ok ? 'OK' : 'Check'}
                    {check.ms ? ` · ${check.ms}ms` : ''}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/admin/health" className="mt-3 inline-block text-sm font-medium text-emerald-800">
              Open health
            </Link>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-semibold">Inbox pressure</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{data.unread}</p>
            <p className="text-sm text-gray-500">{data.reports} report threads waiting</p>
            <Link href="/admin/mail" className="mt-3 inline-block text-sm font-medium text-emerald-800">
              Open mail
            </Link>
          </section>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-gray-200 bg-white p-3 transition hover:border-emerald-500"
              >
                <Icon className="h-4 w-4 text-emerald-700" />
                <p className="mt-2 text-sm font-medium leading-snug">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
