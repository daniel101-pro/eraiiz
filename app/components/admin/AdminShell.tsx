'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Boxes,
  Command,
  LayoutDashboard,
  Mail,
  Search,
  Shield,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import { adminFetch } from './adminApi';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, group: 'Operate' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, group: 'Operate' },
  { href: '/admin/catalog', label: 'Catalog', icon: Boxes, group: 'Operate' },
  { href: '/admin/sellers', label: 'Sellers', icon: Store, group: 'Operate' },
  { href: '/admin/users', label: 'Users', icon: Users, group: 'Operate' },
  { href: '/admin/mail', label: 'Mail', icon: Mail, group: 'Operate' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, group: 'Insight' },
  { href: '/admin/health', label: 'Health', icon: Activity, group: 'Insight' },
  { href: '/admin/security', label: 'Security', icon: Shield, group: 'Insight' },
];

const COMMANDS = [
  ...NAV.map((item) => ({ href: item.href, label: item.label, hint: item.group })),
  { href: '/admin/mail?folder=reports', label: 'Open reports inbox', hint: 'Mail' },
  { href: '/admin/orders', label: 'Fulfillment queue', hint: 'Orders' },
  { href: '/for-you', label: 'Open storefront', hint: 'Shop' },
];

function titleFor(pathname: string) {
  const hit = NAV.find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  );
  return hit?.label || 'Admin';
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Admin');
  const [email, setEmail] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminFetch('/api/admin/session')
      .then((session) => {
        if (cancelled) return;
        setName(session.name || session.email);
        setEmail(session.email || '');
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/login?next=%2Fadmin');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredCommands = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q));
  }, [commandQuery]);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    window.dispatchEvent(new Event('eraiiz:auth-changed'));
    router.push('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">
        <div className="h-7 w-7 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  const groups = ['Operate', 'Insight'];

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-gray-900">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <p className="text-sm font-semibold">{titleFor(pathname)}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCommandOpen(true)} aria-label="Command menu">
            <Command className="h-4 w-4 text-gray-600" />
          </button>
          <button type="button" onClick={logout} className="text-sm text-red-700">
            Log out
          </button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/10 bg-[#0b1220] text-white md:flex md:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">Eraiiz Admin</p>
          <p className="mt-2 truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-white/50">{email}</p>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/70 hover:bg-white/10"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Jump anywhere</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{group}</p>
              <div className="space-y-0.5">
                {NAV.filter((item) => item.group === group).map((item) => {
                  const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        active ? 'bg-emerald-400/15 text-emerald-200' : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link href="/for-you" className="mb-2 block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            View storefront
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-[calc(100dvh-7rem)] pb-20 md:ml-60 md:min-h-screen md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.filter((item) => ['/admin', '/admin/orders', '/admin/sellers', '/admin/users', '/admin/mail'].includes(item.href)).map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-1 py-3 text-center text-[11px] ${active ? 'font-semibold text-emerald-800' : 'text-gray-500'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {commandOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onClick={() => setCommandOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-gray-200 px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Search admin commands…"
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setCommandOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto py-2">
              {filteredCommands.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      setCommandOpen(false);
                      setCommandQuery('');
                      router.push(item.href);
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-400">{item.hint}</span>
                  </button>
                </li>
              ))}
              {filteredCommands.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-gray-500">No matches</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
