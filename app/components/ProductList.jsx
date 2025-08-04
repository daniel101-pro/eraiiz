'use client';

import { useState, useEffect } from 'react';
import { refreshAccessToken } from '../../app/utils/auth';
import ProductCard from './ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            window.location.href = '/login';
            return;
          }
          // Retry with new token
          const retryRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/products', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            credentials: 'include',
          });
          if (!retryRes.ok) throw new Error('Failed to fetch products');
          const data = await retryRes.json();
          setProducts(data);
        } else {
          throw new Error('Failed to fetch products');
        }
      } else {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) return <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}