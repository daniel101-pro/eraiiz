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
    <div className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-base font-semibold">People</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load();
          }}
          placeholder="Search"
          className="w-64 border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-900 focus:outline-none"
        />
      </div>
      <div className="mt-4 overflow-x-auto border border-gray-200 bg-white">
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
