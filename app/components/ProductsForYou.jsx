'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import { enrichProductsWithCurrency } from '@/lib/productCurrency';
import { boostProductsByPlan } from '@/lib/boostProducts';

export default function ProductsForYou({ limit = 8 }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await axios.get(`${apiUrl}/api/products/random?limit=${limit}`);
        setProducts(await boostProductsByPlan(await enrichProductsWithCurrency(res.data || [], { concurrency: 6, budgetMs: 7000 })));
      } catch (err) {
        console.error('ProductsForYou fetch error:', err.response?.data || err.message);
      }
    };
    fetchProducts();
  }, [limit]);

  if (!products.length) return null;

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">Products for You</h2>
      </div>
      <div className="grid items-stretch gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
} 