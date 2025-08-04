'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface SearchResult {
  id: string;
  type: 'user' | 'product' | 'order' | 'review' | 'notification';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  performSearch: (term: string) => Promise<void>;
  clearSearch: () => void;
  navigateToResult: (result: SearchResult) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search across different endpoints
      const [usersResponse, productsResponse, ordersResponse] = await Promise.allSettled([
        api.get(`/admin/users?search=${encodeURIComponent(term)}&limit=5`),
        api.get(`/admin/products?search=${encodeURIComponent(term)}&limit=5`),
        api.get(`/admin/orders?search=${encodeURIComponent(term)}&limit=5`)
      ]);

      const results: SearchResult[] = [];

      // Process users
      if (usersResponse.status === 'fulfilled' && usersResponse.value.data.users) {
        usersResponse.value.data.users.forEach((user: any) => {
          results.push({
            id: user._id,
            type: 'user',
            title: user.name,
            subtitle: user.email,
            description: `${user.role} • ${user.isVerified ? 'Verified' : 'Unverified'}`,
            url: `/users`,
            icon: '👤',
            metadata: user
          });
        });
      }

      // Process products
      if (productsResponse.status === 'fulfilled' && productsResponse.value.data.products) {
        productsResponse.value.data.products.forEach((product: any) => {
          results.push({
            id: product._id,
            type: 'product',
            title: product.name,
            subtitle: `$${product.price}`,
            description: `${product.category} • ${product.stock} in stock`,
            url: `/products`,
            icon: '📦',
            metadata: product
          });
        });
      }

      // Process orders
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value.data.orders) {
        ordersResponse.value.data.orders.forEach((order: any) => {
          results.push({
            id: order._id,
            type: 'order',
            title: `Order #${order.orderNumber}`,
            subtitle: `$${order.totalAmount}`,
            description: `${order.status} • ${new Date(order.createdAt).toLocaleDateString()}`,
            url: `/orders`,
            icon: '🛒',
            metadata: order
          });
        });
      }

      // Add quick actions
      if (term.toLowerCase().includes('dashboard')) {
        results.unshift({
          id: 'dashboard',
          type: 'notification',
          title: 'Go to Dashboard',
          subtitle: 'View main dashboard',
          url: '/',
          icon: '📊'
        });
      }

      if (term.toLowerCase().includes('analytics')) {
        results.unshift({
          id: 'analytics',
          type: 'notification',
          title: 'View Analytics',
          subtitle: 'Check platform analytics',
          url: '/analytics',
          icon: '📈'
        });
      }

      if (term.toLowerCase().includes('settings')) {
        results.unshift({
          id: 'settings',
          type: 'notification',
          title: 'Settings',
          subtitle: 'Manage platform settings',
          url: '/settings',
          icon: '⚙️'
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const navigateToResult = (result: SearchResult) => {
    router.push(result.url);
    clearSearch();
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isSearchOpen,
    setIsSearchOpen,
    performSearch,
    clearSearch,
    navigateToResult
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 