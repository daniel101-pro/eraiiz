'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getValidAccessToken } from '../../utils/auth';

type InviteInfo = {
  email: string;
  name: string;
  invitedBy?: string;
  expiresAt?: string;
};

export default function JoinAdminPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = String(params?.token || '');
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const accept = useCallback(async () => {
    setAccepting(true);
    setError('');
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        router.push(`/login?next=${encodeURIComponent(`/join-admin/${token}`)}`);
        return;
      }

      const response = await fetch(`/api/join-admin/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/join-admin/${token}`)}`);
        return;
      }
      if (!response.ok) {
        throw new Error(data.message || 'Could not accept invite');
      }

      localStorage.setItem('role', 'admin');
      window.dispatchEvent(new Event('eraiiz:auth-changed'));
      router.replace(data.redirectTo || '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invite');
    } finally {
      setAccepting(false);
    }
  }, [router, token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/join-admin/${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Invite is invalid or expired');
        }
        if (cancelled) return;
        setInvite(data as InviteInfo);
        const accessToken = await getValidAccessToken().catch(() => null);
        if (cancelled) return;
        setSignedIn(Boolean(accessToken));
        if (accessToken) {
          setBusy(false);
          await accept();
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Invite unavailable');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, accept]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4 [font-family:Roboto,Arial,Helvetica,sans-serif]">
      <div className="w-full max-w-md rounded-2xl border border-[#dadce0] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73e8] text-sm font-bold text-white">
            M
          </span>
          <div>
            <p className="text-lg font-medium text-[#202124]">Eraiiz Admin</p>
            <p className="text-sm text-[#5f6368]">Secure invite onboarding</p>
          </div>
        </div>

        {busy ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#dadce0] border-t-[#1a73e8]" />
          </div>
        ) : error && !invite ? (
          <div>
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/login" className="mt-4 inline-block text-sm text-[#1a73e8] hover:underline">
              Go to login
            </Link>
          </div>
        ) : invite ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[#202124]">
              You&apos;ve been invited{invite.invitedBy ? ` by ${invite.invitedBy}` : ''} to access the Eraiiz
              admin panel.
            </p>
            <div className="rounded-xl bg-[#f8f9fa] px-4 py-3 text-sm">
              <p className="text-[#5f6368]">Invite email</p>
              <p className="font-medium text-[#202124]">{invite.email}</p>
              {invite.expiresAt ? (
                <p className="mt-2 text-xs text-[#5f6368]">
                  Expires {new Date(invite.expiresAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-[#5f6368]">
              Use <strong>{invite.email}</strong> for this invite.
            </p>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={accepting}
              onClick={accept}
              className="w-full rounded-full bg-[#0b57d0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b57d0]/90 disabled:bg-[#a8c7fa]"
            >
              {accepting ? 'Opening admin…' : signedIn ? 'Open admin' : 'Sign in to accept'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
