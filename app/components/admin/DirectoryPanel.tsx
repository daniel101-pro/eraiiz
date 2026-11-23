'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from './adminApi';

type Person = {
  id: string;
  email: string;
  name: string;
  role: string;
  orders: number;
  spend: number;
  plan?: string;
  listings?: number;
};

type Activity = {
  person: Person;
  stats: {
    purchases: number;
    sales: number;
    spend: number;
    revenue: number;
    listings: number;
    mail: number;
    plan: string | null;
  };
  timeline: Array<{ id: string; at: string; type: string; title: string; detail: string }>;
  purchases: Array<{ id: string; reference: string; status: string; amount: number; createdAt: string }>;
  sales: Array<{ id: string; reference: string; status: string; amount: number; createdAt: string; buyer?: { name?: string; email?: string } }>;
};

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export default function DirectoryPanel({
  title,
  subtitle,
  role,
}: {
  title: string;
  subtitle: string;
  role: 'seller' | 'user' | 'all';
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [backendLinked, setBackendLinked] = useState(true);

  const load = async (q = query) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch(`/api/admin/people?role=${role}&q=${encodeURIComponent(q)}`);
      setPeople(data.people || []);
      setSources(Array.isArray(data.meta?.sources) ? data.meta.sources : []);
      setWarnings(Array.isArray(data.meta?.warnings) ? data.meta.warnings : []);
      setBackendLinked(Boolean(data.meta?.backendLinked));
    } catch (err) {
      setPeople([]);
      setSources([]);
      setWarnings([]);
      setBackendLinked(false);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [role]);

  const openPerson = async (person: Person) => {
    const key = person.email || person.id;
    setSelectedId(key);
    setActivityLoading(true);
    try {
      const data = await adminFetch(`/api/admin/people/${encodeURIComponent(key)}`);
      setActivity(data);
    } catch {
      setActivity(null);
    } finally {
      setActivityLoading(false);
    }
  };

  const totals = useMemo(
    () => ({
      count: people.length,
      spend: people.reduce((sum, person) => sum + Number(person.spend || 0), 0),
      orders: people.reduce((sum, person) => sum + Number(person.orders || 0), 0),
      listings: people.reduce((sum, person) => sum + Number(person.listings || 0), 0),
    }),
    [people]
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? 'Loading…'
              : `${totals.count} · ${totals.orders} order events · ${money(totals.spend)} tracked`}
            {role === 'seller' && !loading ? ` · ${totals.listings} listings seen` : ''}
          </p>
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
          {!loading && sources.length ? (
            <p className="mt-1 text-xs text-gray-400">Sources: {sources.join(', ')}</p>
          ) : null}
          {!loading && !backendLinked ? (
            <p className="mt-1 max-w-2xl text-xs text-amber-700">
              Full account list isn’t linked yet — backend `/api/admin/users` needs an admin-role token.
              Add `BACKEND_ADMIN_TOKEN` in Vercel (a JWT for a user with `role: admin` on Render), then refresh.
              {warnings[0] ? ` (${warnings[0]})` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load();
            }}
            placeholder={`Search ${role === 'seller' ? 'sellers' : role === 'all' ? 'accounts' : 'users'}`}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:w-72"
          />
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">{role === 'seller' ? 'Plan' : 'Role'}</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">{role === 'seller' ? 'Listings' : 'Spend'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : people.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No {role === 'seller' ? 'sellers' : 'users'} found
                    </td>
                  </tr>
                ) : (
                  people.map((person) => {
                    const key = person.email || person.id;
                    const active = selectedId === key;
                    return (
                      <tr
                        key={key}
                        className={`cursor-pointer border-b border-gray-100 last:border-0 ${active ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                        onClick={() => openPerson(person)}
                      >
                        <td className="px-4 py-3 font-medium">{person.name}</td>
                        <td className="px-4 py-3 text-gray-600">{person.email || '—'}</td>
                        <td className="px-4 py-3 capitalize">{role === 'seller' ? person.plan || 'commission' : person.role}</td>
                        <td className="px-4 py-3">{person.orders}</td>
                        <td className="px-4 py-3">
                          {role === 'seller' ? person.listings || 0 : money(person.spend)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {people.map((person) => (
              <button
                key={person.email || person.id}
                type="button"
                onClick={() => openPerson(person)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left"
              >
                <p className="truncate text-sm font-medium">{person.name}</p>
                <p className="truncate text-xs text-gray-500">{person.email || '—'}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {person.orders} orders · {role === 'seller' ? `${person.listings || 0} listings` : money(person.spend)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          {!selectedId ? (
            <div className="flex h-full min-h-[320px] items-center justify-center px-6 text-center text-sm text-gray-400">
              Select a {role === 'seller' ? 'seller' : 'user'} to see full activity
            </div>
          ) : activityLoading ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border border-gray-200 border-t-emerald-700" />
            </div>
          ) : !activity ? (
            <div className="flex h-full min-h-[320px] items-center justify-center px-6 text-sm text-gray-500">
              Couldn’t load activity
            </div>
          ) : (
            <div className="flex max-h-[75vh] flex-col">
              <div className="border-b border-gray-200 px-4 py-4">
                <p className="text-lg font-semibold tracking-tight">{activity.person.name}</p>
                <p className="text-sm text-gray-500">{activity.person.email || activity.person.id}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Purchases</p>
                    <p className="font-semibold">{activity.stats.purchases}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Sales</p>
                    <p className="font-semibold">{activity.stats.sales}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Spend</p>
                    <p className="font-semibold">{money(activity.stats.spend)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Revenue</p>
                    <p className="font-semibold">{money(activity.stats.revenue)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Listings</p>
                    <p className="font-semibold">{activity.stats.listings}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">Mail</p>
                    <p className="font-semibold">{activity.stats.mail}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <h2 className="text-sm font-semibold">Activity timeline</h2>
                {activity.timeline.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No tracked events yet</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {activity.timeline.map((event) => (
                      <li key={event.id} className="rounded-lg border border-gray-100 px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">{event.title}</p>
                          <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-400">{event.type}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{new Date(event.at).toLocaleString()}</p>
                        <p className="mt-1 text-sm text-gray-600">{event.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
