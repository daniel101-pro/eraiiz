'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { adminFetch } from '../../components/admin/adminApi';

type SecurityPayload = {
  session: { email: string; name: string; role: string };
  controls: {
    httpsOnlyCookiesExpected: boolean;
    hstsEnabled: boolean;
    adminFramingDenied: boolean;
    adminNoStore: boolean;
    rateLimiting: boolean;
    mutationOriginCheck: boolean;
    auditLogging: boolean;
    allowlistAuth: boolean;
    env: Record<string, boolean>;
  };
  audit: Array<{
    id: string;
    at: string;
    actorEmail: string;
    action: string;
    resource: string;
    detail?: string;
    ip?: string;
    ok: boolean;
  }>;
  generatedAt: string;
};

const CONTROL_LABELS: Record<string, string> = {
  httpsOnlyCookiesExpected: 'HTTPS cookie posture',
  hstsEnabled: 'HSTS transport security',
  adminFramingDenied: 'Admin clickjacking defense',
  adminNoStore: 'Admin response no-store',
  rateLimiting: 'Admin API rate limiting',
  mutationOriginCheck: 'Same-origin write protection',
  auditLogging: 'Immutable-ish admin audit trail',
  allowlistAuth: 'Admin allowlist + live session verify',
};

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityPayload | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/security').then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-gray-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  const controlEntries = Object.entries(data.controls).filter(([key]) => key !== 'env') as Array<[string, boolean]>;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#0b1220] p-2.5 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Security center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hardened admin access: allowlist auth, origin-locked writes, rate limits, CSP, and audit history.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {controlEntries.map(([key, enabled]) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{CONTROL_LABELS[key] || key}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Environment readiness</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.controls.env).map(([key, ok]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className={ok ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                {ok ? 'Configured' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Admin audit trail</h2>
          <p className="text-xs text-gray-500">Recent privileged actions · signed in as {data.session.email}</p>
        </div>
        {data.audit.length === 0 ? (
          <p className="px-4 py-10 text-sm text-gray-500">No audited mutations yet</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.audit.map((event) => (
              <li key={event.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.action}</p>
                  <span className={`text-xs font-semibold ${event.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {event.ok ? 'OK' : 'FAILED'}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">
                  {event.resource}
                  {event.detail ? ` · ${event.detail}` : ''}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {event.actorEmail} · {event.ip || 'ip?'} · {new Date(event.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
