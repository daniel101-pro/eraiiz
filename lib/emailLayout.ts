import { escapeHtml } from '@/lib/email';

const BRAND = {
  green: '#15803d',
  greenDark: '#14532d',
  ink: '#1a2420',
  muted: '#5b6b61',
  line: '#d7e0d9',
  wash: '#eef2ef',
  card: '#f7faf8',
  white: '#fbfcfb',
};

function paragraphsFromText(text: string) {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return `<p class="tx-muted" style="margin:0;color:${BRAND.muted}"> </p>`;

  return blocks
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, '<br/>');
      return `<p class="tx-ink" style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">${lines}</p>`;
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
  const body = input.bodyHtml || paragraphsFromText(input.bodyText || '');
  const fromLabel = escapeHtml(input.fromLabel || 'Eraiiz');
  const footerNote = escapeHtml(input.footerNote || 'Shop sustainable. Live responsible.');

  const cta = input.cta?.href
    ? `<p style="margin:28px 0 8px">
        <a class="btn" href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:${BRAND.green};color:#f7faf8;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:999px;border:1px solid ${BRAND.green}">
          ${escapeHtml(input.cta.label || 'Open Eraiiz')}
        </a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title || 'Eraiiz'}</title>
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; }
    /* Keep light design readable if a client still forces dark */
    @media (prefers-color-scheme: dark) {
      .bg-page { background-color: #121714 !important; }
      .bg-card { background-color: #1b231e !important; }
      .bg-header { background-color: #1f2a24 !important; background-image: none !important; }
      .bg-footer { background-color: #161d19 !important; }
      .bg-panel { background-color: #232c27 !important; }
      .tx-ink { color: #ecf0ea !important; }
      .tx-muted { color: #a9b3aa !important; }
      .tx-brand { color: #7dcea0 !important; }
      .tx-title { color: #ecf0ea !important; }
      .bd-line { border-color: #2f3b34 !important; }
      .btn { background-color: #15803d !important; color: #f7faf8 !important; border-color: #15803d !important; }
      .link { color: #7dcea0 !important; }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${BRAND.wash};color:${BRAND.ink}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all">${preheader}</div>
  <table role="presentation" class="bg-page" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND.wash}" style="background-color:${BRAND.wash};padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" class="bg-card bd-line" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND.white}" style="max-width:560px;background-color:${BRAND.white};border:1px solid ${BRAND.line};border-radius:18px;overflow:hidden">
          <tr>
            <td class="bg-header bd-line" bgcolor="${BRAND.card}" style="padding:22px 28px 18px;border-bottom:1px solid ${BRAND.line};background-color:${BRAND.card}">
              <p class="tx-brand" style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.green};font-weight:700;font-family:Arial,Helvetica,sans-serif">${eyebrow}</p>
              <p class="tx-brand" style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${BRAND.greenDark};font-family:Arial,Helvetica,sans-serif">Eraiiz</p>
              ${
                title
                  ? `<p class="tx-title" style="margin:10px 0 0;font-size:16px;line-height:1.4;color:${BRAND.ink};font-weight:600;font-family:Arial,Helvetica,sans-serif">${title}</p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td class="bg-card" bgcolor="${BRAND.white}" style="padding:28px;background-color:${BRAND.white};font-family:Arial,Helvetica,sans-serif">
              ${body}
              ${cta}
            </td>
          </tr>
          <tr>
            <td class="bg-footer bd-line" bgcolor="${BRAND.wash}" style="padding:18px 28px 24px;border-top:1px solid ${BRAND.line};background-color:${BRAND.wash};font-family:Arial,Helvetica,sans-serif">
              <p class="tx-ink" style="margin:0 0 4px;font-size:13px;color:${BRAND.ink};font-weight:600">${fromLabel}</p>
              <p class="tx-muted" style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted}">${footerNote}</p>
              <p style="margin:12px 0 0;font-size:12px">
                <a class="link" href="https://www.eraiiz.com" style="color:${BRAND.green};text-decoration:none">eraiiz.com</a>
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
      <p class="tx-ink" style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">Hi ${escapeHtml(input.name)},</p>
      <p class="tx-ink" style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.ink}">Thanks for writing in. Our team has your note and will reply soon.</p>
      <div class="bg-panel bd-line" style="margin:0 0 8px;padding:16px 18px;border:1px solid ${BRAND.line};border-radius:14px;background-color:${BRAND.wash}">
        <p class="tx-muted" style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:700">Your message</p>
        <p class="tx-ink" style="margin:0 0 6px;font-size:14px;font-weight:600;color:${BRAND.ink}">${escapeHtml(input.subject)}</p>
        <p class="tx-muted" style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted}">${quoted}</p>
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
        <td class="tx-muted" style="padding:8px 0;font-size:12px;color:${BRAND.muted};width:120px;vertical-align:top">${escapeHtml(row.label)}</td>
        <td class="tx-ink" style="padding:8px 0;font-size:14px;color:${BRAND.ink};vertical-align:top">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join('');
  const body = input.body
    ? `<div class="bg-panel bd-line" style="margin-top:16px;padding:16px 18px;border:1px solid ${BRAND.line};border-radius:14px;background-color:${BRAND.wash}">
        <p class="tx-ink" style="margin:0;font-size:14px;line-height:1.65;color:${BRAND.ink}">${escapeHtml(input.body).replace(/\n/g, '<br/>')}</p>
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
