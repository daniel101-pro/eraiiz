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
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

function usableProducts(list) {
  return (Array.isArray(list) ? list : []).filter((product) => product?._id && product?.images?.[0]);
}

export default function ForYouPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Shop | Eraiiz';
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let list = [];
        try {
          const res = await axios.get(`${apiUrl}/api/products`, {
            headers,
            params: { limit: 48 },
            timeout: 15000,
          });
          list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        } catch {
          list = [];
        }

        if (!list.length) {
          const res = await axios.get(`${apiUrl}/api/products/random`, {
            headers,
            timeout: 15000,
          });
          list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        }

        // Paint immediately so visitors aren't stuck on skeletons
        const firstPass = usableProducts(await boostProductsByPlan(list));
        if (!cancelled) {
          setProducts(firstPass);
          setLoading(false);
        }

        // Refine currencies in the background with a hard budget
        const enriched = usableProducts(
          await boostProductsByPlan(
            await enrichProductsWithCurrency(list, { concurrency: 6, budgetMs: 7000 })
          )
        );
        if (!cancelled && enriched.length) {
          setProducts(enriched);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load products');
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const countLabel = useMemo(() => {
    if (loading) return 'Loading…';
    if (!products.length) return 'No products yet';
    return `${products.length} products`;
  }, [loading, products.length]);

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <DualNavbarSell />

      <main className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
              Shop recycled products
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">{countLabel}</p>
          </div>
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORY_CHIPS.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-green-600 hover:text-green-800"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-xl border border-red-100 bg-white px-5 py-10 text-center">
            <p className="font-medium text-gray-900">Couldn’t load products</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#008C00] px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !error && products.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center">
            <p className="font-medium text-gray-900">No products available yet</p>
            <Link
              href="/categories"
              className="mt-4 inline-flex rounded-lg bg-[#008C00] px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Browse categories
            </Link>
          </div>
        ) : null}

        {!loading && !error && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 pb-8 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
