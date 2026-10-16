import { NextRequest, NextResponse } from 'next/server';
import { addAdminMail } from '@/lib/adminMailStore';
import { decodeAuthToken } from '@/lib/sellerPayoutStore';

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

  const identity = decodeAuthToken(authHeader);
  const email = String(identity?.email || 'unknown@eraiiz.com');

  await addAdminMail({
    folder: 'reports',
    fromName: email.split('@')[0],
    fromEmail: email,
    toName: 'Eraiiz',
    toEmail: 'projecterraiz@gmail.com',
    subject: `Report · ${reason.replace(/_/g, ' ')}`,
    text: description,
    productId,
    reason,
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
