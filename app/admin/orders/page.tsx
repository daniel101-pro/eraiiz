'use client';

import { useEffect, useState } from 'react';
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');

  const load = async (q = query) => {
    const data = await adminFetch(`/api/admin/orders?q=${encodeURIComponent(q)}`);
    setOrders(data.orders || []);
  };

  useEffect(() => {
    load().catch(() => setOrders([]));
  }, []);

  const setStatus = async (id: string, status: string) => {
    await adminFetch('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    });
    load().catch(() => {});
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="hidden text-base font-semibold md:block">Orders</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load();
          }}
          placeholder="Search"
          className="w-full border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-900 focus:outline-none md:w-64"
        />
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {orders.length === 0 ? (
          <p className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Empty</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.reference || order.id}</p>
                  <p className="truncate text-xs text-gray-500">{order.buyer?.name || order.buyer?.email}</p>
                </div>
                <p className="shrink-0 text-sm">₦{Number(order.amount || 0).toLocaleString()}</p>
              </div>
              <p className="mt-2 truncate text-xs text-gray-500">
                {(order.items || []).map((item) => item.name).join(', ') || '—'}
              </p>
              <select
                value={order.status}
                onChange={(event) => setStatus(order.id, event.target.value)}
                className="mt-3 w-full border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="pending">pending</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Empty
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
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
                      onChange={(event) => setStatus(order.id, event.target.value)}
                      className="border border-gray-200 bg-white px-2 py-1 text-sm"
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
