'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useState, useEffect } from 'react';
import { Heart, Star, Minus, Plus } from 'lucide-react';

import { showCartToast, showError, showSuccess } from '../utils/toast';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';

export default function ProductCard({ product }) {
  const { convertPrice, formatPrice } = useCurrency();
  const { addToCart, removeFromCart, updateQuantity, cartItems } = useCart();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const cartItem = cartItems.find((item) => item._id === product._id);
    setQuantity(cartItem ? cartItem.quantity : 0);
  }, [cartItems, product._id]);

  const productCurrency = getProductCurrency(product);
  const listingPrice = getListingPrice(product);
  const defaultSize =
    product?.selectedSize ||
    product?.sizes?.[0] ||
    product?.attributes?.sizes?.[0] ||
    product?.sizeOptions?.[0] ||
    'One size';
  const imageSrc = product?.images?.[0] || '/placeholder-product.png';
  const rating = Number(product?.averageRating) || 0;
  const reviewCount = Number(product?.totalReviews) || 0;
  const favorited = isFavorited(product._id);

  const cartPayload = {
    _id: product._id,
    name: product.name,
    price: listingPrice,
    currency: productCurrency,
    quantity: 1,
    selectedSize: defaultSize,
    images: product.images,
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cartPayload);
    showCartToast('Added to cart!', 'success');
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cartPayload);
    showCartToast('Added to cart!', 'success');
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity <= 0) return;
    const next = quantity - 1;
    if (next === 0) {
      removeFromCart(product._id, defaultSize);
      showCartToast('Removed from cart', 'error');
    } else {
      updateQuantity(product._id, defaultSize, next);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Sign in to save favorites');
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    try {
      const wasFavorited = favorited;
      const success = await toggleFavorite(product._id);
      if (success) {
        showSuccess(wasFavorited ? 'Removed from favorites' : 'Saved to favorites');
      } else {
        showError('Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Something went wrong');
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-green-200 hover:shadow-md">
      <Link href={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={product.name || 'Product'}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.featured ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
              product.sellerPlan === 'pro' ? 'bg-purple-600' : 'bg-[#008C00]'
            }`}
          >
            {product.sellerPlan === 'pro' ? 'Pro' : 'Featured'}
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm transition hover:text-red-500"
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="min-h-[3.25rem]">
          <Link href={`/product/${product._id}`} className="block">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 sm:text-[15px]">
              {product.name}
            </h3>
          </Link>
          {product.category ? (
            <p className="mt-1 truncate text-xs text-gray-500">{product.category}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
              {formatPrice(convertPrice(listingPrice, productCurrency))}
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
              {reviewCount > 0 ? <span>· {reviewCount}</span> : null}
            </div>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {quantity === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-[#008C00] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Add to cart
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-2 py-1.5">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700 shadow-sm"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700 shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
