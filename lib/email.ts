const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function sendEraiizEmail(input: {
  to?: string;
  subject: string;
  text: string;
  html: string;
}) {
  const to = String(input.to || '').trim();
  if (!to || !to.includes('@')) return;

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>';

  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
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
      throw new Error(detail || 'Failed to send email');
    }
    return;
  }

  try {
    await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        type: 'order_update',
      }),
    });
  } catch (error) {
    console.error('Backend email fallback failed', error);
  }
}

export function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
