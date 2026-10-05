const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export function appOrigin(fallback?: string) {
  if (fallback) return fallback.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '')}`;
  }
  return 'https://www.eraiiz.com';
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendSellerSaleEmail(input: {
  to: string;
  sellerName?: string;
  productNames: string[];
  quantity: number;
  billing: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  shippingUrl: string;
  reference: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Eraiiz <noreply@eraiiz.com>';
  const products = input.productNames.join(', ') || 'a product';
  const greeting = input.sellerName ? `Hi ${input.sellerName},` : 'Hi,';

  const text = [
    greeting,
    '',
    `You have a new order for ${products} (qty ${input.quantity}).`,
    '',
    'Ship to:',
    input.billing.fullName,
    input.billing.address,
    `${input.billing.city}, ${input.billing.state} ${input.billing.postalCode}`,
    input.billing.phone,
    '',
    `Arrange shipping: ${input.shippingUrl}`,
    `Reference: ${input.reference}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <p>${escapeHtml(greeting)}</p>
      <p>You have a new order for <strong>${escapeHtml(products)}</strong> (qty ${input.quantity}).</p>
      <p><strong>Ship to</strong><br/>
      ${escapeHtml(input.billing.fullName)}<br/>
      ${escapeHtml(input.billing.address)}<br/>
      ${escapeHtml(input.billing.city)}, ${escapeHtml(input.billing.state)} ${escapeHtml(input.billing.postalCode)}<br/>
      ${escapeHtml(input.billing.phone)}</p>
      <p><a href="${escapeHtml(input.shippingUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open shipping</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    </div>
  `;

  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `New Eraiiz order: ${products}`,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || 'Failed to send seller email');
    }
    return;
  }

  try {
    await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: input.to,
        subject: `New Eraiiz order: ${products}`,
        text,
        html,
        type: 'seller_sale',
      }),
    });
  } catch (error) {
    console.error('Backend email fallback failed', error);
  }
}

export async function createSellerInAppNotification(input: {
  sellerId: string;
  message: string;
  reference: string;
  shippingUrl: string;
  authHeader?: string;
}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (input.authHeader) headers.Authorization = input.authHeader;

  const payload = {
    userId: input.sellerId,
    user: input.sellerId,
    recipient: input.sellerId,
    recipientId: input.sellerId,
    sellerId: input.sellerId,
    type: 'order',
    title: 'New order',
    message: input.message,
    content: input.message,
    read: false,
    link: '/account?section=Shipping',
    data: {
      paymentReference: input.reference,
      shippingUrl: input.shippingUrl,
    },
  };

  const attempts = [
    `${API_URL}/api/notifications`,
    `${API_URL}/api/users/${input.sellerId}/notifications`,
  ];

  for (const url of attempts) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (response.ok) return;
    } catch (error) {
      console.error(`Seller notification post failed for ${url}`, error);
    }
  }
}
