'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useState, useEffect } from 'react';

import { showCartToast, showError, showSuccess } from '../utils/toast';

export default function ProductCard({ product }) {
  const { convertPrice, formatPrice } = useCurrency();
  const { addToCart, removeFromCart, updateQuantity, cartItems } = useCart();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [quantity, setQuantity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if item is in cart and get its quantity
  useEffect(() => {
    const cartItem = cartItems.find(item => item._id === product._id);
    setQuantity(cartItem ? cartItem.quantity : 0);
  }, [cartItems, product._id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      currency: product.currency || 'NGN',
      quantity: 1,
      selectedSize: 'S',
      images: product.images
    };
    addToCart(cartItem);
    showCartToast('Added to cart!', 'success');
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      currency: product.currency || 'NGN',
      quantity: 1,
      selectedSize: 'S',
      images: product.images
    };
    addToCart(cartItem);
    showCartToast('Added to cart!', 'success');
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      if (newQuantity === 0) {
        removeFromCart(product._id, 'S');
        showCartToast('Removed from cart', 'error');
      } else {
        updateQuantity(product._id, 'S', newQuantity);
      }
    }
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please login to add favorites');
      return;
    }

    setIsAnimating(true);
    
    try {
      const wasFavorited = isFavorited(product._id);
      const success = await toggleFavorite(product._id);
      
      if (success) {
        const isNowFavorited = !wasFavorited; // Toggle state
        showSuccess(
          isNowFavorited ? 'Added to favorites! ❤️' : 'Removed from favorites'
        );
      } else {
        showError('Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Something went wrong');
    } finally {
      // Reset animation after different delays based on animation type
      const animationDuration = isFavorited(product._id) ? 600 : 300; // heart-bounce is longer
      setTimeout(() => setIsAnimating(false), animationDuration);
    }
  };

  return (
    <>

      <style jsx>{`
        @keyframes heartPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .heart-pulse {
          animation: heartPulse 0.3s ease-in-out;
        }
        
        @keyframes heartBounce {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.2);
          }
          75% {
            transform: scale(1.1);
          }
        }
        
        .heart-bounce {
          animation: heartBounce 0.6s ease-in-out;
        }
      `}</style>
      <Link href={`/product/${product._id}`} className="block max-w-[320px]">
        <div className="bg-white rounded-[24px] overflow-hidden p-5 border border-[#E5E5E5]">
          {/* Product Details Section */}
          <div className="relative">
            {/* Title */}
            <h3 className="text-xs sm:text-xs md:text-xs text-[#1A1A1A] font-medium leading-tight">
              {product.name}
            </h3>

            {/* Price and Reviews in same line */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs sm:text-xs md:text-xs text-[#1A1A1A] font-semibold">
                {formatPrice(convertPrice(product.price, product.currency || 'NGN'))}
              </div>
              <div className="text-[#666666] text-[8px] sm:text-xs">
                {product.totalReviews || '0'} reviews
              </div>
            </div>

            {/* Category Tag */}
            <div className="mt-3">
              <span className="inline-block bg-[#EBF6FF] text-[#1A1A1A] px-1.5 py-0.5 rounded-full text-[8px] sm:text-xs">
                {product.category || 'Uncategorized'}
              </span>
            </div>

            {/* Product Image */}
            <div className="mt-4 mb-4">
              <div className="relative rounded-xl overflow-hidden h-[140px] sm:h-[180px] md:h-[220px]">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </div>

            {/* Add to Cart Button or Quantity Controls */}
            <div onClick={(e) => e.stopPropagation()}>
              {quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#3F8E3F] text-white py-1.5 text-xs sm:text-xs font-medium rounded-[14px] hover:bg-[#357C35] transition-colors"
                  style={{
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12)',
                    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  Add to cart
                </button>
              ) : (
                <div className="flex items-center justify-between bg-[#F5F5F5] rounded-[14px] p-1.5">
                  <button
                    onClick={handleDecrement}
                    className="w-6 h-6 flex items-center justify-center text-[#3F8E3F] text-base font-semibold bg-white rounded-full shadow-sm hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-xs font-medium text-[#1A1A1A]">{Number.isFinite(quantity) ? quantity : 0}</span>
                  <button
                    onClick={handleIncrement}
                    className="w-6 h-6 flex items-center justify-center text-[#3F8E3F] text-base font-semibold bg-white rounded-full shadow-sm hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Favorite and Rating Icons - moved below the button */}
            <div className="flex items-center justify-between mt-3">
              {/* Favorite Heart Icon */}
              <button
                onClick={handleFavoriteClick}
                className={`flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 ${
                  isAnimating ? (isFavorited(product._id) ? 'heart-bounce' : 'heart-pulse') : ''
                }`}
              >
                <svg 
                  className={`w-3 h-3 transition-all duration-200 ${
                    isFavorited(product._id) 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-400 hover:text-red-400'
                  }`} 
                  viewBox="0 0 24 24" 
                  fill={isFavorited(product._id) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {/* Rating Badge */}
              <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <svg className="w-2 h-2 text-[#3F8E3F]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[#3F8E3F] text-[8px] sm:text-xs font-medium">{product.averageRating?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
} 