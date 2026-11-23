'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  seller: string;
  category: string;
};

function downloadCsv(products: Product[]) {
  const header = ['id', 'name', 'seller', 'category', 'currency', 'price'];
  const rows = products.map((product) =>
    [product.id, product.name, product.seller, product.category, product.currency, product.price]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eraiiz-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = async (q = query) => {
    const data = await adminFetch(`/api/admin/catalog?q=${encodeURIComponent(q)}`);
    setProducts(data.products || []);
  };

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.category).filter(Boolean));
    return ['all', ...[...set].sort()];
  }, [products]);

  const filtered = useMemo(
    () => (category === 'all' ? products : products.filter((product) => product.category === category)),
    [products, category]
  );

  const remove = async (id: string) => {
    if (!window.confirm('Remove this listing permanently?')) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/catalog?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="text-sm text-gray-500">{filtered.length} listings · filter, export, moderate</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load();
            }}
            placeholder="Search products"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:w-64"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {categories.map((value) => (
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

      <div className="mt-4 space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">No listings</p>
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {product.seller || '—'} · {product.category || '—'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {product.currency} {Number(product.price || 0).toLocaleString()}
                </p>
                <button type="button" disabled={busy} onClick={() => remove(product.id)} className="text-sm text-red-700 disabled:opacity-50">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No listings
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.seller || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                  <td className="px-4 py-3">
                    {product.currency} {Number(product.price || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" disabled={busy} onClick={() => remove(product.id)} className="text-sm text-red-700 disabled:opacity-50">
                      Remove
                    </button>
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
