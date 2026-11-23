'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { adminFetch } from '../../components/admin/adminApi';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  status: string;
  material: string;
  sellerId: string;
  seller: string;
  image: string;
  images: string[];
  averageRating: number;
  totalReviews: number;
};

const CATEGORIES = [
  'Plastic Made Products',
  'Rubber Made Products',
  'Glass Made Products',
  'Wood Made Products',
  'Palm Frond Made Products',
  'General Recycled Items',
];

const STATUSES = ['active', 'inactive', 'draft', 'archived'];

function money(currency: string, amount: number) {
  const code = currency || 'NGN';
  if (code === 'NGN' || code === '₦') return `₦${Number(amount || 0).toLocaleString()}`;
  return `${code} ${Number(amount || 0).toLocaleString()}`;
}

function downloadCsv(products: Product[]) {
  const header = ['id', 'name', 'seller', 'category', 'status', 'currency', 'price', 'reviews'];
  const rows = products.map((product) =>
    [
      product.id,
      product.name,
      product.seller,
      product.category,
      product.status,
      product.currency,
      product.price,
      product.totalReviews,
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eraiiz-products-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    status: 'active',
    material: '',
  });
  const [notice, setNotice] = useState('');

  const load = async (overrides?: { q?: string; category?: string; status?: string }) => {
    setLoading(true);
    setError('');
    try {
      const q = overrides?.q ?? query;
      const cat = overrides?.category ?? category;
      const st = overrides?.status ?? status;
      const data = await adminFetch(
        `/api/admin/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}&status=${encodeURIComponent(st)}`
      );
      setProducts(data.products || []);
      if (Array.isArray(data.meta?.categories) && data.meta.categories.length) {
        setCategories(data.meta.categories);
      }
    } catch (err) {
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const totals = useMemo(
    () => ({
      count: products.length,
      active: products.filter((product) => product.status === 'active').length,
      value: products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    }),
    [products]
  );

  const openEdit = (product: Product) => {
    setEditing(product);
    setDraft({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: product.category || '',
      status: product.status || 'active',
      material: product.material || '',
    });
    setNotice('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    setNotice('');
    try {
      const data = await adminFetch('/api/admin/products', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editing.id,
          name: draft.name,
          description: draft.description,
          price: Number(draft.price),
          category: draft.category,
          status: draft.status,
          material: draft.material,
        }),
      });
      const updated = data.product as Product;
      setProducts((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...updated } : item)));
      setEditing(null);
      setNotice('Product updated');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete “${product.name}” permanently? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      const data = await adminFetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
      });
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      if (editing?.id === product.id) setEditing(null);
      setNotice(
        data?.suppressed
          ? 'Removed from the storefront (hidden while Render admin role is missing).'
          : 'Product deleted'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const setStatusQuick = async (product: Product, nextStatus: string) => {
    setBusy(true);
    try {
      const data = await adminFetch('/api/admin/products', {
        method: 'PATCH',
        body: JSON.stringify({ id: product.id, status: nextStatus }),
      });
      const updated = data.product as Product;
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, ...updated, status: nextStatus } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fully manage every listing — edit details, change status, or remove.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? 'Loading…'
              : `${totals.count} shown · ${totals.active} active · catalog value ${money('NGN', totals.value)}`}
          </p>
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
          {notice && !editing ? <p className="mt-1 text-sm text-emerald-700">{notice}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load();
            }}
            placeholder="Search name, seller, category…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:w-64"
          />
          <select
            value={category}
            onChange={(event) => {
              const value = event.target.value;
              setCategory(value);
              load({ category: value });
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value);
              load({ status: value });
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(products)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:border-emerald-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            Loading products…
          </p>
        ) : products.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            No products found
          </p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {product.seller || '—'} · {product.category || '—'}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{money(product.currency, product.price)}</p>
                  <p className="mt-1 text-xs capitalize text-gray-500">{product.status}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium"
                >
                  Edit
                </button>
                <Link
                  href={`/product/${product.id}`}
                  target="_blank"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium"
                >
                  View
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setStatusQuick(product, product.status === 'active' ? 'inactive' : 'active')
                  }
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {product.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(product)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
                >
                  Delete
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
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Reviews</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Loading products…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-gray-400">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.seller || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        product.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{money(product.currency, product.price)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {product.averageRating ? product.averageRating.toFixed(1) : '—'} · {product.totalReviews}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:border-emerald-700"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/product/${product.id}`}
                        target="_blank"
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:border-emerald-700"
                        title="View on storefront"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(product)}
                        className="rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Edit product</h2>
                <p className="text-xs text-gray-500">{editing.id}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {editing.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editing.image}
                  alt=""
                  className="h-40 w-full rounded-xl object-cover"
                />
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Price (NGN)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.price}
                    onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Category</span>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {[...new Set([...CATEGORIES, ...categories, draft.category].filter(Boolean))].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Material</span>
                <input
                  value={draft.material}
                  onChange={(event) => setDraft((prev) => ({ ...prev, material: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-emerald-700 focus:outline-none"
                />
              </label>

              {notice ? <p className="text-sm text-red-600">{notice}</p> : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={busy || !draft.name.trim()}
                  onClick={saveEdit}
                  className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <Link
                  href={`/product/${editing.id}`}
                  target="_blank"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                >
                  Open listing
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(editing)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                >
                  Delete product
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
