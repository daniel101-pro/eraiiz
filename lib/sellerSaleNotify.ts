import { sendSellerNewOrderEmail } from '@/lib/orderEmails';
import { appOrigin } from '@/lib/appUrl';

export { appOrigin };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

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
  origin?: string;
}) {
  await sendSellerNewOrderEmail({
    to: input.to,
    sellerName: input.sellerName,
    items: input.productNames.map((name) => ({ name, quantity: input.quantity })),
    billing: input.billing,
    reference: input.reference,
    origin: input.origin,
  });
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
