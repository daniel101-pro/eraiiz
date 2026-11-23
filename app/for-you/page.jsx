'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import DualNavbarSell from '../components/DualNavbarSell';
import ProductCard from '../components/ProductCard';
import { enrichProductsWithCurrency } from '@/lib/productCurrency';
import { boostProductsByPlan } from '@/lib/boostProducts';

const CATEGORY_CHIPS = [
  { href: '/categories/plastic', label: 'Plastic' },
  { href: '/categories/glass', label: 'Glass' },
  { href: '/categories/rubber', label: 'Rubber' },
  { href: '/categories/wood', label: 'Wood' },
  { href: '/categories/palm-frond', label: 'Palm' },
  { href: '/categories/recycled', label: 'Recycled' },
  { href: '/categories/fruits', label: 'Fruits' },
  { href: '/categories', label: 'All' },
];

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[4/5] animate-pulse bg-gray-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function ForYouPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Shop | Eraiiz';

    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Prefer a full catalog for first impression; fall back to random.
        let list = [];
        try {
          const res = await axios.get(`${apiUrl}/api/products`, {
            headers,
            params: { limit: 48 },
            timeout: 30000,
          });
          list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        } catch {
          list = [];
        }

        if (!list.length) {
          const res = await axios.get(`${apiUrl}/api/products/random`, {
            headers,
            timeout: 30000,
          });
          list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        }

        const enriched = await boostProductsByPlan(await enrichProductsWithCurrency(list));
        setProducts(enriched.filter((product) => product?._id && product?.images?.[0]));
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const countLabel = useMemo(() => {
    if (loading) return 'Loading products…';
    if (!products.length) return 'No products yet';
    return `${products.length} product${products.length === 1 ? '' : 's'}`;
  }, [loading, products.length]);

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <DualNavbarSell />

      <main>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008C00]">
                Eraiiz shop
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Recycled products worth buying
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                Browse the catalog freely. Sign in only when you’re ready to checkout or save favorites.
              </p>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORY_CHIPS.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:border-green-600 hover:text-green-800"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Picked for you</h2>
              <p className="mt-0.5 text-sm text-gray-500">{countLabel}</p>
            </div>
            <Link href="/categories" className="text-sm font-semibold text-[#008C00] hover:text-green-800">
              View categories
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-gray-900">Couldn’t load products</p>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex rounded-xl bg-[#008C00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !error && products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-gray-900">No products available yet</p>
              <p className="mt-2 text-sm text-gray-500">Check back soon, or browse categories.</p>
              <Link
                href="/categories"
                className="mt-6 inline-flex rounded-xl bg-[#008C00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Browse categories
              </Link>
            </div>
          ) : null}

          {!loading && !error && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
