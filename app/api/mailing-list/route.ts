import { NextRequest, NextResponse } from 'next/server';
import { adminNotifyEmail, escapeHtml, notifyAdminInbox } from '@/lib/email';
import {
  listMailingList,
  syncMailingListToResend,
  upsertMailingListEntry,
} from '@/lib/mailingListStore';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { requireAdmin } from '@/lib/adminAuth';
import { secureAdminJson } from '@/lib/adminSecurity';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`mailing:${clientIp(request)}`, 12, 10 * 60_000);
    if (!limited.ok) {
      return NextResponse.json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const source = String(body.source || 'checkout').trim();
    const optedIn = body.optedIn !== false && body.optIn !== false;

    if (!optedIn) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: 'Valid email required' }, { status: 400 });
    }

    const entry = await upsertMailingListEntry({ email, name, phone, source });
    if (!entry) {
      return NextResponse.json({ message: 'Could not save signup' }, { status: 400 });
    }

    const synced = await syncMailingListToResend(entry).catch((error) => ({
      ok: false as const,
      reason: error instanceof Error ? error.message : 'sync_failed',
    }));

    await notifyAdminInbox({
      subject: `[Mailing list] ${entry.email}`,
      text: `New mailing list signup\n\nName: ${entry.name}\nEmail: ${entry.email}\nPhone: ${entry.phone || '—'}\nSource: ${entry.source}`,
      html: `<p><strong>New mailing list signup</strong></p><p>${escapeHtml(entry.name)} &lt;${escapeHtml(entry.email)}&gt;</p><p>Source: ${escapeHtml(entry.source)}</p>`,
      replyTo: entry.email,
      idempotencyKey: `mailing:${entry.email}:${entry.source}`,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      synced: synced.ok,
      audience: Boolean(process.env.RESEND_AUDIENCE_ID),
      notify: adminNotifyEmail(),
    });
  } catch {
    return NextResponse.json({ message: 'Failed to join mailing list' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const entries = await listMailingList();
  return secureAdminJson({ entries, count: entries.length });
}
