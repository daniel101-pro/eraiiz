'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Order = {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  amount: number;
  buyer: { name?: string; email?: string };
  items: Array<{ name: string; quantity: number }>;
};

const STATUSES = ['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const;

function downloadCsv(orders: Order[]) {
  const header = ['id', 'reference', 'status', 'amount', 'buyer', 'email', 'createdAt'];
  const rows = orders.map((order) =>
    [order.id, order.reference, order.status, order.amount, order.buyer?.name || '', order.buyer?.email || '', order.createdAt]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eraiiz-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async (q = query) => {
    const data = await adminFetch(`/api/admin/orders?q=${encodeURIComponent(q)}`);
    setOrders(data.orders || []);
    setSelected([]);
  };

  useEffect(() => {
    load().catch(() => setOrders([]));
  }, []);

  const filtered = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  const updateOne = async (id: string, status: string) => {
    setBusy(true);
    try {
      await adminFetch('/api/admin/orders', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const bulkUpdate = async (status: string) => {
    if (!selected.length) return;
    setBusy(true);
    try {
      for (const id of selected) {
        await adminFetch('/api/admin/orders', {
          method: 'PATCH',
          body: JSON.stringify({ id, status }),
        });
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((order) => order.id)));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500">{filtered.length} shown · search, filter, bulk update, export</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load();
            }}
            placeholder="Search reference, buyer, status"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof STATUSES)[number])}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:border-emerald-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="font-medium text-emerald-900">{selected.length} selected</span>
          <button type="button" disabled={busy} onClick={() => bulkUpdate('shipped')} className="rounded-lg bg-white px-2.5 py-1.5 font-medium text-emerald-900 disabled:opacity-50">
            Mark shipped
          </button>
          <button type="button" disabled={busy} onClick={() => bulkUpdate('delivered')} className="rounded-lg bg-white px-2.5 py-1.5 font-medium text-emerald-900 disabled:opacity-50">
            Mark delivered
          </button>
          <button type="button" disabled={busy} onClick={() => bulkUpdate('cancelled')} className="rounded-lg bg-white px-2.5 py-1.5 font-medium text-red-700 disabled:opacity-50">
            Cancel
          </button>
        </div>
      ) : null}

      <div className="mt-4 space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">No orders</p>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggle(order.id)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{order.reference || order.id}</p>
                      <p className="truncate text-xs text-gray-500">{order.buyer?.name || order.buyer?.email}</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium">₦{Number(order.amount || 0).toLocaleString()}</p>
                  </div>
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(event) => updateOne(order.id, event.target.value)}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="pending">pending</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </label>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No orders
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggle(order.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.reference || order.id}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.buyer?.name}</p>
                    <p className="text-xs text-gray-500">{order.buyer?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(order.items || []).map((item) => item.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">₦{Number(order.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={busy}
                      onChange={(event) => updateOne(order.id, event.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    >
                      <option value="pending">pending</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
