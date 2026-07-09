'use client';

import { useEffect } from 'react';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function AcceptableUsePolicyPage() {
  useEffect(() => {
    document.title = 'Acceptable Use Policy | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Acceptable Use Policy" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Purpose</h2>
        <p>
          This Acceptable Use Policy (&quot;AUP&quot;) describes the rules for using the Eraiiz platform.
          By accessing or using Eraiiz, you agree to follow this policy in addition to our Terms and
          other applicable guidelines.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Permitted Use</h2>
        <p>You may use Eraiiz to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Browse and purchase sustainable, recycled, and eco-conscious products in good faith.</li>
          <li>List accurate products and fulfill orders promptly as a seller.</li>
          <li>Communicate respectfully with other users and Eraiiz support.</li>
          <li>Share honest reviews and sustainability-related product information.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Prohibited Conduct</h2>
        <p>You must not:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Post false, misleading, or fraudulent product listings or sustainability claims.</li>
          <li>Sell prohibited, illegal, unsafe, or non-compliant items.</li>
          <li>Harass, abuse, threaten, or discriminate against other users.</li>
          <li>Attempt to bypass platform fees, manipulate pricing, or engage in fraudulent transactions.</li>
          <li>Upload malware, scrape data without permission, or interfere with platform security.</li>
          <li>Impersonate another person, brand, or Eraiiz representative.</li>
          <li>Use the platform for spam, unauthorized advertising, or unlawful activity.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Seller Responsibilities</h2>
        <p>
          Sellers must provide truthful descriptions, maintain accurate inventory, ship orders on time,
          use sustainable packaging where possible, and honor reasonable customer service standards.
          Products must align with Eraiiz&apos;s sustainability mission and listing requirements.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Buyer Responsibilities</h2>
        <p>
          Buyers must provide accurate delivery information, pay for authorized purchases, and use
          returns and dispute processes honestly. Abuse of refunds or chargebacks may result in account
          restrictions.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Enforcement</h2>
        <p>
          Eraiiz may investigate violations, remove content, suspend accounts, or terminate access
          where necessary. Serious or repeated violations may result in permanent removal from the platform.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Contact</h2>
        <p>
          To report a violation or ask questions about this policy, contact{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">
            eraiizinfo@gmail.com
          </a>
          .
        </p>
      </section>
    </PolicyPageLayout>
  );
}
