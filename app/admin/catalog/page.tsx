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
    <div className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-base font-semibold">Catalog</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load();
          }}
          placeholder="Search"
          className="w-64 border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-900 focus:outline-none"
        />
      </div>
      <div className="mt-4 overflow-x-auto border border-gray-200 bg-white">
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
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="text-sm text-red-700 underline"
                    >
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
