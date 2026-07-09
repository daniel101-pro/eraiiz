'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = 'Terms of Service | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Terms of Service" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Agreement</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Eraiiz website,
          marketplace, and related services. By creating an account or using Eraiiz, you agree to these Terms
          and our other policies listed on the{' '}
          <Link href="/policies" className="text-green-600 hover:underline">Policies page</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Eligibility</h2>
        <p>
          You must be at least 18 years old and capable of entering a binding contract to use Eraiiz.
          Sellers must provide accurate business and identity information when requested.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for all activity
          under your account. Notify us immediately if you suspect unauthorized access.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Marketplace Role</h2>
        <p>
          Eraiiz provides a platform connecting buyers and sellers of sustainable products. Unless explicitly
          stated, Eraiiz is not the seller of third-party products listed by independent sellers. Sellers are
          responsible for their listings, fulfillment, and compliance with applicable laws.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Orders & Payments</h2>
        <p>
          When you place an order, you agree to pay the listed price, applicable taxes, and shipping fees.
          Payment processing may be handled by third-party providers. Order confirmation does not guarantee
          acceptance if an item is unavailable or a listing contains an error.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Seller Obligations</h2>
        <p>
          Sellers must provide accurate product information, honor stated shipping times, comply with our{' '}
          <Link href="/policies/sustainability" className="text-green-600 hover:underline">Sustainability Standards</Link>,
          and follow the{' '}
          <Link href="/policies/acceptable-use" className="text-green-600 hover:underline">Acceptable Use Policy</Link>.
          Eraiiz may charge commissions or fees as disclosed during seller onboarding.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Intellectual Property</h2>
        <p>
          Eraiiz content, branding, and platform features are protected by intellectual property laws. You may
          not copy, modify, or distribute platform materials without permission. By uploading content, you grant
          Eraiiz a limited license to display and promote it for marketplace operations.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Eraiiz is not liable for indirect, incidental, or consequential
          damages arising from your use of the platform. Our total liability for any claim is limited to the
          amount you paid to Eraiiz in the twelve months preceding the claim, where applicable.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">9. Changes & Termination</h2>
        <p>
          We may update these Terms with reasonable notice. Continued use after changes take effect constitutes
          acceptance. We may suspend or terminate accounts that violate these Terms or applicable policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">10. Contact</h2>
        <p>
          Questions about these Terms:{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">eraiizinfo@gmail.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
