'use client';
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { boostProductsByPlan } from '@/lib/boostProducts';

export default function ProductsForYou({ limit = 8 }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/catalog/products?limit=${limit}`, { cache: 'default' });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data.products) ? data.products : [];
        setProducts(await boostProductsByPlan(list.slice(0, limit)));
      } catch (err) {
        console.error('ProductsForYou fetch error:', err.message);
      }
    };
    fetchProducts();
  }, [limit]);

  if (!products.length) return null;

  return (
    <div className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-800 sm:text-sm md:text-base">Products for You</h2>
      </div>
      <div className="grid items-stretch gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
