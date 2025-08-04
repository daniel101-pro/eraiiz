'use client';

import Link from 'next/link';
import DualNavbarSell from '../../components/DualNavbarSell';

const BackButton = () => {
    return (
        <Link 
            href="/checkout/billing"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4 md:mb-6"
        >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Billing
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
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center text-white">
                        ✓
                    </div>
                    <span className="text-green-600 text-lg">Billing address</span>
                </div>
                <div className="h-4 border-l-2 border-green-600"></div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-white flex items-center justify-center text-green-600">
                        3
                    </div>
                    <span className="text-green-600 text-lg">Payment</span>
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
                    <div className="w-8 h-8 rounded-full border border-green-500 bg-green-500 flex items-center justify-center text-white">
                        ✓
                    </div>
                    <span className="ml-2 text-green-500">Billing address</span>
                </div>
                <div className="flex-1 h-[1px] bg-green-500"></div>
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-green-500 bg-white flex items-center justify-center text-green-500">
                        3
                    </div>
                    <span className="ml-2 text-green-500">Payment</span>
                </div>
            </div>
        </>
    );
};

export default function PaymentPage() {
    return (
        <>
            <DualNavbarSell />
            <ProgressBar />
            
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <BackButton />
                    <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="space-y-6">
                            {/* Payment Options */}
                            <div className="space-y-4">
                                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-green-500">
                                    <input type="radio" name="payment" className="h-4 w-4 text-green-600" defaultChecked />
                                    <span className="ml-3">
                                        <span className="block text-gray-900 font-medium">Pay with Card</span>
                                        <span className="block text-gray-500 text-sm">Pay securely with your credit/debit card</span>
                                    </span>
                                </label>
                                
                                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-green-500">
                                    <input type="radio" name="payment" className="h-4 w-4 text-green-600" />
                                    <span className="ml-3">
                                        <span className="block text-gray-900 font-medium">Bank Transfer</span>
                                        <span className="block text-gray-500 text-sm">Make payment via bank transfer</span>
                                    </span>
                                </label>
                            </div>

                            {/* Card Details Form */}
                            <div className="mt-8 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="1234 5678 9012 3456"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                        <input 
                                            type="text" 
                                            placeholder="MM/YY"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                        <input 
                                            type="text" 
                                            placeholder="123"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    Complete Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 