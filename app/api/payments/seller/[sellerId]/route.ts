import { NextRequest, NextResponse } from 'next/server';
import { getSellerPayout } from '@/lib/sellerPayoutStore';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    const payout = await getSellerPayout(sellerId);

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
