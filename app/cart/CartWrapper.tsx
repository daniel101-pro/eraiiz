'use client';

import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled
const CartClient = dynamic(() => import('./CartClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export default function CartWrapper() {
  return <CartClient />;
} 