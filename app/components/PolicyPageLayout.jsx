'use client';

import Link from 'next/link';
import AppNavbar from './AppNavbar';
import Footer from './Footer';

export default function PolicyPageLayout({ title, lastUpdated, children }) {
  return (
    <>
      <div className="relative z-10">
        <AppNavbar />
      </div>

      <div className="min-h-screen bg-white pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/policies"
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mb-6"
          >
            <span className="mr-2">←</span>
            Back to Policies
          </Link>

          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>
          )}

          <div className="prose prose-green max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
