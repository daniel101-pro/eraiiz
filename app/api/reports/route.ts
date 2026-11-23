import { NextRequest, NextResponse } from 'next/server';
import { addAdminMail } from '@/lib/adminMailStore';
import { getVerifiedUser } from '@/lib/sellerPayoutStore';
import { adminNotifyEmail, escapeHtml, notifyAdminInbox } from '@/lib/email';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Please log in to submit a report' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const productId = String(body.productId || '');
  const reason = String(body.reason || '');
  const description = String(body.description || '').trim();

  if (!productId || !reason || description.length < 10) {
    return NextResponse.json({ message: 'Reason and a detailed description are required' }, { status: 400 });
  }

  const user = await getVerifiedUser(authHeader);
  if (!user) {
    return NextResponse.json({ message: 'Please log in to submit a report' }, { status: 401 });
  }
  const email = String(user.email || 'unknown@eraiiz.com');

  await addAdminMail({
    folder: 'reports',
    fromName: email.split('@')[0],
    fromEmail: email,
    toName: 'Eraiiz',
    toEmail: adminNotifyEmail(),
    subject: `Report · ${reason.replace(/_/g, ' ')}`,
    text: description,
    productId,
    reason,
  });

  await notifyAdminInbox({
    subject: `[Report] ${reason.replace(/_/g, ' ')} · ${productId}`,
    text: `Reporter: ${email}\nProduct: ${productId}\nReason: ${reason}\n\n${description}`,
    html: `<p><strong>Reporter:</strong> ${escapeHtml(email)}</p><p><strong>Product:</strong> ${escapeHtml(productId)}</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><p style="white-space:pre-wrap">${escapeHtml(description)}</p>`,
    replyTo: email,
    idempotencyKey: `report:${email}:${productId}:${reason}:${description.slice(0, 40)}`,
  });

  try {
    await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, reason, description }),
    });
  } catch {
    // local report still lands in admin mail
  }

  return NextResponse.json({ ok: true });
}
