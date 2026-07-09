'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function ShippingPolicyPage() {
  useEffect(() => {
    document.title = 'Shipping Policy | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Shipping Policy" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Overview</h2>
        <p>
          This Shipping Policy describes how orders are fulfilled on Eraiiz. Individual sellers are responsible
          for shipping their products unless Eraiiz explicitly states otherwise on a listing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Processing Times</h2>
        <p>
          Sellers should process orders within <strong>1–2 business days</strong> unless a longer processing
          time is stated on the product page (e.g. made-to-order items). You will receive a confirmation when
          your order is placed and a notification when it ships.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Shipping Methods</h2>
        <p>
          Available shipping methods depend on the seller, product type, and destination. Options may include
          standard domestic delivery, express shipping, or international carriers. Eco-conscious packaging and
          carbon-neutral shipping options may be offered where available.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Shipping Costs</h2>
        <p>
          Shipping fees are calculated at checkout based on destination, weight, and the seller&apos;s rates.
          Some sellers may offer free shipping above a minimum order value when stated on the listing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. International Shipping</h2>
        <p>
          International delivery may be available for select products. Delivery times vary by country and
          customs processing. Buyers are responsible for import duties, taxes, and fees unless otherwise stated.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Tracking</h2>
        <p>
          When available, tracking information is sent to your registered email or accessible from your order
          history. You can also use the{' '}
          <Link href="/track" className="text-green-600 hover:underline">Track Order</Link> page when a
          tracking number is provided.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Lost or Damaged Packages</h2>
        <p>
          If your order arrives damaged or does not arrive within the estimated window, contact the seller or
          Eraiiz support promptly. See our{' '}
          <Link href="/policies/refund" className="text-green-600 hover:underline">Refund Policy</Link> for
          resolution options.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Contact</h2>
        <p>
          Shipping questions:{' '}
          <a href="mailto:support@eraiiz.com" className="text-green-600 hover:underline">support@eraiiz.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
