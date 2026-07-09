'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Privacy Policy" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
        <p>
          Eraiiz (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy
          explains what personal data we collect, why we collect it, and how we handle it when you use our
          website and marketplace.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Account data:</strong> name, email, phone number, password (hashed), and role (buyer/seller).</li>
          <li><strong>Transaction data:</strong> orders, payment references, billing and shipping addresses.</li>
          <li><strong>Seller data:</strong> business details, product listings, sustainability disclosures.</li>
          <li><strong>Usage data:</strong> pages visited, device type, IP address, and cookies (see our{' '}
            <Link href="/policies/cookies" className="text-green-600 hover:underline">Cookie Policy</Link>).</li>
          <li><strong>Communications:</strong> support messages, reviews, and notifications preferences.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Create and manage your account.</li>
          <li>Process orders, payments, and seller payouts.</li>
          <li>Provide customer support and resolve disputes.</li>
          <li>Improve platform security, performance, and user experience.</li>
          <li>Send service updates, order notifications, and marketing (where permitted).</li>
          <li>Comply with legal obligations and enforce our policies.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Sharing of Information</h2>
        <p>We may share data with:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Sellers or buyers to fulfill orders and resolve issues.</li>
          <li>Payment processors, shipping partners, and cloud hosting providers.</li>
          <li>Analytics and authentication services that help operate the platform.</li>
          <li>Law enforcement or regulators when required by law.</li>
        </ul>
        <p className="mt-2">We do not sell your personal information.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Data Retention</h2>
        <p>
          We retain personal data for as long as your account is active or as needed to provide services,
          comply with legal obligations, resolve disputes, and enforce agreements. Seller and transaction
          records may be kept longer where required by tax or commerce regulations.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, or restrict processing
          of your personal data. Contact us to exercise these rights. You may also update account details in
          your profile settings.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect your data. No method of transmission
          over the internet is completely secure, so we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Contact</h2>
        <p>
          Privacy inquiries:{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">eraiizinfo@gmail.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
