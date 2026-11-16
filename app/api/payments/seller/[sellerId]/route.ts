import { NextRequest, NextResponse } from 'next/server';
import { findPaystackSubaccountForSeller, getSellerPayout } from '@/lib/sellerPayoutStore';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    let payout = await getSellerPayout(sellerId);

    if (!payout) {
      const paystackSubaccount = await findPaystackSubaccountForSeller({ ids: [sellerId] });
      if (paystackSubaccount) {
        payout = {
          userId: sellerId,
          provider: 'paystack',
          subaccountCode: paystackSubaccount.subaccount_code,
          accountName: paystackSubaccount.business_name,
          businessName: paystackSubaccount.business_name,
          bankCode: paystackSubaccount.settlement_bank,
          accountNumber: paystackSubaccount.account_number,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    if (!payout) {
      return NextResponse.json({ message: 'Seller payout not configured' }, { status: 404 });
    }

    return NextResponse.json({
      provider: payout.provider || (payout.stripeAccountId ? 'stripe' : 'paystack'),
      paystackSubaccountCode: payout.subaccountCode || null,
      stripeAccountId: payout.stripeAccountId || null,
      stripeDetailsSubmitted: Boolean(payout.stripeDetailsSubmitted),
      stripePayoutsEnabled: Boolean(payout.stripePayoutsEnabled),
      payoutAccountName: payout.accountName,
      payoutBusinessName: payout.businessName,
      payoutCountry: payout.country || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch seller payout';
    return NextResponse.json({ message }, { status: 500 });
  }
}
