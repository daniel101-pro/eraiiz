'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';
import { POLICY_LAST_UPDATED } from '@/lib/policies';

export default function CookiePolicyPage() {
  useEffect(() => {
    document.title = 'Cookie Policy | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Cookie Policy" lastUpdated={POLICY_LAST_UPDATED}>
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help websites
          remember preferences, keep you signed in, and understand how the site is used.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. How Eraiiz Uses Cookies</h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Essential cookies:</strong> required for login, cart, checkout, and security.</li>
          <li><strong>Preference cookies:</strong> remember language, currency, and display settings.</li>
          <li><strong>Analytics cookies:</strong> help us understand traffic and improve the platform.</li>
          <li><strong>Marketing cookies:</strong> may be used to measure campaign effectiveness (where enabled).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Local Storage</h2>
        <p>
          Eraiiz also uses browser local storage for items such as cart contents, currency preference, and
          authentication tokens. This functions similarly to cookies for core site features.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Managing Cookies</h2>
        <p>
          You can control or delete cookies through your browser settings. Disabling essential cookies may
          affect account login, cart functionality, and checkout. For more on how we handle personal data,
          see our{' '}
          <Link href="/policies/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Third-Party Cookies</h2>
        <p>
          Third-party services such as payment providers, analytics tools, or Google Sign-In may set their
          own cookies when you use those features. Their use is governed by their respective policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Contact</h2>
        <p>
          Questions about cookies:{' '}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600 hover:underline">eraiizinfo@gmail.com</a>
        </p>
      </section>
    </PolicyPageLayout>
  );
}
