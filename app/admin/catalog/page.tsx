'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  seller: string;
  category: string;
};

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');

  const load = async (q = query) => {
    const data = await adminFetch(`/api/admin/catalog?q=${encodeURIComponent(q)}`);
    setProducts(data.products || []);
  };

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Remove this listing?')) return;
    await adminFetch(`/api/admin/catalog?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    load().catch(() => {});
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="hidden text-base font-semibold md:block">Catalog</h1>
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
        {products.length === 0 ? (
          <p className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Empty</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {product.seller || '—'} · {product.category || '—'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm">
                  {product.currency} {Number(product.price || 0).toLocaleString()}
                </p>
                <button type="button" onClick={() => remove(product.id)} className="text-sm text-red-700">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto border border-gray-200 bg-white md:block">
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
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Empty
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.seller || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                  <td className="px-4 py-3">
                    {product.currency} {Number(product.price || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => remove(product.id)} className="text-sm text-red-700">
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
