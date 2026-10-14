'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import DualNavbarSell from '../components/DualNavbarSell';
import ProductCard from '../components/ProductCard';
import { enrichProductsWithCurrency } from '@/lib/productCurrency';
import { boostProductsByPlan } from '@/lib/boostProducts';
import { homePathForRole } from '@/lib/authRouting';

export default function ForYouPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goBack = () => {
    try {
      const referrer = document.referrer;
      if (referrer) {
        const from = new URL(referrer);
        if (from.origin === window.location.origin && from.pathname !== '/for-you') {
          router.back();
          return;
        }
      }
    } catch {
      // ignore bad referrer
    }
    router.push(homePathForRole(localStorage.getItem('role')));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await axios.get(`${apiUrl}/api/products/random`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          timeout: 30000,
        });
        const list = Array.isArray(res.data) ? res.data : res.data?.products || [];
        const enriched = await boostProductsByPlan(await enrichProductsWithCurrency(list));
        setProducts(enriched.filter((product) => product?._id && product?.images?.[0]));
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <DualNavbarSell />
      <main className="flex-1">
        <div className="px-4 md:px-8 lg:px-16 py-8">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-green-950 transition hover:border-green-900 hover:bg-green-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

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
