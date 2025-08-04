'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import DualNavSell from '../components/DualNavbarSell';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async (searchQuery) => {
    if (!searchQuery) return;
    
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Access token not found in localStorage');
      }

      const res = await axios.get(
        `${apiUrl}/api/products/?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      // Handle both response formats (array or {products: array})
      const productsData = Array.isArray(res.data) ? res.data : res.data.products;
      
      if (!productsData || !Array.isArray(productsData)) {
        throw new Error('Invalid response format');
      }

      setProducts(productsData);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to search products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      fetchProducts(query);
    }
  }, [searchParams]);

  const query = searchParams.get('q');

  return (
    <div>
      <DualNavSell />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">
            {query ? `Search Results for "${query}"` : 'Search Products'}
          </h1>
        </div>

        {error && (
          <div className="text-red-600 mb-6 text-center">{error}</div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && products.length === 0 && !error && query && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg mb-2">No products found for "{query}"</div>
            <p className="text-sm text-gray-500">Try searching with different keywords or browse our categories</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}