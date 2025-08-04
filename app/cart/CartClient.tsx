'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DualNavbarSell from '../components/DualNavbarSell';
import { useCart } from '../context/CartContext';

import { showCartToast } from '../utils/toast';
import { CartItem } from './types';
import CarbonFootprintDisplay from '../components/CarbonFootprintDisplay';

const BackButton = () => {
    return (
        <Link 
            href="/categories"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 md:mb-6"
        >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
        </Link>
    );
};

const ProgressBar = () => {
    return (
        <>
            {/* Mobile Progress */}
            <div className="md:hidden flex flex-col items-center px-4 mt-[120px] mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-white flex items-center justify-center text-green-600">
                        1
                    </div>
                    <span className="text-green-600 text-lg">Cart review</span>
                </div>
            </div>

            {/* Desktop Progress */}
            <div className="hidden md:flex items-center justify-center space-x-4 max-w-3xl mx-auto px-4 mt-[120px] mb-8">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-green-500 bg-white flex items-center justify-center text-green-500">
                        1
                    </div>
                    <span className="ml-2 text-green-500">Cart review</span>
                </div>
                <div className="flex-1 h-[1px] bg-gray-200"></div>
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500">
                        2
                    </div>
                    <span className="ml-2 text-gray-500">Billing address</span>
                </div>
                <div className="flex-1 h-[1px] bg-gray-200"></div>
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500">
                        3
                    </div>
                    <span className="ml-2 text-gray-500">Payment</span>
                </div>
            </div>
        </>
    );
};

export default function CartClient() {
    const router = useRouter();
    const { cartItems = [], enrichedCartItems = [], isEnriching = false, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart() || {};
    
    // Use enriched cart items if available, otherwise fall back to basic cart items
    const displayCartItems = enrichedCartItems.length > 0 ? enrichedCartItems : cartItems;
    
    // Debug logging
    console.log('CartClient - basic cartItems:', cartItems);
    console.log('CartClient - enrichedCartItems:', enrichedCartItems);
    console.log('CartClient - isEnriching:', isEnriching);
    console.log('CartClient - displayCartItems:', displayCartItems);
    console.log('CartClient - displayCartItems count:', displayCartItems.length);
    if (displayCartItems.length > 0) {
        console.log('CartClient - first item carbonFootprint:', displayCartItems[0].carbonFootprint);
        console.log('CartClient - first item sustainability:', displayCartItems[0].sustainability);
    }

    // Calculate total carbon footprint for all items in cart
    const getTotalCarbonFootprint = () => {
        return displayCartItems.reduce((total, item) => {
            if (item.carbonFootprint && item.carbonFootprint.total) {
                return total + (parseFloat(item.carbonFootprint.total) * (item.quantity || 1));
            }
            return total;
        }, 0);
    };

    const totalCarbonFootprint = getTotalCarbonFootprint();
    const hasCarbonFootprintData = displayCartItems.some(item => item.carbonFootprint);

    const handleLogout = () => {
        clearCart?.();
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
    };

    const handleRemoveItem = (id: string, size: string) => {
        if (removeFromCart) {
            removeFromCart(id, size);
                        showCartToast('Item removed from cart', 'error');
        }
    };

    const handleClearCart = () => {
        if (clearCart) {
            clearCart();
                        showCartToast('Cart cleared', 'error');
        }
    };

    // Early return for loading state
    if (!cartItems || isEnriching) {
        return (
            <>
                <DualNavbarSell handleLogout={handleLogout} />
                <ProgressBar />
                <div className="min-h-[calc(100vh-200px)] bg-white flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (displayCartItems.length === 0) {
        return (
            <>
                <DualNavbarSell handleLogout={handleLogout} />
                <ProgressBar />
                <div className="min-h-[calc(100vh-200px)] bg-white flex flex-col items-center justify-center px-4">
                    <div className="max-w-md mx-auto p-6 flex flex-col items-center text-center">
                        <div className="mb-6">
                            <Image
                                src="/empty-cart.png"
                                alt="Empty cart illustration"
                                width={200}
                                height={200}
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 mb-4">Your cart is empty</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Browse through our collections and find something you love.
                        </p>
                        <Link
                            href="/categories"
                            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition duration-200"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <DualNavbarSell handleLogout={handleLogout} />
            <ProgressBar />
    
            
            {/* Mobile Layout */}
            <div className="md:hidden px-4 py-6">
                <BackButton />
                <h2 className="text-xs sm:text-sm md:text-base text-gray-900 mb-6">Cart items</h2>

                <div className="space-y-6">
                    {displayCartItems.map((item: CartItem) => (
                        <div key={`${item._id}-${item.selectedSize}`} className="flex flex-col gap-4 bg-white border border-[#CDEFCB] rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                                        <Image
                                            src={item.images?.[0] || '/placeholder.png'}
                                            alt={item.name || 'Product'}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg text-gray-900">{item.name || 'Product'}</h3>
                                        <p className="text-sm text-gray-500">Size: {item.selectedSize || 'N/A'}</p>
                                        <p className="text-gray-600 mt-1">Quantity</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity?.(item._id, item.selectedSize, Math.max(1, item.quantity - 1))}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 text-2xl"
                                            >
                                                −
                                            </button>
                                            <div className="w-16 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-900">
                                                {item.quantity || 1}
                                            </div>
                                            <button
                                                onClick={() => updateQuantity?.(item._id, item.selectedSize, (item.quantity || 1) + 1)}
                                                className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-lg text-white text-2xl"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-lg font-medium">
                                    ₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={() => handleRemoveItem(item._id, item.selectedSize)}
                                    className="w-10 h-10 flex items-center justify-center text-red-500"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-white rounded-2xl p-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900 font-medium">₦{(getCartTotal?.() || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Shipping</span>
                            <span className="text-gray-900 font-medium">Calculated at checkout</span>
                        </div>
                        {hasCarbonFootprintData && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Environmental Impact</span>
                                <span className="text-green-600 font-medium">{totalCarbonFootprint.toFixed(2)} kg CO₂e</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-semibold">Total</span>
                                <span className="text-gray-900 font-semibold">₦{(getCartTotal?.() || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <Link 
                            href="/checkout/billing"
                            className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200"
                        >
                            Proceed to Checkout
                        </Link>
                        <button
                            onClick={handleClearCart}
                            className="block w-full text-red-500 text-center py-3 rounded-lg font-medium hover:bg-red-50 transition duration-200"
                        >
                            Clear Cart
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <BackButton />
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column - Cart Items */}
                        <div className="lg:w-2/3">
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                {/* Cart Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xs sm:text-sm md:text-base text-gray-800 font-medium">Cart items</h2>
                                    <button 
                                        onClick={handleClearCart}
                                        className="text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-full text-sm transition-colors duration-200"
                                    >
                                        Clear Cart
                                    </button>
                                </div>

                                {/* Cart Items */}
                                <div className="space-y-8">
                                    {displayCartItems.map((item: CartItem) => (
                                        <div key={`${item._id}-${item.selectedSize}`} className="bg-white border border-[#CDEFCB] rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                {/* Product Image */}
                                                <div className="w-24 h-24 relative rounded-xl overflow-hidden">
                                                    <Image
                                                        src={item.images?.[0] || '/placeholder.png'}
                                                        alt={item.name || 'Product'}
                                                        layout="fill"
                                                        objectFit="cover"
                                                    />
                                                </div>
                                                
                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <h3 className="text-gray-700 text-lg mb-1">{item.name || 'Product'}</h3>
                                                    <p className="text-sm text-gray-500">Size: {item.selectedSize || 'N/A'}</p>
                                                    <p className="text-gray-600 mt-1">Quantity</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity?.(item._id, item.selectedSize, Math.max(1, (item.quantity || 1) - 1))}
                                                            className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-gray-600 text-2xl hover:border-gray-300 transition-colors duration-200"
                                                        >
                                                            −
                                                        </button>
                                                        <div className="w-28 h-12 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-gray-900">
                                                            {item.quantity || 1}
                                                        </div>
                                                        <button
                                                            onClick={() => updateQuantity?.(item._id, item.selectedSize, (item.quantity || 1) + 1)}
                                                            className="w-12 h-12 flex items-center justify-center bg-green-600 rounded-xl text-white text-2xl hover:bg-green-700 transition-colors duration-200"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <button 
                                                        onClick={() => handleRemoveItem(item._id, item.selectedSize)}
                                                        className="text-red-500 bg-red-50 rounded-full px-4 py-2 flex items-center gap-2 hover:bg-red-100 transition-colors duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove item
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:w-1/3">
                            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-900 font-medium">₦{(getCartTotal?.() || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="text-gray-900 font-medium">Calculated at checkout</span>
                                    </div>
                                    {hasCarbonFootprintData && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Environmental Impact</span>
                                            <span className="text-green-600 font-medium">{totalCarbonFootprint.toFixed(2)} kg CO₂e</span>
                                        </div>
                                    )}
                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-900 font-semibold">Total</span>
                                            <span className="text-gray-900 font-semibold">₦{(getCartTotal?.() || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/checkout/billing"
                                        className="block w-full bg-green-500 text-white text-center py-3 rounded-xl font-medium hover:bg-green-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                    >
                                        Proceed to checkout
                                    </Link>
                                </div>
                            </div>

                            {/* Carbon Footprint Summary */}
                            {hasCarbonFootprintData && (
                                <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center mb-4">
                                        <span className="text-green-600 mr-2">🌱</span>
                                        <h3 className="text-lg font-semibold text-gray-900">Environmental Impact Summary</h3>
                                    </div>
                                    <div className="text-center mb-4">
                                        <div className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-1">
                                            {totalCarbonFootprint.toFixed(2)} kg CO₂e
                                        </div>
                                        <div className="text-sm text-gray-600">Total Environmental Impact</div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Car Ride Equivalent</span>
                                            <span className="text-gray-900 font-medium">
                                                {(totalCarbonFootprint * 4).toFixed(1)} km
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Trees to Offset</span>
                                            <span className="text-gray-900 font-medium">
                                                {(totalCarbonFootprint * 0.05).toFixed(1)} trees
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-green-700 text-center">
                                            🌍 Your purchase supports sustainable products and helps reduce environmental impact
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 