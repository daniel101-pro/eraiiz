'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { adminFetch } from './adminApi';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/mail', label: 'Mail' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/catalog', label: 'Catalog' },
  { href: '/admin/people', label: 'People' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Admin');

  useEffect(() => {
    let cancelled = false;
    adminFetch('/api/admin/session')
      .then((session) => {
        if (cancelled) return;
        setName(session.name || session.email);
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status === 401 || error.status === 403) {
          router.replace('/login');
          return;
        }
        router.replace('/login');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    router.push('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 rounded-full border border-gray-200 border-t-green-950 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-30 w-52 border-r border-gray-200 bg-white">
        <div className="px-5 py-6">
          <p className="text-sm font-semibold tracking-tight">Eraiiz</p>
          <p className="mt-1 truncate text-xs text-gray-500">{name}</p>
        </div>
        <nav className="px-2">
          {NAV.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 text-sm ${
                  active ? 'bg-green-50 font-medium text-green-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="absolute bottom-6 left-2 right-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
        >
          Log out
        </button>
      </aside>
      <main className="ml-52 min-h-screen">{children}</main>
    </div>
  );
}
