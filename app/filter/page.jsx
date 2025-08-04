import { Suspense } from 'react';
import FilterContent from './FilterContent';
import DualNavbarSell from '../components/DualNavbarSell';

// Server component for the page
export default function Filter() {
  return (
    <div>
      <DualNavbarSell />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Filtered Products</h1>
        <Suspense fallback={<div className="flex justify-center"><div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <FilterContent />
        </Suspense>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';