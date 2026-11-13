'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { adminFetch } from './adminApi';

const NAV = [
  { href: '/admin', label: 'Home' },
  { href: '/admin/mail', label: 'Mail' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/catalog', label: 'Catalog' },
  { href: '/admin/people', label: 'People' },
];

function titleFor(pathname: string) {
  if (pathname.startsWith('/admin/mail')) return 'Mail';
  if (pathname.startsWith('/admin/orders')) return 'Orders';
  if (pathname.startsWith('/admin/catalog')) return 'Catalog';
  if (pathname.startsWith('/admin/people')) return 'People';
  return 'Overview';
}

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
      .catch(() => {
        if (!cancelled) router.replace('/login');
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
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <p className="text-sm font-semibold">{titleFor(pathname)}</p>
        <button type="button" onClick={logout} className="text-sm text-red-700">
          Log out
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 border-r border-gray-200 bg-white md:block">
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
                {item.label === 'Home' ? 'Overview' : item.label}
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

      <main className="min-h-[calc(100dvh-7rem)] pb-20 md:ml-52 md:min-h-screen md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-1 py-3 text-center text-[11px] ${
                active ? 'font-semibold text-green-900' : 'text-gray-500'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
