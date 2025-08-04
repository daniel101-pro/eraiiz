'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductUploadSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  
  // Debug logging
  console.log('Success page - productId from URL:', productId);
  console.log('Success page - all search params:', Object.fromEntries(searchParams.entries()));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full border border-gray-200">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Congratulations!</h2>
          <p className="text-gray-600 text-center mb-2">Your product has been uploaded successfully.</p>
          <p className="text-gray-500 text-center mb-4">You can now view your product or continue selling more items.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <button
            className="w-full md:w-1/2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            onClick={() => router.push('/dashboard/seller/upload')}
          >
            Continue Selling
          </button>
          <button
            className="w-full md:w-1/2 bg-white border border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => productId ? router.push(`/product/${productId}`) : console.error('No product ID available')}
            disabled={!productId}
            title={!productId ? 'Product ID not available' : 'View your uploaded product'}
          >
            {!productId ? 'Product ID Missing' : 'View Product'}
          </button>
        </div>
      </div>
    </div>
  );
} 