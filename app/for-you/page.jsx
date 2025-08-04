'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import DualNavbarSell from '../components/DualNavbarSell';

export default function ForYouPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products/random`);
        if (!Array.isArray(res.data)) {
          throw new Error('Invalid product data received');
        }
        setProducts(res.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login'; // Redirect after logout
    } catch (err) {
      console.error('Logout error:', err);
      alert('Failed to log out. Please try again.');
    }
  };

  if (loading) return <p className="text-gray-600 text-center mt-12">Loading products...</p>;
  if (error) return <p className="text-red-600 text-center mt-12">{error}</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <DualNavbarSell />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-8">For You</h1>
          {products.length === 0 ? (
            <p className="text-gray-600">No products available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link href={`/product/${product._id}`} key={product._id}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded"
                    />
                    <h3 className="mt-2 text-sm font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-green-600 font-bold">₦{product.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Category: {product.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="bg-gray-100 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center border-t border-gray-200 pt-4 mb-4 text-xs text-gray-500">
            © {new Date().getFullYear()} ERaiiz. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}