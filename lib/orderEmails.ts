import { appOrigin } from '@/lib/appUrl';
import { sendEraiizEmail, escapeHtml } from '@/lib/email';

function productLine(items: Array<{ name?: string; quantity?: number }>) {
  return items
    .map((item) => `${item.quantity && item.quantity > 1 ? `${item.quantity} × ` : ''}${item.name || 'Product'}`)
    .join(', ') || 'your order';
}

function wrapHtml(body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:560px">
      ${body}
      <p style="color:#666;font-size:12px">Eraiiz</p>
    </div>
  `;
}

export async function sendBuyerOrderConfirmedEmail(input: {
  to?: string;
  name?: string;
  items: Array<{ name?: string; quantity?: number }>;
  reference: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const ordersUrl = `${appOrigin(input.origin)}/account?section=Orders`;
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,';
  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `buyer-confirmed:${input.reference}:${input.to || ''}`,
    subject: `Your Eraiiz order is confirmed`,
    text: [
      greeting,
      '',
      `Your order for ${products} is confirmed.`,
      'The seller has not shipped yet. Track it anytime from Orders.',
      '',
      ordersUrl,
      `Reference: ${input.reference}`,
    ].join('\n'),
    html: wrapHtml(`
      <p>${escapeHtml(greeting)}</p>
      <p>Your order for <strong>${escapeHtml(products)}</strong> is confirmed.</p>
      <p>The seller has not shipped yet. You can track this order from your account.</p>
      <p><a href="${escapeHtml(ordersUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Track order</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}

export async function sendBuyerShippedEmail(input: {
  to?: string;
  name?: string;
  items: Array<{ name?: string; quantity?: number }>;
  reference: string;
  trackingNumber: string;
  courierName: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const ordersUrl = `${appOrigin(input.origin)}/account?section=Orders`;
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,';
  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `buyer-shipped:${input.reference}:${input.to || ''}`,
    subject: `Your Eraiiz order is on the way`,
    text: [
      greeting,
      '',
      `The seller shipped ${products}.`,
      `Courier: ${input.courierName}`,
      `Tracking number: ${input.trackingNumber}`,
      '',
      `Track it here: ${ordersUrl}`,
      `Reference: ${input.reference}`,
    ].join('\n'),
    html: wrapHtml(`
      <p>${escapeHtml(greeting)}</p>
      <p>The seller shipped <strong>${escapeHtml(products)}</strong>.</p>
      <p><strong>Courier:</strong> ${escapeHtml(input.courierName)}<br/>
      <strong>Tracking number:</strong> ${escapeHtml(input.trackingNumber)}</p>
      <p><a href="${escapeHtml(ordersUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Track order</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}

export async function sendBuyerDeliveredEmail(input: {
  to?: string;
  name?: string;
  items: Array<{ name?: string; quantity?: number }>;
  reference: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const ordersUrl = `${appOrigin(input.origin)}/account?section=Orders`;
  const greeting = input.name ? `Hi ${input.name},` : 'Hi,';
  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `buyer-delivered:${input.reference}:${input.to || ''}`,
    subject: `Your Eraiiz order was delivered`,
    text: [
      greeting,
      '',
      `The seller marked ${products} as delivered.`,
      '',
      ordersUrl,
      `Reference: ${input.reference}`,
    ].join('\n'),
    html: wrapHtml(`
      <p>${escapeHtml(greeting)}</p>
      <p>The seller marked <strong>${escapeHtml(products)}</strong> as delivered.</p>
      <p><a href="${escapeHtml(ordersUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View order</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}

export async function sendSellerShippedEmail(input: {
  to?: string;
  items: Array<{ name?: string; quantity?: number }>;
  reference: string;
  trackingNumber: string;
  courierName: string;
  buyerName?: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const shippingUrl = `${appOrigin(input.origin)}/account?section=Shipping`;
  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `seller-shipped:${input.reference}:${input.to || ''}`,
    subject: `You shipped an Eraiiz order`,
    text: [
      `You marked ${products} as shipped.`,
      `Courier: ${input.courierName}`,
      `Tracking number: ${input.trackingNumber}`,
      input.buyerName ? `Buyer: ${input.buyerName}` : '',
      'We emailed the buyer this tracking info.',
      '',
      shippingUrl,
      `Reference: ${input.reference}`,
    ]
      .filter(Boolean)
      .join('\n'),
    html: wrapHtml(`
      <p>You marked <strong>${escapeHtml(products)}</strong> as shipped.</p>
      <p><strong>Courier:</strong> ${escapeHtml(input.courierName)}<br/>
      <strong>Tracking number:</strong> ${escapeHtml(input.trackingNumber)}</p>
      <p>We emailed the buyer this tracking info.</p>
      <p><a href="${escapeHtml(shippingUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open shipping</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}

export async function sendSellerNewOrderEmail(input: {
  to?: string;
  sellerName?: string;
  items: Array<{ name?: string; quantity?: number }>;
  billing: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  reference: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const quantity = input.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const shippingUrl = `${appOrigin(input.origin)}/account?section=Shipping`;
  const greeting = input.sellerName ? `Hi ${input.sellerName},` : 'Hi,';

  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `seller-sale:${input.reference}:${input.to || ''}`,
    subject: `New Eraiiz order: ${products}`,
    text: [
      greeting,
      '',
      `You have a new order for ${products} (qty ${quantity}).`,
      '',
      'Ship to:',
      input.billing.fullName,
      input.billing.address,
      `${input.billing.city}, ${input.billing.state} ${input.billing.postalCode}`,
      input.billing.phone,
      '',
      `Open shipping: ${shippingUrl}`,
      `Reference: ${input.reference}`,
    ].join('\n'),
    html: wrapHtml(`
      <p>${escapeHtml(greeting)}</p>
      <p>You have a new order for <strong>${escapeHtml(products)}</strong> (qty ${quantity}).</p>
      <p><strong>Ship to</strong><br/>
      ${escapeHtml(input.billing.fullName)}<br/>
      ${escapeHtml(input.billing.address)}<br/>
      ${escapeHtml(input.billing.city)}, ${escapeHtml(input.billing.state)} ${escapeHtml(input.billing.postalCode)}<br/>
      ${escapeHtml(input.billing.phone)}</p>
      <p><a href="${escapeHtml(shippingUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open shipping</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}

export async function sendSellerDeliveredEmail(input: {
  to?: string;
  items: Array<{ name?: string; quantity?: number }>;
  reference: string;
  origin?: string;
}) {
  const products = productLine(input.items);
  const shippingUrl = `${appOrigin(input.origin)}/account?section=Shipping`;
  await sendEraiizEmail({
    to: input.to,
    idempotencyKey: `seller-delivered:${input.reference}:${input.to || ''}`,
    subject: `You marked an Eraiiz order delivered`,
    text: [
      `You marked ${products} as delivered.`,
      'We emailed the buyer.',
      '',
      shippingUrl,
      `Reference: ${input.reference}`,
    ].join('\n'),
    html: wrapHtml(`
      <p>You marked <strong>${escapeHtml(products)}</strong> as delivered.</p>
      <p>We emailed the buyer.</p>
      <p><a href="${escapeHtml(shippingUrl)}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open shipping</a></p>
      <p style="color:#666;font-size:12px">Reference: ${escapeHtml(input.reference)}</p>
    `),
  });
}
