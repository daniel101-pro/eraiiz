'use client';

import { useState, useEffect } from 'react';
import { refreshAccessToken } from '../../app/utils/auth';
import ProductCard from './ProductCard';
import { boostProductsByPlan } from '@/lib/boostProducts';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res = await fetch('/api/catalog/products?limit=48', {
        method: 'GET',
        headers,
        cache: 'default',
      });

      if (res.status === 401 && token) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          res = await fetch('/api/catalog/products?limit=48', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
            cache: 'default',
          });
        }
      }

      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || [];
      // Paint fast — skip N+1 currency enrichment on list views
      setProducts(await boostProductsByPlan(list));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
