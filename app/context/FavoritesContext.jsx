'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshAccessToken } from '../utils/auth';

const FavoritesContext = createContext();

async function favoritesFetch(path, method = 'GET') {
  let token = localStorage.getItem('accessToken');
  if (!token) return null;

  const send = (accessToken) =>
    fetch(process.env.NEXT_PUBLIC_API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

  let res = await send(token);
  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
    } catch {
      return res;
    }
    res = await send(token);
  }
  return res;
}

export function FavoritesProvider({ children }) {
  const [favoriteProducts, setFavoriteProducts] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await favoritesFetch('/api/favorites');
      if (res?.ok) {
        const favorites = await res.json();
        setFavoriteProducts(new Map(favorites.map((fav) => [fav.productId, fav._id])));
      } else {
        setFavoriteProducts(new Map());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavoriteProducts(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
    const onAuthChange = () => fetchFavorites();
    const onStorage = (event) => {
      if (event.key === 'accessToken') fetchFavorites();
    };
    window.addEventListener('eraiiz:auth-changed', onAuthChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('eraiiz:auth-changed', onAuthChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [fetchFavorites]);

  const addToFavorites = async (productId) => {
    try {
      const res = await favoritesFetch(`/api/favorites/${productId}`, 'POST');
      if (!res?.ok) return false;
      const favorite = await res.json();
      setFavoriteProducts((prev) => new Map(prev).set(productId, favorite._id));
      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      return false;
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      const favoriteId = favoriteProducts.get(productId);
      if (!favoriteId) return false;
      const res = await favoritesFetch(`/api/favorites/${favoriteId}`, 'DELETE');
      if (!res?.ok) return false;
      setFavoriteProducts((prev) => {
        const next = new Map(prev);
        next.delete(productId);
        return next;
      });
      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      return false;
    }
  };

  const toggleFavorite = async (productId) => {
    return favoriteProducts.has(productId)
      ? removeFromFavorites(productId)
      : addToFavorites(productId);
  };

  const isFavorited = (productId) => favoriteProducts.has(productId);

  const value = {
    favoriteProducts,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    fetchFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
