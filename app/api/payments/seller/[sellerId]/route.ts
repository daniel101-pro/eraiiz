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
      paystackSubaccountCode: payout.subaccountCode,
      payoutAccountName: payout.accountName,
      payoutBusinessName: payout.businessName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch seller payout';
    return NextResponse.json({ message }, { status: 500 });
  }
}
