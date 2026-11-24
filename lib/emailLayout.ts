import { escapeHtml } from '@/lib/email';

const BRAND = {
  green: '#15803d',
  greenDark: '#14532d',
  ink: '#14231a',
  muted: '#5b6b61',
  line: '#e5ebe6',
  wash: '#f4f7f5',
  white: '#ffffff',
};

function paragraphsFromText(text: string) {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return '<p style="margin:0;color:#5b6b61"> </p>';

  return blocks
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, '<br/>');
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">${lines}</p>`;
    })
    .join('');
}

export function renderEraiizEmailHtml(input: {
  title?: string;
  preheader?: string;
  bodyHtml?: string;
  bodyText?: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  footerNote?: string;
  fromLabel?: string;
}) {
  const preheader = escapeHtml(input.preheader || input.title || 'Message from Eraiiz');
  const eyebrow = escapeHtml(input.eyebrow || 'Eraiiz');
  const title = input.title ? escapeHtml(input.title) : '';
  const body =
    input.bodyHtml ||
    paragraphsFromText(input.bodyText || '');
  const fromLabel = escapeHtml(input.fromLabel || 'Eraiiz');
  const footerNote = escapeHtml(
    input.footerNote || 'Shop sustainable. Live responsible.'
  );

  const cta = input.cta?.href
    ? `<p style="margin:28px 0 8px">
        <a href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:${BRAND.green};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:999px">
          ${escapeHtml(input.cta.label || 'Open Eraiiz')}
        </a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title || 'Eraiiz'}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.wash};color:${BRAND.ink}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.wash};padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${BRAND.white};border:1px solid ${BRAND.line};border-radius:18px;overflow:hidden">
          <tr>
            <td style="padding:22px 28px 18px;border-bottom:1px solid ${BRAND.line};background:linear-gradient(180deg,#f7fbf8 0%,#ffffff 100%)">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.green};font-weight:700">${eyebrow}</p>
              <p style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${BRAND.greenDark}">Eraiiz</p>
              ${title ? `<p style="margin:10px 0 0;font-size:16px;line-height:1.4;color:${BRAND.ink};font-weight:600">${title}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              ${body}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${BRAND.line};background:${BRAND.wash}">
              <p style="margin:0 0 4px;font-size:13px;color:${BRAND.ink};font-weight:600">${fromLabel}</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted}">${footerNote}</p>
              <p style="margin:12px 0 0;font-size:12px">
                <a href="https://www.eraiiz.com" style="color:${BRAND.green};text-decoration:none">eraiiz.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAdminMailHtml(input: {
  text: string;
  subject?: string;
  fromLabel?: string;
}) {
  return renderEraiizEmailHtml({
    eyebrow: 'Message',
    title: input.subject,
    bodyText: input.text,
    fromLabel: input.fromLabel || 'Eraiiz Support',
    footerNote: 'You’re receiving this from the Eraiiz team.',
  });
}

export function renderContactReceiptHtml(input: {
  name: string;
  subject: string;
  message: string;
}) {
  const quoted = escapeHtml(input.message).replace(/\n/g, '<br/>');
  return renderEraiizEmailHtml({
    eyebrow: 'Support',
    title: 'We got your message',
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">Hi ${escapeHtml(input.name)},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">Thanks for writing in. Our team has your note and will reply soon.</p>
      <div style="margin:0 0 8px;padding:16px 18px;border:1px solid ${BRAND.line};border-radius:14px;background:${BRAND.wash}">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:700">Your message</p>
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${BRAND.ink}">${escapeHtml(input.subject)}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted}">${quoted}</p>
      </div>
    `,
    fromLabel: 'Eraiiz Support',
    cta: { label: 'Visit Eraiiz', href: 'https://www.eraiiz.com' },
  });
}

export function renderAdminAlertHtml(input: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  body?: string;
}) {
  const rows = input.rows
    .map(
      (row) => `
      <tr>
        <td style="padding:8px 0;font-size:12px;color:${BRAND.muted};width:120px;vertical-align:top">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;font-size:14px;color:${BRAND.ink};vertical-align:top">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join('');
  const body = input.body
    ? `<div style="margin-top:16px;padding:16px 18px;border:1px solid ${BRAND.line};border-radius:14px;background:${BRAND.wash}">
        <p style="margin:0;font-size:14px;line-height:1.65;color:${BRAND.ink}">${escapeHtml(input.body).replace(/\n/g, '<br/>')}</p>
      </div>`
    : '';

  return renderEraiizEmailHtml({
    eyebrow: 'Admin alert',
    title: input.title,
    bodyHtml: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows}</table>
      ${body}
    `,
    fromLabel: 'Eraiiz Admin Desk',
    cta: { label: 'Open admin mail', href: 'https://www.eraiiz.com/admin/mail' },
  });
}
