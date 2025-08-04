'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import DualNavbarSell from '../../components/DualNavbarSell';
import ProductCard from '../../components/ProductCard';

const validCategories = {
  plastic: 'Plastic Made Products',
  glass: 'Glass Made Products',
  rubber: 'Rubber Made Products',
  wood: 'Wood Made Products',
  'palm-frond': 'Palm Frond Made Products',
  recycled: 'General Recycled Items',
  fruits: 'Fruits Waste Products',
  palm: 'Palm Made Products',
  others: 'Other Products',
};

const categoryColors = {
  plastic: 'bg-blue-100 text-blue-800 border-blue-200',
  glass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  rubber: 'bg-gray-100 text-gray-800 border-gray-200',
  wood: 'bg-amber-100 text-amber-800 border-amber-200',
  'palm-frond': 'bg-orange-100 text-orange-800 border-orange-200',
  recycled: 'bg-green-100 text-green-800 border-green-200',
  fruits: 'bg-red-100 text-red-800 border-red-200',
  palm: 'bg-orange-100 text-orange-800 border-orange-200',
  others: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function CategoryPage({ params }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryId = React.use(params)?.category;
  const categoryName = validCategories[categoryId];

  useEffect(() => {
    document.title = `${categoryName || 'Category'} | Eraiiz`;
    if (!categoryName) {
      notFound();
      return;
    }

    const fetchProducts = async () => {
      try {
        console.log(`Fetching products for category: ${categoryName}, URL: ${process.env.NEXT_PUBLIC_API_URL}/api/products`);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
          params: { category: categoryName },
          timeout: 30000,
        });
        console.log(`Client: ${categoryName} Products Response:`, response.data);

        // Handle different response formats
        let productData;
        if (Array.isArray(response.data)) {
          productData = response.data;
        } else if (response.data?.products && Array.isArray(response.data.products)) {
          productData = response.data.products;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          productData = response.data.data;
        } else if (response.data === null || response.data === undefined || (typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
          productData = [];
        } else {
          throw new Error(`Unexpected API response format: ${JSON.stringify(response.data)}`);
        }

        setProducts(productData);
      } catch (err) {
        console.error(`Client: ${categoryName} Fetch Error:`, err.response?.data || err.message, err.config?.url);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  const getCategoryColor = (categoryId) => {
    return categoryColors[categoryId] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <>
      <DualNavbarSell />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center mb-4 mt-8">
              <Link 
                href="/categories" 
                className="flex items-center text-xs text-[#3F8E3F] hover:text-[#357C35] font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Categories
              </Link>
            </div>

            {/* Category Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-3 ${getCategoryColor(categoryId)}">
                {categoryName}
              </div>
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-2">
                {categoryName}
              </h1>
              <p className="text-xs text-gray-600">
                Discover sustainable {categoryName.toLowerCase()} for your eco-friendly lifestyle
              </p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Category Stats */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
            
            <Link
              href="/categories"
              className="text-xs text-[#3F8E3F] hover:text-[#357C35] font-medium"
            >
              View All Categories
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F8E3F]"></div>
              <span className="ml-3 text-sm text-gray-600">Loading products...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error Loading Products</h3>
              <p className="text-xs text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#3F8E3F] text-white text-xs rounded-lg hover:bg-[#357C35] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    No products available in {categoryName.toLowerCase()} yet.
                  </p>
                  <Link
                    href="/categories"
                    className="px-4 py-2 bg-[#3F8E3F] text-white text-xs rounded-lg hover:bg-[#357C35] transition-colors"
                  >
                    Browse Other Categories
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Category Overview */}
          {!loading && !error && products.length > 0 && (
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Category Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Total Products</p>
                  <p className="font-semibold text-gray-900">{products.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price Range</p>
                  <p className="font-semibold text-gray-900">
                    ₦{Math.min(...products.map(p => p.price)).toLocaleString()} - ₦{Math.max(...products.map(p => p.price)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Average Rating</p>
                  <p className="font-semibold text-gray-900">
                    {(products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length).toFixed(1)} ⭐
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-semibold text-[#3F8E3F]">{categoryName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';