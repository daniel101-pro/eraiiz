'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import DualNavbarSell from './DualNavbarSell';

/**
 * Signed-out landing for account-only routes (account, checkout, etc.).
 */
export default function AuthRequiredGate({
  title = 'Sign in to continue',
  description = 'Access your orders, favorites, and account settings once you’re signed in.',
  nextPath = '/account',
  showNavbar = true,
}) {
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      {showNavbar ? <DualNavbarSell /> : null}
      <main className={`flex flex-1 items-center justify-center px-4 ${showNavbar ? 'pt-28 md:pt-32 pb-16' : 'py-16'}`}>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
            <UserRound className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={loginHref}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#008C00] px-4 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Sign in
            </Link>
            <Link
              href={signupHref}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition hover:border-green-700 hover:text-green-800"
            >
              Create an account
            </Link>
          </div>
          <Link
            href="/for-you"
            className="mt-6 inline-block text-sm font-medium text-green-700 underline-offset-2 hover:underline"
          >
            Keep browsing products
          </Link>
        </div>
      </main>
    </div>
  );
}
