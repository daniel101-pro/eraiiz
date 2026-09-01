import { NextRequest, NextResponse } from 'next/server';
import {
  createBackendOrders,
  summarizeVerifiedPayment,
  validateCheckoutInput,
} from '@/lib/checkout';
import { verifyTransaction } from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();
    const { reference, items, billing } = body;

    if (!reference) {
      return NextResponse.json({ message: 'Payment reference is required' }, { status: 400 });
    }

    const checkout = await validateCheckoutInput({
      items,
      billing,
      authHeader,
    });

    const transaction = await verifyTransaction(reference);

    if (transaction.status !== 'success') {
      return NextResponse.json({ message: 'Payment was not successful' }, { status: 400 });
    }

    if (transaction.amount !== checkout.amountKobo) {
      return NextResponse.json(
        { message: 'Paid amount does not match order total' },
        { status: 400 }
      );
    }

    await createBackendOrders({
      items: checkout.items,
      billing: checkout.billing,
      reference,
      amountNgn: checkout.amountNgn,
      authHeader,
    });

    return NextResponse.json({
      success: true,
      payment: summarizeVerifiedPayment(transaction),
      items: checkout.items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to verify payment';
    return NextResponse.json({ message }, { status: 400 });
  }
}
