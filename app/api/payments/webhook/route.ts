import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/paystack';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const data = event?.data;

    if (eventType === 'charge.success' && data?.reference) {
      await verifyTransaction(data.reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
