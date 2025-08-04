'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import DualNavbarSell from '../../components/DualNavbarSell';
import Link from 'next/link';

const BackButton = () => {
    return (
        <Link 
            href="/cart"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 md:mb-6"
        >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Cart
        </Link>
    );
};

const ProgressBar = () => {
    return (
        <>
            {/* Mobile Progress */}
            <div className="md:hidden flex flex-col items-center px-4 mt-[120px] mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center text-white">
                        ✓
                    </div>
                    <span className="text-green-600 text-lg">Cart review</span>
                </div>
                <div className="h-4 border-l-2 border-green-600"></div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-white flex items-center justify-center text-green-600">
                        2
                    </div>
                    <span className="text-green-600 text-lg">Billing address</span>
                </div>
            </div>

            {/* Desktop Progress */}
            <div className="hidden md:flex items-center justify-center space-x-4 max-w-3xl mx-auto px-4 mt-[120px] mb-8">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-green-500 bg-green-500 flex items-center justify-center text-white">
                        ✓
                    </div>
                    <span className="ml-2 text-green-500">Cart review</span>
                </div>
                <div className="flex-1 h-[1px] bg-green-500"></div>
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-green-500 bg-white flex items-center justify-center text-green-500">
                        2
                    </div>
                    <span className="ml-2 text-green-500">Billing address</span>
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

export default function BillingPage() {
  const { cartItems, getCartTotal } = useCart();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    saveInfo: false
  });
  const [discountCode, setDiscountCode] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Navigate to payment page
    window.location.href = '/checkout/payment';
  };

  const shippingFee = 4000;

  return (
    <>
      <DualNavbarSell />
      <ProgressBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <h2 className="text-2xl font-semibold mb-6">Billing Address</h2>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link 
                href="/checkout/payment"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue to Payment
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 