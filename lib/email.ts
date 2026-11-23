import { alreadySentMail, markMailSent } from '@/lib/mailLog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function adminNotifyEmail() {
  return (
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.EMAIL_TO ||
    'projecterraiz@gmail.com'
  )
    .trim()
    .toLowerCase();
}

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  provider: 'resend' | 'fallback' | 'none';
  error?: string;
};

export async function sendEraiizEmail(input: {
  to?: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
  throwOnError?: boolean;
}): Promise<SendEmailResult> {
  const to = String(input.to || '').trim().toLowerCase();
  if (!to || !to.includes('@')) {
    const error = 'Email skipped: missing recipient';
    console.error(error, input.subject);
    if (input.throwOnError) throw new Error(error);
    return { ok: false, provider: 'none', error };
  }

  if (input.idempotencyKey && (await alreadySentMail(input.idempotencyKey))) {
    return { ok: true, provider: 'resend', id: 'idempotent' };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>';

  if (resendKey) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    };
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey.slice(0, 256);

    const payload: Record<string, unknown> = {
      from,
      to: [to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    };
    if (input.replyTo) payload.reply_to = input.replyTo;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const bodyText = await response.text();
    let parsed: { id?: string; message?: string; name?: string } = {};
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = {};
    }

    if (!response.ok) {
      const error = parsed.message || parsed.name || bodyText || 'Failed to send email via Resend';
      console.error('Resend error', response.status, error);
      if (input.throwOnError) throw new Error(error);
      return { ok: false, provider: 'resend', error };
    }

    if (input.idempotencyKey) await markMailSent(input.idempotencyKey);
    return { ok: true, provider: 'resend', id: parsed.id };
  }

  const fallbacks = [`${API_URL}/api/email`, `${API_URL}/api/emails/send`];
  for (const url of fallbacks) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          email: to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          message: input.text,
          type: 'order_update',
          replyTo: input.replyTo,
        }),
      });
      if (response.ok) {
        if (input.idempotencyKey) await markMailSent(input.idempotencyKey);
        return { ok: true, provider: 'fallback' };
      }
    } catch (error) {
      console.error(`Email fallback failed for ${url}`, error);
    }
  }

  const error = 'Email not sent. Set RESEND_API_KEY and EMAIL_FROM on Vercel.';
  console.error(error, input.subject, to);
  if (input.throwOnError) throw new Error(error);
  return { ok: false, provider: 'none', error };
}

export async function notifyAdminInbox(input: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  idempotencyKey?: string;
}) {
  return sendEraiizEmail({
    to: adminNotifyEmail(),
    subject: input.subject,
    text: input.text,
    html: input.html || `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
    replyTo: input.replyTo,
    idempotencyKey: input.idempotencyKey,
  });
}

export async function listResendEmails(limit = 40) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return [];

  try {
    const response = await fetch(`https://api.resend.com/emails?limit=${Math.min(100, Math.max(1, limit))}`, {
      headers: { Authorization: `Bearer ${resendKey}` },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const list = Array.isArray(data) ? data : data.data || data.emails || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
