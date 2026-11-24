import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  addAdminMail,
  adminMailCounts,
  clearSentMail,
  getSentClearedAt,
  listAdminMail,
  rememberRemoteMail,
  type AdminMailFolder,
  type AdminMailMessage,
} from '@/lib/adminMailStore';
import {
  adminNotifyEmail,
  escapeHtml,
  getResendEmail,
  isEmailConfigured,
  listResendEmails,
  sendEraiizEmail,
} from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';

const FOLDERS: AdminMailFolder[] = ['inbox', 'sent', 'support', 'reports', 'starred', 'archived'];

function firstAddress(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || '');
  return String(value || '');
}

function parseSupportText(text: string) {
  const raw = String(text || '');
  const match = raw.match(/^From:\s*(.*?)\s*<([^>]+)>\s*\n\n([\s\S]*)$/i);
  if (!match) {
    return { fromName: '', fromEmail: '', body: raw };
  }
  return {
    fromName: match[1].trim(),
    fromEmail: match[2].trim().toLowerCase(),
    body: match[3].trim(),
  };
}

function mapResendOutbound(item: Record<string, unknown>): AdminMailMessage | null {
  const id = String(item.id || '');
  const toEmail = firstAddress(item.to || item.recipient).toLowerCase();
  if (!id || !toEmail) return null;
  return {
    id: `resend:${id}`,
    threadId: toEmail,
    folder: 'sent',
    fromName: 'Eraiiz',
    fromEmail: String(item.from || process.env.EMAIL_FROM || 'noreply@eraiiz.com'),
    toName: toEmail.split('@')[0],
    toEmail,
    subject: String(item.subject || '(no subject)'),
    text: String(item.text || item.html || ''),
    read: true,
    starred: false,
    createdAt: String(item.created_at || item.createdAt || new Date().toISOString()),
  };
}

function mapResendInboundAlert(item: Record<string, unknown>): AdminMailMessage | null {
  const id = String(item.id || '');
  const subject = String(item.subject || '');
  if (!id || !subject) return null;

  const isSupport = subject.startsWith('[Support]');
  const isReport = subject.startsWith('[Report]');
  if (!isSupport && !isReport) return null;

  const text = String(item.text || '');
  const parsed = parseSupportText(text);
  const replyTo = firstAddress(item.reply_to || item.replyTo).toLowerCase();
  const fromEmail = parsed.fromEmail || replyTo || 'unknown@eraiiz.com';
  const fromName = parsed.fromName || fromEmail.split('@')[0];
  const cleanSubject = subject.replace(/^\[(Support|Report)\]\s*/i, '') || subject;

  return {
    id: `resend-in:${id}`,
    threadId: fromEmail,
    folder: isReport ? 'reports' : 'support',
    fromName,
    fromEmail,
    toName: 'Eraiiz',
    toEmail: adminNotifyEmail(),
    subject: cleanSubject,
    text: parsed.body || text,
    read: false,
    starred: false,
    createdAt: String(item.created_at || item.createdAt || new Date().toISOString()),
  };
}

async function hydrateFromResend(folder: AdminMailFolder) {
  if (!isEmailConfigured()) return [] as AdminMailMessage[];

  const remote = await listResendEmails(50);
  const mapped: AdminMailMessage[] = [];

  // Enrich a handful of alert emails with body text (list endpoint is often metadata-only)
  const alertCandidates = remote
    .filter((item) => {
      const subject = String((item as Record<string, unknown>).subject || '');
      return subject.startsWith('[Support]') || subject.startsWith('[Report]');
    })
    .slice(0, 15);

  const details = await Promise.all(
    alertCandidates.map(async (item) => {
      const row = item as Record<string, unknown>;
      if (row.text || row.html) return row;
      const detail = await getResendEmail(String(row.id || ''));
      return detail ? { ...row, ...detail } : row;
    })
  );

  for (const item of details) {
    const inbound = mapResendInboundAlert(item);
    if (inbound) mapped.push(inbound);
  }

  if (folder === 'sent' || folder === 'inbox') {
    const clearedAt = await getSentClearedAt();
    const clearedMs = clearedAt ? new Date(clearedAt).getTime() : 0;
    for (const item of remote) {
      const row = item as Record<string, unknown>;
      const subject = String(row.subject || '');
      if (subject.startsWith('[Support]') || subject.startsWith('[Report]')) continue;
      const outbound = mapResendOutbound(row);
      if (!outbound) continue;
      if (clearedMs && new Date(outbound.createdAt).getTime() <= clearedMs) continue;
      mapped.push(outbound);
    }
  }

  if (mapped.length) {
    await rememberRemoteMail(mapped).catch(() => undefined);
  }

  return mapped;
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const folder = (request.nextUrl.searchParams.get('folder') || 'inbox') as AdminMailFolder;
  const query = request.nextUrl.searchParams.get('q') || '';
  const safeFolder = FOLDERS.includes(folder) ? folder : 'inbox';

  let messages = await listAdminMail(safeFolder, query);
  const remote = await hydrateFromResend(safeFolder);

  if (remote.length) {
    const existing = new Set(messages.map((item) => item.id));
    for (const item of remote) {
      if (existing.has(item.id)) continue;
      if (safeFolder === 'inbox') {
        if (item.folder === 'support' || item.folder === 'reports' || item.folder === 'inbox') {
          messages.push(item);
        }
      } else if (safeFolder === 'sent') {
        if (item.folder === 'sent') messages.push(item);
      } else if (item.folder === safeFolder) {
        messages.push(item);
      }
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      messages = messages.filter((item) =>
        [item.fromName, item.fromEmail, item.toName, item.toEmail, item.subject, item.text]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    messages = messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const counts = await adminMailCounts(remote);

  return secureAdminJson({
    messages,
    counts,
    provider: {
      resend: isEmailConfigured(),
      from: process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>',
      notify: adminNotifyEmail(),
    },
  });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const limited = rateLimit(`admin-mail:${session.email || clientIp(request)}`, 30, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ message: 'Too many emails. Try again later.' }, { status: 429 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { message: 'Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM on Vercel.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const to = String(body.to || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  const replyTo = String(body.replyTo || session.email || '').trim() || undefined;
  const requestedFrom = String(body.fromEmail || '').trim().toLowerCase();

  if (!to.includes('@') || !subject || !text) {
    return NextResponse.json({ message: 'To, subject, and message are required' }, { status: 400 });
  }

  const { formatMailFrom, getMailIdentity } = await import('@/lib/mailIdentitiesStore');
  const identity = requestedFrom
    ? await getMailIdentity(requestedFrom)
    : await getMailIdentity('support');
  const fromName = String(body.fromName || identity?.displayName || session.name || 'Eraiiz').trim();
  const fromEmail = identity?.email || 'noreply@eraiiz.com';
  const fromHeader = identity
    ? formatMailFrom({ displayName: fromName, email: fromEmail })
    : process.env.EMAIL_FROM || `Eraiiz <${fromEmail}>`;

  const sent = await sendEraiizEmail({
    to,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    replyTo,
    from: fromHeader,
    throwOnError: false,
  });

  if (!sent.ok) {
    await recordAdminAudit(request, session, {
      action: 'mail.send',
      resource: `email:${to}`,
      detail: sent.error || 'send failed',
      ok: false,
    });
    return NextResponse.json(
      { message: sent.error || 'Failed to send email via Resend' },
      { status: 502 }
    );
  }

  const message = await addAdminMail({
    folder: 'sent',
    fromName,
    fromEmail,
    toName: String(body.toName || to.split('@')[0]),
    toEmail: to,
    subject,
    text,
    read: true,
    threadId: body.threadId,
  });

  await recordAdminAudit(request, session, {
    action: 'mail.send',
    resource: `email:${to}`,
    detail: subject,
  });

  return secureAdminJson({ ...message, providerId: sent.id, provider: sent.provider });
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const folder = (request.nextUrl.searchParams.get('folder') || '').trim().toLowerCase();
  if (folder !== 'sent') {
    return NextResponse.json({ message: 'Only Sent history can be cleared' }, { status: 400 });
  }

  const result = await clearSentMail();
  await recordAdminAudit(request, session, {
    action: 'mail.clear_sent',
    resource: 'folder:sent',
    detail: `removed:${result.removed}`,
  });

  return secureAdminJson({
    ok: true,
    removed: result.removed,
    clearedAt: result.clearedAt,
  });
}
