# Stripe Integration TODO

Hosted Stripe Checkout is wired up. Replace the placeholders below before taking this live.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | payment | Set to `"payment"` for one-time charges or `"subscription"` for recurring billing. |
| success_url | `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}` | Your actual post-payment success page URL. Keep the `{CHECKOUT_SESSION_ID}` template. Existing app success page: `/checkout/success`. |
| cancel_url | `${DOMAIN}` | Your actual cancel/return page URL (for example `/checkout/payment`). |
| line_items[].price | `price_...` | Your actual Stripe Price ID from the [Dashboard](https://dashboard.stripe.com/prices) or API. |

If you change `mode` to `"subscription"`, also add `payment_method_collection: "always"` to the Checkout Session params.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | hosted_page |
| billing_address_collection | auto |
| phone_number_collection.enabled | false |
| automatic_tax.enabled | false |
| allow_promotion_codes | false |
| submit_type | auto |
| integration_identifier | hosted_web_0002 |
| origin_context | web |

`payment_method_collection` is omitted because `mode` is `"payment"`. Include it only for subscriptions.

## Setup and next steps

### Environment variables

Set these in your secrets vault or local env (names must match the code):

| Variable | Used by |
|----------|---------|
| `STRIPE_SECRET_KEY` | [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts) (already used for Connect payouts) |
| `DOMAIN` | Success and cancel URLs in the Checkout Session |
| `STRIPE_WEBHOOK_SECRET` | Required for the Stripe webhook handler (not added yet) |
| `STRIPE_PUBLISHABLE_KEY` | Not required for hosted Checkout; keep for Dashboard alignment |

Use a [restricted API key](https://docs.stripe.com/keys.md#manage-your-api-keys) (`rk_`) with Checkout Sessions write permission. Store secrets in a vault in production ([key best practices](https://docs.stripe.com/keys-best-practices.md)).

See [.env.example](.env.example). Do not commit live keys.

### Project structure of new files

- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts) — `POST /api/create-checkout-session` creates a hosted Checkout Session and redirects `303` to `session.url`
- [STRIPE_INTEGRATION_TODO.md](STRIPE_INTEGRATION_TODO.md) — this file
- [.env.example](.env.example) — env name template
- `stripe` npm package (`^23.0.0`) — `ui_mode` is `hosted_page` (SDK 21+)

### How the integration works

1. Client `POST`s to `/api/create-checkout-session`.
2. The server creates a Stripe Checkout Session (`mode: payment`, hosted page).
3. The browser is redirected to Stripe-hosted Checkout.
4. After payment, Stripe sends the customer to `success_url`.
5. Fulfillment must run in a webhook, not only on the success page. Customers can pay and never load that page.

### Webhooks (required)

There is no Stripe Checkout webhook yet. Paystack uses `/api/payments/webhook`. Add a Stripe handler (for example `POST /api/stripe/webhook`) that:

- Verifies the signature with `STRIPE_WEBHOOK_SECRET`
- Handles `checkout.session.completed` and `checkout.session.async_payment_succeeded`
- Fulfills only when `payment_status` is not `unpaid`
- Handles `checkout.session.async_payment_failed`

Register the endpoint in [Workbench → Webhooks](https://dashboard.stripe.com/workbench/webhooks).

### Testing

Use test mode keys (`rk_test_` / `pk_test_`) until the live Stripe account is activated.

Test cards: https://docs.stripe.com/testing

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry and any CVC

### Next steps

1. Replace `price_...` with a real Price ID.
2. Point `success_url` / `cancel_url` / `DOMAIN` at real app routes.
3. Add the Stripe webhook and fulfill orders there.
4. Wire the checkout UI to `POST /api/create-checkout-session`.
5. Keep Connect seller onboarding (`/api/payments/stripe/connect`) separate from Checkout.
6. Activate the live Stripe platform account before creating live Connect accounts.

### Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- https://docs.stripe.com/payments/checkout
- https://docs.stripe.com/checkout/fulfillment
