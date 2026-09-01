import { NextRequest, NextResponse } from 'next/server';
import { validateCheckoutInput } from '@/lib/checkout';
import { initializeTransaction } from '@/lib/paystack';
import { isPaystackConfigured, paystackPublicKey } from '@/lib/paymentConfig';

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
    const { items, billing } = body;

    const checkout = await validateCheckoutInput({
      items,
      billing,
      authHeader,
    });

    const callbackUrl =
      body.callbackUrl ||
      `${request.nextUrl.origin}/checkout/success?reference=${checkout.reference}`;

    const initialized = await initializeTransaction({
      email: checkout.email,
      amountKobo: checkout.amountKobo,
      reference: checkout.reference,
      callbackUrl,
      metadata: {
        buyerEmail: checkout.email,
        itemCount: checkout.items.length,
        sellerCount: checkout.sellerSplits.length,
      },
      subaccount: checkout.splitSubaccounts.length === 1 ? checkout.subaccount : undefined,
      splitSubaccounts: checkout.splitSubaccounts,
    });

    return NextResponse.json({
      publicKey: paystackPublicKey,
      reference: initialized.reference,
      accessCode: initialized.access_code,
      authorizationUrl: initialized.authorization_url,
      amount: checkout.amountNgn,
      amountKobo: checkout.amountKobo,
      email: checkout.email,
      sellerSplits: checkout.sellerSplits,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to initialize payment';
    return NextResponse.json({ message }, { status: 400 });
  }
}
