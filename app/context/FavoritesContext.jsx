'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshAccessToken } from '../utils/auth';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favoriteProducts, setFavoriteProducts] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorites on component mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
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
            setIsLoading(false);
            return;
          }
        } else {
          throw err;
        }
      }

      if (res.ok) {
        const favorites = await res.json();
        const favoriteMap = new Map(
          favorites.map((fav) => [fav.productId, fav._id])
        );
        setFavoriteProducts(favoriteMap);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('403')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) return false;

      let res;
      try {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/favorites/${productId}`, {
          method: 'POST',
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
            res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/favorites/${productId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return false;
          }
        } else {
          throw err;
        }
      }

      if (res.ok) {
        const favorite = await res.json();
        setFavoriteProducts(prev => new Map(prev.set(productId, favorite._id)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('403')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      
      return false;
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      const favoriteId = favoriteProducts.get(productId);
      if (!favoriteId) return false;

      let token = localStorage.getItem('accessToken');
      if (!token) return false;

      let res;
      try {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/favorites/${favoriteId}`, {
          method: 'DELETE',
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
            res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/favorites/${favoriteId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return false;
          }
        } else {
          throw err;
        }
      }

      if (res.ok) {
        setFavoriteProducts(prev => {
          const newMap = new Map(prev);
          newMap.delete(productId);
          return newMap;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('403')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      
      return false;
    }
  };

  const toggleFavorite = async (productId) => {
    const isFavorited = favoriteProducts.has(productId);
    if (isFavorited) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  };

  const isFavorited = (productId) => {
    return favoriteProducts.has(productId);
  };

  const value = {
    favoriteProducts,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    fetchFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 