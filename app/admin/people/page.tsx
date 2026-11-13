'use client';

import { useEffect, useState } from 'react';
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

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');

  const load = async (q = query) => {
    const data = await adminFetch(`/api/admin/people?q=${encodeURIComponent(q)}`);
    setPeople(data.people || []);
  };

  useEffect(() => {
    load().catch(() => setPeople([]));
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="hidden text-base font-semibold md:block">People</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load();
          }}
          placeholder="Search"
          className="w-full border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-900 focus:outline-none md:w-64"
        />
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {people.length === 0 ? (
          <p className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">Empty</p>
        ) : (
          people.map((person) => (
            <div key={`${person.role}-${person.id}`} className="border border-gray-200 bg-white p-4">
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

      <div className="mt-4 hidden overflow-x-auto border border-gray-200 bg-white md:block">
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
            {people.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Empty
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={`${person.role}-${person.id}`} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{person.name}</td>
                  <td className="px-4 py-3 text-gray-600">{person.email || '—'}</td>
                  <td className="px-4 py-3">{person.role}</td>
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
