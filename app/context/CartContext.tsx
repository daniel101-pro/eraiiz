'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from '../cart/types';
import axios from 'axios';
import { useCurrency } from './CurrencyContext';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  getCartTotal: () => number;
  clearCart: () => void;
  enrichedCartItems: CartItem[];
  isEnriching: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function mergeProduct(item: CartItem, fullProduct: any): CartItem {
  const sellerId =
    typeof fullProduct.sellerId === 'object'
      ? fullProduct.sellerId?._id || fullProduct.sellerId?.id
      : fullProduct.sellerId;

  return {
    ...item,
    carbonFootprint: fullProduct.carbonFootprint,
    sustainability: fullProduct.sustainability,
    material: fullProduct.material,
    details: fullProduct.details,
    bonus: fullProduct.bonus,
    name: fullProduct.name || item.name,
    price: getListingPrice(fullProduct) || item.price,
    currency: getProductCurrency(fullProduct) || item.currency || 'NGN',
    images: fullProduct.images || item.images,
    sellerId: sellerId ? String(sellerId) : item.sellerId,
  } as CartItem;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { convertPrice } = useCurrency();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [enrichedCartItems, setEnrichedCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const productCache = useRef(new Map<string, any>());

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart data:', error);
        setCartItems([]);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  useEffect(() => {
    if (!isInitialized || cartItems.length === 0) {
      setEnrichedCartItems([]);
      return;
    }

    let cancelled = false;
    const cache = productCache.current;
    const missing = Array.from(new Set(cartItems.map((item) => item._id))).filter((id) => !cache.has(id));

    const apply = () => {
      if (cancelled) return;
      setEnrichedCartItems(
        cartItems.map((item) => {
          const fullProduct = cache.get(item._id);
          return fullProduct ? mergeProduct(item, fullProduct) : item;
        })
      );
    };

    if (missing.length === 0) {
      apply();
      return;
    }

    setIsEnriching(true);
    Promise.all(
      missing.map((id) =>
        axios
          .get(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/public`, { timeout: 10000 })
          .then((response) => {
            if (response.data) cache.set(id, response.data);
          })
          .catch((error) => console.error(`Error fetching product ${id}:`, error?.message))
      )
    ).finally(() => {
      apply();
      if (!cancelled) setIsEnriching(false);
    });

    return () => {
      cancelled = true;
    };
  }, [cartItems, isInitialized]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        i => i._id === item._id && i.selectedSize === item.selectedSize
      );

      if (existingItem) {
        return prevItems.map(i =>
          i._id === item._id && i.selectedSize === item.selectedSize
            ? { ...i, quantity: i.quantity + (item.quantity || 1), currency: getProductCurrency(item) || i.currency || 'NGN' }
            : i
        );
      }

      return [...prevItems, { ...item, currency: getProductCurrency(item) }];
    });
  };

  const removeFromCart = (id: string, size: string) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item._id === id && item.selectedSize === size))
    );
  };

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity < 1) return;

    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === id && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getCartTotal = useCallback(() => {
    const items = enrichedCartItems.length > 0 ? enrichedCartItems : cartItems;
    return items.reduce((total, item) => {
      const convertedPrice = convertPrice(item.price, getProductCurrency(item));
      return total + convertedPrice * (item.quantity || 1);
    }, 0);
  }, [cartItems, enrichedCartItems, convertPrice]);

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        clearCart,
        enrichedCartItems,
        isEnriching,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
