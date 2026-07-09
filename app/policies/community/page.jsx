'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function CommunityGuidelinesPage() {
  useEffect(() => {
    document.title = 'Community Guidelines | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Community Guidelines" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Our Community</h2>
        <p>
          Eraiiz is built around sustainable commerce and respectful collaboration between buyers, sellers,
          and supporters of eco-conscious living. These guidelines help keep the marketplace safe and welcoming.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Be Respectful</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Treat other users, support staff, and sellers with courtesy.</li>
          <li>Do not harass, threaten, discriminate, or use hateful language.</li>
          <li>Disagree constructively — focus on facts, not personal attacks.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Be Honest</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Write truthful product reviews based on genuine experience.</li>
          <li>Do not post fake reviews, incentivized ratings, or misleading sustainability claims.</li>
          <li>Report suspicious listings or behavior to Eraiiz support.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Protect the Marketplace</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Do not spam, solicit off-platform transactions to avoid fees, or share others&apos; private data.</li>
          <li>Do not attempt to manipulate search rankings or abuse promotional features.</li>
          <li>Follow our{' '}
            <Link href="/policies/acceptable-use" className="text-green-600 hover:underline">Acceptable Use Policy</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Seller Conduct</h2>
        <p>
          Sellers represent the Eraiiz community to buyers. Respond to messages promptly, fulfill orders reliably,
          and uphold the standards in our{' '}
          <Link href="/policies/sustainability" className="text-green-600 hover:underline">Sustainability Standards</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Enforcement</h2>
        <p>
          Violations may result in content removal, account warnings, suspension, or permanent ban. Eraiiz
          may take action with or without prior notice for serious breaches.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Contact</h2>
        <p>
          Report community issues:{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">eraiizinfo@gmail.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
