'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../components/admin/adminApi';

type Health = {
  healthy: boolean;
  checks: Array<{ id: string; label: string; ok: boolean; status: number; ms: number; error?: string }>;
  runtime: { nodeEnv: string; vercel: boolean; region: string; generatedAt: string };
};

export default function AdminHealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await adminFetch('/api/admin/health'));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System health</h1>
          <p className="mt-1 text-sm text-gray-500">Live dependency checks for API, storefront, and payments.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-[#0b1220] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Re-run checks'}
        </button>
      </div>

      <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${data?.healthy ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {data ? (data.healthy ? 'All critical checks passed' : 'One or more checks need attention') : 'Loading…'}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(data?.checks || []).map((check) => (
          <div key={check.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{check.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${check.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {check.ok ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Status {check.status || '—'} · {check.ms || 0}ms
            </p>
            {check.error ? <p className="mt-1 text-xs text-red-600">{check.error}</p> : null}
          </div>
        ))}
      </div>

      {data?.runtime ? (
        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm">
          <h2 className="font-semibold">Runtime</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div><dt className="text-gray-500">Environment</dt><dd className="font-medium">{data.runtime.nodeEnv}</dd></div>
            <div><dt className="text-gray-500">Platform</dt><dd className="font-medium">{data.runtime.vercel ? 'Vercel' : 'Local'}</dd></div>
            <div><dt className="text-gray-500">Region</dt><dd className="font-medium">{data.runtime.region}</dd></div>
            <div><dt className="text-gray-500">Checked at</dt><dd className="font-medium">{new Date(data.runtime.generatedAt).toLocaleString()}</dd></div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
