'use client';

import { use } from 'react';
import TrackingComponent from '../../components/shipping/TrackingComponent';
import { ShippingProvider } from '../../context/ShippingContext';
import DualNavbar from '../../components/DualNavbar';

export default function TrackingPage({ params }) {
  const { trackingNumber } = use(params);

  return (
    <ShippingProvider>
      <div className="min-h-screen bg-gray-50">
        <DualNavbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <TrackingComponent initialTrackingNumber={trackingNumber} />
        </div>
      </div>
    </ShippingProvider>
  );
}