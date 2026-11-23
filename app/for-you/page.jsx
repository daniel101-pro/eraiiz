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

        // Paint immediately so visitors aren't stuck loading
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
    <div className="flex flex-col min-h-screen bg-white">
      <DualNavbarSell />
      <main className="flex-1">
        <div className="px-4 md:px-8 lg:px-16 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Products for You</h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="text-gray-600">No products available at the moment.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
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
