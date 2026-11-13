import { NextRequest, NextResponse } from 'next/server';
import {
  createBackendOrders,
  summarizeVerifiedPayment,
  validateCheckoutInput,
} from '@/lib/checkout';
import { verifyTransaction } from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';
import { claimPaymentReference, releasePaymentReference } from '@/lib/processedPayments';

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

    const createOrders = await claimPaymentReference(`backend:${reference}`);
    const notify = await claimPaymentReference(`notify:${reference}`);
    if (createOrders || notify) {
      try {
        await createBackendOrders({
          createOrders,
          notify,
          items: checkout.items,
          billing: {
            ...checkout.billing,
            email: checkout.billing.email || checkout.email || transaction.customer?.email || '',
          },
          reference,
          amountNgn: checkout.amountNgn,
          authHeader,
          origin: request.nextUrl.origin,
          buyerEmail: checkout.email || checkout.billing.email || transaction.customer?.email,
        });
      } catch (error) {
        if (createOrders) await releasePaymentReference(`backend:${reference}`);
        if (notify) await releasePaymentReference(`notify:${reference}`);
        throw error;
      }
    }

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
