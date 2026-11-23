'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DualNavbarSell from '../components/DualNavbarSell';
import ProductCard from '../components/ProductCard';
import { enrichProductsWithCurrency } from '@/lib/productCurrency';
import { boostProductsByPlan } from '@/lib/boostProducts';

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

        const firstPass = usableProducts(await boostProductsByPlan(list));
        if (!cancelled) {
          setProducts(firstPass);
          setLoading(false);
        }

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
          setError(err.message || 'Failed to fetch products');
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DualNavbarSell />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-10 pt-4 sm:px-4 sm:pt-5 lg:px-6">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[#E5E5E5] pb-3">
            <p className="text-sm font-medium text-[#1A1A1A]">Shop</p>
            <p className="text-xs text-[#666666]">
              {loading ? 'Loading…' : `${products.length} products`}
            </p>
          </div>

          {loading && (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
            </div>
          )}

          {!loading && error && (
            <div className="py-16 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="text-sm text-gray-600">No products available at the moment.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid items-stretch gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
