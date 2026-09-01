'use client';

import { Suspense } from 'react';
import CheckoutSuccessPage from './CheckoutSuccessContent';

function LoadingState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-32">
      <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutSuccessPage />
    </Suspense>
  );
}
