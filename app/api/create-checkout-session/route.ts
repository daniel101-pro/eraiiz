import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ message: 'Stripe is not configured' }, { status: 503 });
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
    return NextResponse.json({ message: 'Checkout session did not return a URL' }, { status: 500 });
  }

  return NextResponse.redirect(session.url, 303);
}
