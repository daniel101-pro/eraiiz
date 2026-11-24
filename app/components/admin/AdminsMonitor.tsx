'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, Shield, UserPlus } from 'lucide-react';
import { adminFetch } from './adminApi';

type Operator = {
  id: string;
  email: string;
  name: string;
  status: 'invited' | 'active' | 'revoked';
  source: string;
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  lastSeenAt?: string;
  inviteExpiresAt?: string;
};

function when(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return '—';
  return date.toLocaleString();
}

function statusStyles(status: Operator['status']) {
  if (status === 'active') return 'bg-[#e6f4ea] text-[#137333]';
  if (status === 'invited') return 'bg-[#e8f0fe] text-[#1967d2]';
  return 'bg-[#fce8e6] text-[#c5221f]';
}

export default function AdminsMonitor() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [meta, setMeta] = useState({ active: 0, invited: 0, revoked: 0, resend: false });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [lastJoinUrl, setLastJoinUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/operators');
      setOperators(data.operators || []);
      setMeta(data.meta || { active: 0, invited: 0, revoked: 0, resend: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setLastJoinUrl('');
    try {
      const data = await adminFetch('/api/admin/operators', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });
      setEmail('');
      setName('');
      setLastJoinUrl(data.joinUrl || '');
      setNotice(
        data.emailed
          ? `Invite emailed to ${data.operator?.email}`
          : `Invite created. Copy the link below${data.emailError ? ` (${data.emailError})` : ''}.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (operator: Operator) => {
    if (!window.confirm(`Revoke admin access for ${operator.email}?`)) return;
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/operators', {
        method: 'PATCH',
        body: JSON.stringify({ email: operator.email, action: 'revoke' }),
      });
      setNotice(`Revoked ${operator.email}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!lastJoinUrl) return;
    await navigator.clipboard.writeText(lastJoinUrl);
    setNotice('Invite link copied');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-[#eceff1] px-4 py-3 sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-medium text-[#202124]">
            <Shield className="h-5 w-5 text-[#1a73e8]" />
            Admins
          </h1>
          <p className="text-sm text-[#5f6368]">
            Invite operators by email. They accept a secure link, then land in the admin panel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-full p-2 text-[#5f6368] hover:bg-black/5"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Active', value: meta.active },
            { label: 'Invited', value: meta.invited },
            { label: 'Revoked', value: meta.revoked },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[#f8f9fa] px-4 py-3">
              <p className="text-xs text-[#5f6368]">{item.label}</p>
              <p className="text-xl font-medium text-[#202124]">{item.value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={invite} className="mb-6 rounded-2xl border border-[#dadce0] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#202124]">
            <UserPlus className="h-4 w-4" />
            Invite admin
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="rounded-lg border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
            />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Display name (optional)"
              className="rounded-lg border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[#0b57d0] px-5 py-2 text-sm font-medium text-white hover:bg-[#0b57d0]/90 disabled:bg-[#a8c7fa]"
            >
              {busy ? 'Working…' : 'Send invite'}
            </button>
            <p className="text-xs text-[#5f6368]">
              {meta.resend
                ? 'Email goes through Resend with a 7-day accept link.'
                : 'Resend is not configured — you can still copy the invite link.'}
            </p>
          </div>
        </form>

        {notice ? <p className="mb-3 text-sm text-[#137333]">{notice}</p> : null}
        {error ? <p className="mb-3 text-sm text-[#c5221f]">{error}</p> : null}
        {lastJoinUrl ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#e8f0fe] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-[#1967d2]">{lastJoinUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1967d2]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#dadce0]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] text-xs uppercase tracking-wide text-[#5f6368]">
              <tr>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Last seen</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[#5f6368]">
                    {loading ? 'Loading…' : 'No admins yet'}
                  </td>
                </tr>
              ) : (
                operators.map((operator) => (
                  <tr key={operator.id} className="border-t border-[#eceff1]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#202124]">{operator.name || operator.email}</p>
                      <p className="text-xs text-[#5f6368]">{operator.email}</p>
                      <p className="mt-1 text-xs text-[#5f6368] sm:hidden">
                        <span className={`rounded-full px-2 py-0.5 ${statusStyles(operator.status)}`}>
                          {operator.status}
                        </span>
                      </p>
                      {operator.status === 'invited' ? (
                        <p className="mt-1 text-xs text-[#5f6368]">
                          Invited by {operator.invitedBy || '—'} · expires {when(operator.inviteExpiresAt)}
                        </p>
                      ) : null}
                      {operator.status === 'revoked' ? (
                        <p className="mt-1 text-xs text-[#5f6368]">
                          Revoked by {operator.revokedBy || '—'} · {when(operator.revokedAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles(operator.status)}`}>
                        {operator.status}
                      </span>
                      <p className="mt-1 text-[11px] text-[#5f6368]">{operator.source}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-[#5f6368] md:table-cell">
                      {when(operator.lastSeenAt || operator.acceptedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {operator.status !== 'revoked' && operator.source === 'invite' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => revoke(operator)}
                          className="text-xs font-medium text-[#c5221f] hover:underline disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      ) : operator.source === 'default' || operator.source === 'env' ? (
                        <span className="text-xs text-[#5f6368]">Protected</span>
                      ) : (
                        <span className="text-xs text-[#5f6368]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ol className="mt-6 list-decimal space-y-1 pl-5 text-sm text-[#5f6368]">
          <li>Invite their work email from this panel.</li>
          <li>They open the link, sign in with that same email, and accept.</li>
          <li>They are redirected into `/admin` with access unlocked.</li>
        </ol>
      </div>
    </div>
  );
}
