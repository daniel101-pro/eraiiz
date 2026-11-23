'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Person = {
  id: string;
  email: string;
  name: string;
  role: string;
  orders: number;
  spend: number;
  plan?: string;
};

function downloadCsv(people: Person[]) {
  const header = ['id', 'name', 'email', 'role', 'orders', 'spend', 'plan'];
  const rows = people.map((person) =>
    [person.id, person.name, person.email, person.role, person.orders, person.spend, person.plan || '']
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `eraiiz-people-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sources, setSources] = useState<string[]>([]);

  const load = async (q = query) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch(`/api/admin/people?q=${encodeURIComponent(q)}`);
      setPeople(data.people || []);
      setSources(data.meta?.sources || []);
    } catch (err) {
      setPeople([]);
      setError(err instanceof Error ? err.message : 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setPeople([]));
  }, []);

  const roles = useMemo(() => {
    const set = new Set(people.map((person) => person.role).filter(Boolean));
    return ['all', ...[...set].sort()];
  }, [people]);

  const filtered = useMemo(
    () => (role === 'all' ? people : people.filter((person) => person.role === role)),
    [people, role]
  );

  const totals = useMemo(
    () => ({
      people: filtered.length,
      spend: filtered.reduce((sum, person) => sum + Number(person.spend || 0), 0),
      orders: filtered.reduce((sum, person) => sum + Number(person.orders || 0), 0),
    }),
    [filtered]
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="text-sm text-gray-500">
            {loading
              ? 'Loading people…'
              : `${totals.people} accounts · ${totals.orders} orders · ₦${totals.spend.toLocaleString()} spend`}
            {sources.length ? ` · sources: ${sources.join(', ')}` : ''}
          </p>
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load();
            }}
            placeholder="Search people"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:w-64"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {roles.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:border-emerald-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            No people found yet. Sellers are loaded from catalog profiles and any available admin user API.
          </p>
        ) : (
          filtered.map((person) => (
            <div key={`${person.role}-${person.id}`} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="truncate text-sm font-medium">{person.name}</p>
              <p className="truncate text-xs text-gray-500">{person.email || '—'}</p>
              <p className="mt-2 text-xs text-gray-500">
                {person.role} · {person.orders} orders · ₦{Number(person.spend || 0).toLocaleString()}
                {person.plan ? ` · ${person.plan}` : ''}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spend</th>
              <th className="px-4 py-3 font-medium">Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No people found yet. Sellers are loaded from catalog profiles and any available admin user API.
                </td>
              </tr>
            ) : (
              filtered.map((person) => (
                <tr key={`${person.role}-${person.id}`} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{person.name}</td>
                  <td className="px-4 py-3 text-gray-600">{person.email || '—'}</td>
                  <td className="px-4 py-3 capitalize">{person.role}</td>
                  <td className="px-4 py-3">{person.orders}</td>
                  <td className="px-4 py-3">₦{Number(person.spend || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{person.plan || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
