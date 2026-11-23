import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  addAdminMail,
  adminMailCounts,
  listAdminMail,
  type AdminMailFolder,
  type AdminMailMessage,
} from '@/lib/adminMailStore';
import {
  escapeHtml,
  isEmailConfigured,
  listResendEmails,
  sendEraiizEmail,
} from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';

const FOLDERS: AdminMailFolder[] = ['inbox', 'sent', 'support', 'reports', 'starred', 'archived'];

function mapResendToMail(item: Record<string, unknown>): AdminMailMessage | null {
  const id = String(item.id || '');
  const toRaw = item.to;
  const toEmail = Array.isArray(toRaw)
    ? String(toRaw[0] || '')
    : String(toRaw || item.recipient || '');
  if (!id || !toEmail) return null;
  return {
    id: `resend:${id}`,
    threadId: toEmail.toLowerCase(),
    folder: 'sent',
    fromName: 'Eraiiz',
    fromEmail: String(item.from || process.env.EMAIL_FROM || 'noreply@eraiiz.com'),
    toName: toEmail.split('@')[0],
    toEmail: toEmail.toLowerCase(),
    subject: String(item.subject || '(no subject)'),
    text: String(item.text || item.html || ''),
    read: true,
    starred: false,
    createdAt: String(item.created_at || item.createdAt || new Date().toISOString()),
  };
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const folder = (request.nextUrl.searchParams.get('folder') || 'inbox') as AdminMailFolder;
  const query = request.nextUrl.searchParams.get('q') || '';
  let messages = await listAdminMail(FOLDERS.includes(folder) ? folder : 'inbox', query);
  const counts = await adminMailCounts();

  // Hydrate Sent from Resend when local store is thin (common on Vercel /tmp)
  if (folder === 'sent' && messages.length < 3 && isEmailConfigured()) {
    const remote = await listResendEmails(50);
    const mapped = remote
      .map((item) => mapResendToMail(item as Record<string, unknown>))
      .filter(Boolean) as AdminMailMessage[];
    const existing = new Set(messages.map((item) => item.id));
    for (const item of mapped) {
      if (!existing.has(item.id)) messages.push(item);
    }
    messages = messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return secureAdminJson({
    messages,
    counts,
    provider: {
      resend: isEmailConfigured(),
      from: process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>',
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

  if (!to.includes('@') || !subject || !text) {
    return NextResponse.json({ message: 'To, subject, and message are required' }, { status: 400 });
  }

  const sent = await sendEraiizEmail({
    to,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    replyTo,
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
    fromName: session.name,
    fromEmail: session.email,
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
