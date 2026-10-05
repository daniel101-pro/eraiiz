import { alreadySentMail, markMailSent } from '@/lib/mailLog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEraiizEmail(input: {
  to?: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
}) {
  const to = String(input.to || '').trim().toLowerCase();
  if (!to || !to.includes('@')) {
    console.error('Email skipped: missing recipient', input.subject);
    return false;
  }

  if (input.idempotencyKey && (await alreadySentMail(input.idempotencyKey))) {
    return true;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>';

  if (resendKey) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    };
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey.slice(0, 256);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Failed to send email via Resend');
    }
    if (input.idempotencyKey) await markMailSent(input.idempotencyKey);
    return true;
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
        }),
      });
      if (response.ok) {
        if (input.idempotencyKey) await markMailSent(input.idempotencyKey);
        return true;
      }
    } catch (error) {
      console.error(`Email fallback failed for ${url}`, error);
    }
  }

  console.error(
    'Email not sent. Set RESEND_API_KEY and EMAIL_FROM on Vercel.',
    input.subject,
    to
  );
  return false;
}

export function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
