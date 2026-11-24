'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cloud, LogOut, Plus, X } from 'lucide-react';
import { adminFetch } from './adminApi';

export type MailIdentity = {
  id: string;
  localPart: string;
  email: string;
  displayName: string;
  color: string;
  createdAt: string;
};

type Props = {
  activeEmail?: string;
  onChange: (identity: MailIdentity) => void;
  adminName?: string;
  onSignOut?: () => void;
};

function initials(name: string, email: string) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 1).toUpperCase();
}

export default function MailIdentitySwitcher({ activeEmail, onChange, adminName, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [identities, setIdentities] = useState<MailIdentity[]>([]);
  const [domain, setDomain] = useState('eraiiz.com');
  const [creating, setCreating] = useState(false);
  const [localPart, setLocalPart] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await adminFetch('/api/admin/mail/identities');
    setIdentities(data.identities || []);
    setDomain(data.domain || 'eraiiz.com');
    return (data.identities || []) as MailIdentity[];
  }, []);

  useEffect(() => {
    load()
      .then((list) => {
        if (!list.length) return;
        const current = list.find((item) => item.email === activeEmail) || list[0];
        onChange(current);
      })
      .catch(() => {});
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = identities.find((item) => item.email === activeEmail) || identities[0];

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/mail/identities', {
        method: 'POST',
        body: JSON.stringify({ localPart, displayName }),
      });
      const identity = data.identity as MailIdentity;
      const list = await load();
      const next = list.find((item) => item.email === identity.email) || identity;
      onChange(next);
      setLocalPart('');
      setDisplayName('');
      setCreating(false);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create address');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: active?.color || '#1a73e8' }}
        title={active?.email || 'Eraiiz mail'}
        aria-label="Mail identities"
      >
        {initials(active?.displayName || '', active?.email || 'E')}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close identities"
            onClick={() => {
              setOpen(false);
              setCreating(false);
              setError('');
            }}
          />
          <div className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-[#dadce0] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            <div className="relative px-4 pb-3 pt-4 text-center">
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full p-1.5 text-[#5f6368] hover:bg-black/5"
                onClick={() => {
                  setOpen(false);
                  setCreating(false);
                }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium text-white"
                style={{ backgroundColor: active?.color || '#1a73e8' }}
              >
                {initials(active?.displayName || '', active?.email || 'E')}
              </div>
              <p className="text-base font-medium text-[#202124]">{active?.displayName || 'Eraiiz'}</p>
              <p className="text-sm text-[#5f6368]">{active?.email}</p>
              <p className="mt-1 text-xs text-[#5f6368]">Signed in as {adminName || 'Admin'}</p>
            </div>

            <div className="max-h-64 overflow-y-auto border-y border-[#eceff1]">
              {identities.map((item) => {
                const selected = item.email === active?.email;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setOpen(false);
                      setCreating(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8f9fa] ${
                      selected ? 'bg-[#e8f0fe]' : ''
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {initials(item.displayName, item.email)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#202124]">{item.displayName}</span>
                      <span className="block truncate text-xs text-[#5f6368]">{item.email}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {creating ? (
              <form onSubmit={create} className="space-y-3 border-b border-[#eceff1] px-4 py-3">
                <p className="text-sm font-medium text-[#202124]">Create Eraiiz address</p>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#dadce0] focus-within:border-[#1a73e8]">
                  <input
                    autoFocus
                    required
                    value={localPart}
                    onChange={(event) => setLocalPart(event.target.value.toLowerCase())}
                    placeholder="support"
                    className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                    pattern="[a-z0-9._+\-]{2,64}"
                    title="Letters, numbers, dots, underscores"
                  />
                  <span className="shrink-0 bg-[#f8f9fa] px-3 py-2 text-sm text-[#5f6368]">@{domain}</span>
                </div>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name (optional)"
                  className="w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
                />
                {error ? <p className="text-xs text-[#c5221f]">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-[#0b57d0] px-4 py-1.5 text-sm font-medium text-white disabled:bg-[#a8c7fa]"
                  >
                    {busy ? 'Creating…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setError('');
                    }}
                    className="rounded-full px-4 py-1.5 text-sm text-[#5f6368] hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-b border-[#eceff1] py-1">
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8f9fa]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8eaed] text-[#5f6368]">
                    <Plus className="h-4 w-4" />
                  </span>
                  Add another address
                </button>
                {onSignOut ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8f9fa]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8eaed] text-[#5f6368]">
                      <LogOut className="h-4 w-4" />
                    </span>
                    Sign out
                  </button>
                ) : null}
              </div>
            )}

            <div className="space-y-2 px-4 py-3">
              <p className="text-center text-xs text-[#5f6368]">
                New mail sends as the selected <span className="font-medium">@{domain}</span> address.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-[#5f6368]">
                <Cloud className="h-3.5 w-3.5" />
                Eraiiz Mail identities
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
