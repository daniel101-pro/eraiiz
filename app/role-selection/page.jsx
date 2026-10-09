'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Leaf, ShoppingBag, Store } from 'lucide-react';
import { showAuthToast } from '../utils/toast';

const ROLES = [
  {
    id: 'buyer',
    title: 'Shop',
    subtitle: 'Buy sustainable products',
    description: 'Browse verified eco-friendly goods, track impact, and shop with a smaller footprint.',
    icon: ShoppingBag,
    features: ['Sustainable marketplace', 'Carbon footprint tracking', 'Personalized picks', 'Eco community'],
  },
  {
    id: 'seller',
    title: 'Sell',
    subtitle: 'List your products',
    description: 'Reach buyers who care about materials, origin, and circular design.',
    icon: Store,
    features: ['List sustainable products', 'Reach eco-conscious buyers', 'Sales analytics', 'Build a green brand'],
  },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const tempUser = localStorage.getItem('tempGoogleUser');
    const tempTokens = localStorage.getItem('tempGoogleTokens');

    if (!tempUser || !tempTokens) {
      router.push('/login');
      return;
    }

    try {
      setUserData(JSON.parse(tempUser));
    } catch (error) {
      console.error('Error parsing temp user data:', error);
      router.push('/login');
    }
  }, [router]);

  const handleContinue = async () => {
    if (!selectedRole) {
      showAuthToast('Please select a role to continue', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const tempTokens = localStorage.getItem('tempGoogleTokens');
      if (!tempTokens) {
        throw new Error('No authentication data found');
      }

      const tokens = JSON.parse(tempTokens);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }

      const updatedUser = await response.json();

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('role', updatedUser.role);
      localStorage.removeItem('tempGoogleUser');
      localStorage.removeItem('tempGoogleTokens');

      showAuthToast(`Welcome! Your ${selectedRole} account is ready.`, 'success');
      router.push('/welcome');
    } catch (error) {
      console.error('Role selection error:', error);
      showAuthToast(error.message || 'Failed to set up your account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const firstName = String(userData?.name || '').trim().split(' ')[0];

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-green-900 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Setting things up…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-green-100/80 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <Image src="/logo.png" alt="Eraiiz" width={110} height={36} className="h-8 w-auto" />
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-3 py-1 text-xs font-medium text-green-900 backdrop-blur">
            <Leaf className="h-3.5 w-3.5" />
            Account setup
          </span>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 max-w-2xl"
        >
          <p className="mb-2 text-sm font-medium text-green-800">
            {firstName ? `Hi ${firstName}` : 'Welcome'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-green-950 sm:text-4xl">
            How do you want to start?
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:text-lg">
            Choose a role for this account. You can switch between shopping and selling later.
          </p>
        </motion.div>

        <div
          role="radiogroup"
          aria-label="Account type"
          className="grid flex-1 gap-4 md:grid-cols-2 md:gap-6"
        >
          {ROLES.map((role, index) => {
            const selected = selectedRole === role.id;
            const Icon = role.icon;
            return (
              <motion.button
                key={role.id}
                type="button"
                role="radio"
                aria-checked={selected}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 * index }}
                onClick={() => setSelectedRole(role.id)}
                className={`group relative flex h-full flex-col rounded-3xl border bg-white p-6 text-left shadow-sm transition-all duration-200 sm:p-8 ${
                  selected
                    ? 'border-green-900 ring-2 ring-green-900/20 shadow-lg'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      selected ? 'bg-green-900 text-white' : 'bg-green-50 text-green-900'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      selected ? 'border-green-900 bg-green-900 text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-green-950">{role.title}</h2>
                <p className="mt-1 text-sm font-medium text-green-800">{role.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{role.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-800">
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>

        <div className="sticky bottom-0 mt-8 bg-gradient-to-t from-white via-white/95 to-transparent pb-2 pt-4">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedRole || isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
            >
              {isLoading ? (
                'Setting up your account…'
              ) : selectedRole ? (
                <>
                  Continue as {selectedRole === 'buyer' ? 'buyer' : 'seller'}
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                'Select a role to continue'
              )}
            </button>
            <p className="text-center text-xs text-gray-500">
              You can change this later in account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
