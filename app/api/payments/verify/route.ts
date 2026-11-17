import { NextRequest, NextResponse } from 'next/server';
import {
  createBackendOrders,
  summarizeVerifiedPayment,
  validateCheckoutInput,
} from '@/lib/checkout';
import { convertFromNgn } from '@/lib/fxRates';
import { verifyTransaction } from '@/lib/paystack';
import { isPaystackConfigured, toKobo, toMinorUnits } from '@/lib/paymentConfig';
import { claimPaymentReference, releasePaymentReference } from '@/lib/processedPayments';
import {
  createConnectTransfer,
  isStripeConfigured,
  retrieveCheckoutSession,
} from '@/lib/stripeConnect';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();
    const { reference, items, billing, sessionId, provider } = body;

    if (!reference && !sessionId) {
      return NextResponse.json({ message: 'Payment reference is required' }, { status: 400 });
    }

    const checkout = await validateCheckoutInput({
      items,
      billing,
      authHeader,
    });

    const useStripe =
      provider === 'stripe' ||
      checkout.provider === 'stripe' ||
      Boolean(sessionId);

    if (useStripe) {
      if (!isStripeConfigured()) {
        return NextResponse.json(
          { message: 'Card checkout is temporarily unavailable' },
          { status: 503 }
        );
      }
      if (!sessionId) {
        return NextResponse.json({ message: 'Stripe session is required' }, { status: 400 });
      }

      const session = await retrieveCheckoutSession(String(sessionId));
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ message: 'Payment was not successful' }, { status: 400 });
      }

      const paidReference =
        session.client_reference_id ||
        session.metadata?.reference ||
        reference ||
        session.id;

      const chargeCurrency = String(
        session.currency || session.metadata?.chargeCurrency || 'usd'
      ).toLowerCase();
      const expectedMinor = Number(
        session.metadata?.chargeAmountMinor ||
          toMinorUnits(
            await convertFromNgn(checkout.amountNgn, chargeCurrency.toUpperCase()),
            chargeCurrency.toUpperCase()
          )
      );

      // Allow 2% FX drift when metadata is missing and we recompute.
      const paid = Number(session.amount_total || 0);
      const drift = Math.abs(paid - expectedMinor) / Math.max(expectedMinor, 1);
      if (paid < 1 || drift > 0.02) {
        return NextResponse.json(
          { message: 'Paid amount does not match order total' },
          { status: 400 }
        );
      }

      const createOrders = await claimPaymentReference(`backend:${paidReference}`);
      const notify = await claimPaymentReference(`notify:${paidReference}`);
      const transferClaim = await claimPaymentReference(`stripe-transfer:${paidReference}`);

      if (transferClaim) {
        try {
          for (const split of checkout.sellerSplits) {
            if (!split.stripeAccountId) continue;
            const shareMajor = await convertFromNgn(
              split.sellerShare,
              chargeCurrency.toUpperCase()
            );
            const amount = toMinorUnits(shareMajor, chargeCurrency.toUpperCase());
            if (amount < 1) continue;
            await createConnectTransfer({
              amountMinor: amount,
              currency: chargeCurrency,
              destination: split.stripeAccountId,
              transferGroup: paidReference,
              reference: paidReference,
              sellerId: split.sellerId,
            });
          }
        } catch (error) {
          await releasePaymentReference(`stripe-transfer:${paidReference}`);
          throw error;
        }
      }

      if (createOrders || notify) {
        try {
          await createBackendOrders({
            createOrders,
            notify,
            items: checkout.items,
            billing: {
              ...checkout.billing,
              email:
                checkout.billing.email ||
                checkout.email ||
                session.customer_details?.email ||
                '',
            },
            reference: paidReference,
            amountNgn: checkout.amountNgn,
            authHeader,
            origin: request.nextUrl.origin,
            buyerEmail:
              checkout.email ||
              checkout.billing.email ||
              session.customer_details?.email ||
              undefined,
          });
        } catch (error) {
          if (createOrders) await releasePaymentReference(`backend:${paidReference}`);
          if (notify) await releasePaymentReference(`notify:${paidReference}`);
          throw error;
        }
      }

      return NextResponse.json({
        success: true,
        provider: 'stripe',
        payment: {
          reference: paidReference,
          amountNgn: checkout.amountNgn,
        },
        items: checkout.items,
      });
    }

    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    if (!reference) {
      return NextResponse.json({ message: 'Payment reference is required' }, { status: 400 });
    }

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
      provider: 'paystack',
      payment: summarizeVerifiedPayment(transaction),
      items: checkout.items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to verify payment';
    return NextResponse.json({ message }, { status: 400 });
  }
}
