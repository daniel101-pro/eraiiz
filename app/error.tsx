'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <>
      <div className="relative z-10">
        <Navbar />
      </div>
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-600 mb-4">Error</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Something went wrong!</h2>
          <p className="text-gray-600 mb-8">
            We apologize for the inconvenience. Please try again later.
          </p>
          <div className="space-x-4">
            <button
              onClick={reset}
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-200"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 