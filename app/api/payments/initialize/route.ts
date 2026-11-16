import { NextRequest, NextResponse } from 'next/server';
import { validateCheckoutInput } from '@/lib/checkout';
import { buildOrderMetadata } from '@/lib/marketplaceOrders';
import { initializeTransaction } from '@/lib/paystack';
import { isPaystackConfigured, paystackPublicKey } from '@/lib/paymentConfig';
import { createMarketplaceCheckoutSession, isStripeConfigured } from '@/lib/stripeConnect';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || undefined;
    const body = await request.json();
    const { items, billing } = body;

    const checkout = await validateCheckoutInput({
      items,
      billing,
      authHeader,
    });

    const origin = request.nextUrl.origin;
    const callbackUrl =
      body.callbackUrl || `${origin}/checkout/success?reference=${checkout.reference}`;

    if (checkout.provider === 'stripe') {
      if (!isStripeConfigured()) {
        return NextResponse.json(
          { message: 'Card checkout is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      const names = checkout.items.map((item) => item.name).filter(Boolean);
      const description =
        names.length === 1
          ? names[0]
          : names.length > 1
            ? `Eraiiz order · ${names.length} items`
            : 'Eraiiz order';

      const session = await createMarketplaceCheckoutSession({
        reference: checkout.reference,
        email: checkout.email,
        amountKobo: checkout.amountKobo,
        description,
        successUrl: `${origin}/checkout/success?reference=${encodeURIComponent(checkout.reference)}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
        cancelUrl: `${origin}/checkout/payment`,
        metadata: {
          sellerIds: checkout.sellerSplits.map((split) => split.sellerId).join(',').slice(0, 500),
          amountNgn: String(checkout.amountNgn),
        },
      });

      if (!session.url) {
        return NextResponse.json(
          { message: 'We could not start checkout. Try again.' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        provider: 'stripe',
        reference: checkout.reference,
        authorizationUrl: session.url,
        sessionId: session.id,
        amount: checkout.amountNgn,
        amountKobo: checkout.amountKobo,
        email: checkout.email,
      });
    }

    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    const initialized = await initializeTransaction({
      email: checkout.email,
      amountKobo: checkout.amountKobo,
      reference: checkout.reference,
      callbackUrl,
      metadata: buildOrderMetadata(checkout),
      subaccount: checkout.splitSubaccounts.length === 1 ? checkout.subaccount : undefined,
      splitSubaccounts: checkout.splitSubaccounts,
    });

    return NextResponse.json({
      provider: 'paystack',
      publicKey: paystackPublicKey,
      reference: initialized.reference,
      accessCode: initialized.access_code,
      authorizationUrl: initialized.authorization_url,
      amount: checkout.amountNgn,
      amountKobo: checkout.amountKobo,
      email: checkout.email,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to initialize payment';
    return NextResponse.json({ message }, { status: 400 });
  }
}
