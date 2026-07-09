'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FileText } from 'lucide-react';
import { policies } from '@/lib/policies';

export default function PoliciesPage() {
  useEffect(() => {
    document.title = 'Policies | Eraiiz';
  }, []);

  return (
    <>
      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="min-h-screen bg-white pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              Legal & Policies
            </div>
            <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 mb-3">Eraiiz Policies</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Review our legal and platform policies covering terms, privacy, shipping, sustainability, and your rights as a buyer or seller.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((policy) => {
              const Icon = policy.icon;
              return (
                <Link
                  key={policy.href}
                  href={policy.href}
                  className="group block p-6 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 mb-2">
                        {policy.title}
                      </h2>
                      <p className="text-sm text-gray-600">{policy.description}</p>
                      <span className="inline-block mt-4 text-sm font-medium text-green-600 group-hover:underline">
                        Read policy →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-12">
            Questions about our policies?{' '}
            <Link href="/contact" className="text-green-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
