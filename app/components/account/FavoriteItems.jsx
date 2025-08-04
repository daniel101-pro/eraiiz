'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshAccessToken } from '../../utils/auth';
import ProductCard from '../ProductCard';
import { Heart, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';

export default function FavoriteItems() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchFavorites = async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      let res;
      try {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/favorites', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
      } catch (err) {
        if (err.cause?.status === 401) {
          try {
            token = await refreshAccessToken();
            res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/favorites', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
            return;
          }
        } else {
          throw err;
        }
      }

      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else {
        throw new Error('Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-red-200 border-t-red-500"></div>
          <Heart className="absolute inset-0 m-auto h-6 w-6 sm:h-8 sm:w-8 text-red-500 animate-pulse" />
        </div>
        <p className="mt-4 text-sm sm:text-base text-gray-600">Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchFavorites}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-12 sm:py-20">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-3">
          No favorites yet
        </h3>
        <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
          Start exploring our amazing products and save your favorites here. 
          Your heart will thank you! ❤️
        </p>

        {/* CTA Button */}
        <button
          onClick={() => {
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                const role = parsedUser?.role || 'buyer';
                router.push(`/dashboard/${role}`);
              } else {
                router.push('/login');
              }
            } catch (err) {
              console.error('Error parsing user data:', err);
              router.push('/login');
            }
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Start Shopping</span>
        </button>

        {/* Fun Facts */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-700 font-medium">Save favorites</p>
            <p className="text-blue-600 text-xs">Quick access to products you love</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
            <Heart className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Smart recommendations</p>
            <p className="text-green-600 text-xs">Get suggestions based on your favorites</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm md:text-base lg:text-sm font-bold text-gray-900">Your Favorites</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {favorites.length > 0 
                ? `${favorites.length} ${favorites.length === 1 ? 'product' : 'products'} you love`
                : 'Products you love will appear here'
              }
            </p>
          </div>
        </div>

        {/* Stats */}
        {favorites.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {favorites.length} Favorites
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  {new Set(favorites.map(fav => fav.category)).size} Categories
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((favorite) => (
              <div key={favorite._id} className="group">
                <ProductCard 
                  product={{
                    _id: favorite.productId,
                    name: favorite.name,
                    price: favorite.price,
                    category: favorite.category,
                    images: favorite.images,
                    totalReviews: favorite.totalReviews,
                    averageRating: favorite.averageRating,
                    material: favorite.material
                  }} 
                />
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 sm:p-8 border border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Love what you see?
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Discover more amazing products and expand your collection
              </p>
              <button
                onClick={() => {
                  try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                      const parsedUser = JSON.parse(storedUser);
                      const role = parsedUser?.role || 'buyer';
                      router.push(`/dashboard/${role}`);
                    } else {
                      router.push('/login');
                    }
                  } catch (err) {
                    console.error('Error parsing user data:', err);
                    router.push('/login');
                  }
                }}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}