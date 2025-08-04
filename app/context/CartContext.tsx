'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../cart/types';
import axios from 'axios';

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [enrichedCartItems, setEnrichedCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  console.log('=== TYPESCRIPT CART PROVIDER ACTIVE ===');
  console.log('Cart items:', cartItems);
  console.log('Enriched cart items:', enrichedCartItems);

  // Load cart from localStorage on mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  // Enrich cart items with full product data including carbon footprint
  const enrichCartItems = async () => {
    if (cartItems.length === 0) {
      setEnrichedCartItems([]);
      return;
    }

    setIsEnriching(true);
    console.log('=== ENRICHING CART ITEMS ===');
    
    try {
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            console.log(`Fetching full data for product: ${item._id}`);
            
            // Use the new public product detail endpoint to get full product data including carbon footprint
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/products/${item._id}/public`,
              {
                timeout: 10000, // 10 second timeout
              }
            );
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response data structure:`, response.data);
            
            const fullProduct = response.data;
            
            if (!fullProduct) {
              console.warn(`Product ${item._id} not found, using cart item data`);
              return item;
            }
            
            console.log(`Full product data for ${item._id}:`, fullProduct);
            console.log(`Carbon footprint for ${item._id}:`, fullProduct.carbonFootprint);
            console.log(`Sustainability for ${item._id}:`, fullProduct.sustainability);
            
            // Merge cart item data with full product data
            const enrichedItem = {
              ...item,
              carbonFootprint: fullProduct.carbonFootprint,
              sustainability: fullProduct.sustainability,
              material: fullProduct.material,
              details: fullProduct.details,
              bonus: fullProduct.bonus,
              // Update other fields in case they changed
              name: fullProduct.name || item.name,
              price: fullProduct.price || item.price,
              images: fullProduct.images || item.images,
            };
            
            console.log(`Enriched item for ${item._id}:`, {
              id: enrichedItem._id,
              name: enrichedItem.name,
              hasCarbonFootprint: !!enrichedItem.carbonFootprint,
              hasSustainability: !!enrichedItem.sustainability,
              carbonFootprint: enrichedItem.carbonFootprint,
              sustainability: enrichedItem.sustainability
            });
            
            return enrichedItem;
          } catch (error: any) {
            console.error(`Error fetching product ${item._id}:`, error);
            console.error(`Error details:`, {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data
            });
            
            // Return original item if fetch fails
            return item;
          }
        })
      );
      
      console.log('=== ENRICHED CART ITEMS ===', enrichedItems);
      console.log('=== ENRICHED ITEMS CARBON FOOTPRINT CHECK ===');
      enrichedItems.forEach((item, index) => {
        console.log(`Item ${index + 1} (${item._id}):`, {
          name: item.name,
          hasCarbonFootprint: !!item.carbonFootprint,
          carbonFootprint: item.carbonFootprint,
          hasSustainability: !!item.sustainability,
          sustainability: item.sustainability
        });
      });
      
      setEnrichedCartItems(enrichedItems);
    } catch (error) {
      console.error('Error enriching cart items:', error);
      setEnrichedCartItems(cartItems); // Fallback to original items
    } finally {
      setIsEnriching(false);
    }
  };

  // Enrich cart items whenever cartItems change
  useEffect(() => {
    if (isInitialized && cartItems.length > 0) {
      enrichCartItems();
    } else {
      setEnrichedCartItems([]);
    }
  }, [cartItems, isInitialized]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        i => i._id === item._id && i.selectedSize === item.selectedSize
      );

      if (existingItem) {
        return prevItems.map(i =>
          i._id === item._id && i.selectedSize === item.selectedSize
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }

      return [...prevItems, item];
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

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

    // Don't render children until cart is initialized from localStorage
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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