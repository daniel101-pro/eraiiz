'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

export default function ProductsForYou({ limit = 8 }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await axios.get(`${apiUrl}/api/products/random?limit=${limit}`);
        setProducts(res.data || []);
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
} 