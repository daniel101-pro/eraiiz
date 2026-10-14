import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { userFacingStripeError } from '@/lib/stripeConnect';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { message: 'Checkout is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);
    const domain = process.env.DOMAIN || request.nextUrl.origin;

    // TODO: Set mode to "subscription" if selling recurring products.
    const mode = 'payment';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'hosted_page',
      mode,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: 'auto',
      integration_identifier: 'hosted_web_0002',
      origin_context: 'web',
      success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}`,
      line_items: [{ price: 'price_...', quantity: 1 }],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      return NextResponse.json(
        { message: 'We could not start checkout. Try again.' },
        { status: 502 }
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error('Stripe checkout session failed', error);
    const raw =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message)
        : '';
    const { message, status } = userFacingStripeError(error, undefined);
    return NextResponse.json(
      { message: raw.includes('No such price') ? 'Checkout is not set up yet. Please try another payment method.' : message },
      { status: raw.includes('No such price') ? 400 : status }
    );
  }
}
