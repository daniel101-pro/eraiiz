'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function SustainabilityStandardsPage() {
  useEffect(() => {
    document.title = 'Sustainability Standards | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Sustainability Standards" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Purpose</h2>
        <p>
          Eraiiz exists to promote sustainable, recycled, and responsibly sourced products. These standards
          define what we expect from sellers and listings on our marketplace.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Product Requirements</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Products should be made from recycled, renewable, or sustainably sourced materials where possible.</li>
          <li>Listings must accurately describe materials, origin, and environmental attributes.</li>
          <li>Greenwashing — false or exaggerated eco-claims — is prohibited.</li>
          <li>Single-use plastics and items from endangered species are not permitted where alternatives exist.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Carbon Footprint Disclosure</h2>
        <p>
          Sellers must complete Eraiiz&apos;s carbon footprint calculation for product uploads using the provided
          sustainability data fields. Disclosures should reflect good-faith estimates based on accurate inputs.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Packaging & Shipping</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Prefer minimal, recycled, or biodegradable packaging.</li>
          <li>Disclose shipping origin and method where relevant to environmental impact.</li>
          <li>Offer eco-conscious shipping options when available.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Certifications</h2>
        <p>
          Recognized certifications (e.g. FSC, Fair Trade, Energy Star) may be displayed when valid and verifiable.
          Do not claim certifications your product has not earned.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Review & Enforcement</h2>
        <p>
          Eraiiz may review listings, request documentation, or remove products that do not meet these standards.
          Repeated violations may affect seller account standing under our{' '}
          <Link href="/policies/terms" className="text-green-600 hover:underline">Terms of Service</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Contact</h2>
        <p>
          Sustainability questions:{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">eraiizinfo@gmail.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
